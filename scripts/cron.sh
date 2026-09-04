#!/bin/sh
# Scheduler for the periodic jobs under /api/cron.
#
# On Vercel these run from the "crons" block in vercel.json. Nothing reads that
# file anywhere else, so a self-hosted instance has no scheduler at all and the
# jobs simply never run — silently. The one that hurts is refresh-tokens: the
# Instagram token expires and every automation stops without a single error.
#
# Run as its own container from the app image (see the compose file), so the
# jobs live with the app they belong to and keep working even if every other
# stack on the host is taken down.

set -u

BASE_URL="${CRON_BASE_URL:-http://web:3000}"
# Same fallback as the routes themselves: they accept either secret.
SECRET="${CRON_SECRET:-${NEXTAUTH_SECRET:-}}"
HEARTBEAT_FILE="${CRON_HEARTBEAT_FILE:-/tmp/openreply-cron-heartbeat}"
REQUEST_TIMEOUT_SECONDS="${CRON_REQUEST_TIMEOUT_SECONDS:-30}"
MAX_ATTEMPTS="${CRON_MAX_ATTEMPTS:-4}"
RETRY_DELAY_SECONDS="${CRON_RETRY_DELAY_SECONDS:-2}"
DASHBOARD_WAIT_ATTEMPTS="${CRON_DASHBOARD_WAIT_ATTEMPTS:-60}"

if [ -z "$SECRET" ]; then
  echo "[cron] neither CRON_SECRET nor NEXTAUTH_SECRET is set — the routes would answer 401" >&2
  exit 1
fi

record_heartbeat() {
  # Compose healthchecks read this timestamp. Updating it inside request retry
  # loops means a slow but still-running scheduler is not mistaken for a dead
  # process.
  touch "$HEARTBEAT_FILE"
}

wait_for_dashboard() {
  attempt=1

  while [ "$attempt" -le "$DASHBOARD_WAIT_ATTEMPTS" ]; do
    record_heartbeat
    if wget -q --spider --timeout=10 "$BASE_URL/api/health"; then
      echo "[cron] dashboard health check passed"
      return 0
    fi

    echo "[cron] waiting for dashboard health (attempt $attempt/$DASHBOARD_WAIT_ATTEMPTS)" >&2
    sleep 5
    attempt=$((attempt + 1))
  done

  echo "[cron] dashboard never became healthy; exiting so the container can restart" >&2
  return 1
}

call() {
  route="$1"
  attempt=1
  delay="$RETRY_DELAY_SECONDS"

  while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
    record_heartbeat
    stamp=$(date -u '+%Y-%m-%d %H:%M:%S')

    if body=$(wget -q -O- --timeout="$REQUEST_TIMEOUT_SECONDS" \
        --header="Authorization: Bearer $SECRET" \
        "$BASE_URL/api/cron/$route" 2>&1); then
      echo "[cron] $stamp $route ok $body"
      return 0
    fi

    exit_code=$?
    echo "[cron] $stamp $route FAILED (attempt $attempt/$MAX_ATTEMPTS, exit $exit_code) ${body:-no response}" >&2

    if [ "$attempt" -lt "$MAX_ATTEMPTS" ]; then
      sleep "$delay"
      delay=$((delay * 2))
    fi
    attempt=$((attempt + 1))
  done

  # The caller decides whether a failed job should be retried in the next
  # schedule window. Never claim that a failed request completed.
  return 1
}

echo "[cron] scheduler started, target $BASE_URL"
wait_for_dashboard || exit 1

last_slot=""
last_refresh_daily=""
last_snapshot_daily=""

while true; do
  now=$(date -u '+%Y-%m-%d %H:%M')
  today=${now% *}
  hhmm=${now#* }
  hour=${hhmm%:*}
  minute=${hhmm#*:}

  # attach-next-reel every 5 minutes rather than once a day: a campaign created
  # before its reel is published stays inert until this binds it, and a daily
  # run would cost the whole first evening of comments.
  case "$minute" in
    00|05|10|15|20|25|30|35|40|45|50|55)
      if [ "$last_slot" != "$hhmm" ]; then
        if call attach-next-reel; then
          last_slot="$hhmm"
        fi
      fi
      ;;
  esac

  # Once a day, early: the token refresh has a 10-day window before expiry, so
  # the exact hour does not matter — only that it happens every day.
  if [ "$hour" = "05" ]; then
    if [ "$last_refresh_daily" != "$today" ] && call refresh-tokens; then
      last_refresh_daily="$today"
    fi
    if [ "$last_snapshot_daily" != "$today" ] && call snapshot-followers; then
      last_snapshot_daily="$today"
    fi
  fi

  # Half a minute: short enough never to skip a slot, long enough to stay idle.
  record_heartbeat
  sleep 30
done
