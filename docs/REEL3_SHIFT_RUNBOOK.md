# Reel 3 — Shift Handoff Prompt

Reel 3 delivers the free Shift Handoff Prompt. Its one canonical public destination is
`${NEXTAUTH_URL}/shift-handoff`. The old `/shift-handoff-prompt` path remains a
compatibility redirect only; do not use it in a new script, caption, button, or campaign.

`BRAND` is protected and currently has legacy `matchAnyPost: true`. Do not change it in
this work. `CHECK` remains isolated and unchanged.

## Owner production gate — before publishing

Final asset, caption, cover, and audio are owner decisions. No Reel video is created by
this implementation.

- [ ] One approved 9:16 master (1080×1920) opens with `STOP OPENING BLIND.`, includes a
  clear 1–2 second pattern interrupt, and ends with `COMMENT SHIFT — I’LL DM YOU THE PROMPT.`
- [ ] The final caption keeps the exact `SHIFT` keyword and the privacy/anonymization promise.
- [ ] A legible Pour&Prompt cover keeps `CLOSING NOTES ≠ A HANDOFF` readable in Instagram's
  profile-grid crop.
- [ ] The final audio is approved, including the first-second sound accent.

Use fictional or fully anonymized notes in all footage and screen captures. Do not show
guest or employee names, contact details, schedules, medical details, or private operating records.

## Deployment gate — before any campaign action

1. Deploy the reviewed, committed application change using the normal owner-approved process.
2. Confirm `${NEXTAUTH_URL}/shift-handoff` returns the Shift Handoff Prompt and its Copy Prompt button.
3. Confirm `${NEXTAUTH_URL}/shift-handoff-prompt` redirects to `/shift-handoff`.
4. Do not deploy Docker, modify the database, prepare, bind, repair, or post as part of this
   code review. Those are separate owner-approved operational actions.

## Deployment handoff — reviewed clean worktree only

This is an operational procedure for the owner to use after approving the committed change. It was
documented from a read-only inspection; it does not authorize changing the Scheduled Task, Docker,
Compose, the database, or either credential file during code review.

The running Compose project is named `openreply` and owns the existing named volumes
`openreply_pgdata` and `openreply_redisdata`. Its current Scheduled Task, `OpenReply WSL Runtime`,
runs `scripts/start-openreply-wsl.ps1` from the dirty deployment checkout
`C:\Users\maste\OneDrive\Documents\ChatGPT\openreply-reel2-deploy`. That script resolves its own
directory, then starts the explicitly named `dashboard`, `worker`, and `cron` services with
`--no-deps` inside WSL. The reviewed clean checkout is
`C:\Users\maste\.codex\worktrees\reel3-shift-canonical\openreply`.

The clean checkout needs references to the existing untracked credential files because the Compose
file loads `.env.local` and `.env.local-admin` by paths relative to its own root. Do not copy their
contents, print them, or create an override file containing them. After owner approval, make file
links from the clean checkout to the existing files instead:

```powershell
$current = 'C:\Users\maste\OneDrive\Documents\ChatGPT\openreply-reel2-deploy'
$candidate = 'C:\Users\maste\.codex\worktrees\reel3-shift-canonical\openreply'
New-Item -ItemType SymbolicLink -Path "$candidate\.env.local" -Target "$current\.env.local"
New-Item -ItemType SymbolicLink -Path "$candidate\.env.local-admin" -Target "$current\.env.local-admin"
```

First run the committed candidate's checks, then validate its Compose configuration without starting
or replacing services:

```powershell
Set-Location 'C:\Users\maste\.codex\worktrees\reel3-shift-canonical\openreply'
npm ci
npm test
npm run lint
npm run typecheck
npm run build
wsl.exe -d Ubuntu --cd /mnt/c/Users/maste/.codex/worktrees/reel3-shift-canonical/openreply -- bash -lc 'docker compose -p openreply --env-file .env.local -f docker-compose.local.yml config --quiet'
```

### Migration decision — inspect first; do not run one by accident

The Compose file makes `dashboard` and `worker` depend on `migrate` completing successfully. A
plain `docker compose up` can therefore invoke `npm run db:migrate`. Do not use it for this
cutover or rollback.

First confirm that the existing `postgres` and `redis` containers are healthy; they and their
existing `openreply_*` volumes must stay running throughout this special no-migration restart.
Then inspect the candidate migration state with a transient command that overrides the `migrate`
service command. `run ... migrate <command>` does **not** use the service's configured
`npm run db:migrate` command when an explicit command follows it, and `--no-deps` prevents Compose
from starting its dependencies:

```powershell
wsl.exe -d Ubuntu --cd /mnt/c/Users/maste/.codex/worktrees/reel3-shift-canonical/openreply -- bash -lc 'docker compose -p openreply --env-file .env.local -f docker-compose.local.yml ps postgres redis'
wsl.exe -d Ubuntu --cd /mnt/c/Users/maste/.codex/worktrees/reel3-shift-canonical/openreply -- bash -lc 'docker compose -p openreply --env-file .env.local -f docker-compose.local.yml run --rm --no-deps --build migrate sh -lc "node scripts/validate-local-env.mjs && npx prisma migrate status"'
```

If `migrate status` reports pending migrations, stop. Capture its output and obtain fresh owner
approval for the exact migration before running any migration command. After that separate,
approved migration and a second clean `migrate status`, return to this runbook. If it reports the
database is current, obtain the owner’s approval for the no-migration cutover below. No status
result authorizes a migration implicitly.

### Owner-approved no-migration cutover

Start only the three app services with the existing project name. `--no-deps` is intentional: it
prevents Compose from following the `dashboard`/`worker` dependency on `migrate`. Because the
database, Redis, and schema were just confirmed healthy and current, the app services can safely
reconnect to the already-running dependencies without asking Compose to start them. Do not supply a
new project name or run a second worker against the live Instagram account.

```powershell
wsl.exe -d Ubuntu --cd /mnt/c/Users/maste/.codex/worktrees/reel3-shift-canonical/openreply -- bash -lc 'docker compose -p openreply --env-file .env.local -f docker-compose.local.yml up -d --build --no-deps dashboard worker cron'
wsl.exe -d Ubuntu --cd /mnt/c/Users/maste/.codex/worktrees/reel3-shift-canonical/openreply -- bash -lc 'docker compose -p openreply ps'
```

Smoke-check the dashboard, worker, scheduler, database, Redis, public HTTPS health endpoint, and
`${NEXTAUTH_URL}/shift-handoff`. Do not invoke a tracked redirect, webhook, campaign command, or
Instagram interaction as a smoke check. Only after those checks succeed, repoint the Scheduled Task
to the clean checkout's reviewed `scripts/start-openreply-wsl.ps1` and start it. Preserve the
task's existing trigger, principal, and settings; change only its action.

```powershell
$candidate = 'C:\Users\maste\.codex\worktrees\reel3-shift-canonical\openreply'
$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$candidate\scripts\start-openreply-wsl.ps1`"" `
  -WorkingDirectory $candidate
Stop-ScheduledTask -TaskName 'OpenReply WSL Runtime'
Set-ScheduledTask -TaskName 'OpenReply WSL Runtime' -Action $action
Start-ScheduledTask -TaskName 'OpenReply WSL Runtime'
```

If any smoke check fails before the Scheduled Task is changed, leave the task action alone. If the
task has already been changed to the clean checkout, stop it. Do **not** repoint `OpenReply WSL
Runtime` at the old checkout or start it: its existing launcher uses plain `docker compose up -d`,
which may invoke `migrate`.

A rollback is manual until the old checkout has its own separately reviewed migration-safe launcher.
First reconfirm the existing database and Redis are healthy and the schema is current. Then, with
owner approval, start only the old app services through this explicit no-dependency command:

```powershell
$rollback = 'C:\Users\maste\OneDrive\Documents\ChatGPT\openreply-reel2-deploy'
wsl.exe -d Ubuntu --cd /mnt/c/Users/maste/OneDrive/Documents/ChatGPT/openreply-reel2-deploy -- bash -lc 'docker compose -p openreply --env-file .env.local -f docker-compose.local.yml up -d --build --no-deps dashboard worker cron'
```

Recheck health before considering the rollback complete. This command preserves the same volumes and
cannot start the Compose `migrate` service, but it does not restore automatic restart after sign-in.
Keep `OpenReply WSL Runtime` stopped and pointed away from the old checkout until a reviewed
migration-safe rollback launcher is available and the owner approves its use. Do not delete the
clean links, the old checkout, either named volume, or either credential file until the owner has
accepted the clean runtime.

## Repair the existing staged link — only after deployment approval

The known staged SHIFT link may still point at `${NEXTAUTH_URL}/shift-handoff-prompt`.
Only after the canonical page is deployed and the owner authorizes the operational repair, run:

```bash
docker compose -p openreply --env-file .env.local -f docker-compose.local.yml exec -T \
  -e INSTAGRAM_ACCOUNT_ID="<pourandprompt-account-id>" \
  dashboard npm run campaign:repair-reel3-link
```

The repair command is intentionally narrow. It requires the selected account, exactly one
known SHIFT campaign (`cmucup4v800006mnyn3rt5kzw`), its known tracked link (`VwV7X0fsTg`), the
known legacy destination, and an inactive,
unbound campaign with the expected keyword, match, reply, DM, and button settings. It changes
only that one destination to `${NEXTAUTH_URL}/shift-handoff`. A repeat run writes nothing and
reports `already_correct`. Any unexpected account, campaign, link count, destination, flag, or
post binding stops without a write.

## Prepare only if the staged record was deliberately removed

The normal path is repair, not preparation. If the specific staged campaign has been deliberately
removed, use the preparation command only with the owner’s approval:

```bash
docker compose -p openreply --env-file .env.local -f docker-compose.local.yml exec -T \
  -e INSTAGRAM_ACCOUNT_ID="<pourandprompt-account-id>" \
  dashboard npm run campaign:prepare-reel3
```

It creates—or reports `already_staged` only for—one inactive, unbound campaign whose sole tracked
link is `${NEXTAUTH_URL}/shift-handoff`, keyword is exactly `SHIFT`, whole-word matching and public
replies are enabled, `matchAnyPost`, `matchAnyWord`, and DM triggering are disabled, and the button
label is exactly `Get Shift Handoff Prompt`. It refuses ambiguity and unsafe state.

## Bind immediately after the owner publishes Reel 3

1. The owner manually publishes the approved Reel from `@pourandprompt`.
2. Copy its exact public permalink and compare it with the approved master, caption, cover, and audio.
3. Run the exact-bind command:

   ```bash
   docker compose -p openreply --env-file .env.local -f docker-compose.local.yml exec -T \
     -e INSTAGRAM_ACCOUNT_ID="<pourandprompt-account-id>" \
     -e REEL3_POST_URL="https://www.instagram.com/reel/your-reel-shortcode/" \
     dashboard npm run campaign:bind-reel3
   ```

Before activation, bind rechecks every staged SHIFT setting above and the canonical
`${NEXTAUTH_URL}/shift-handoff` destination. It then verifies the exact permalink against the selected
account’s recent Reels. Its one conditional write matches the specific sole campaign and sole link
just verified—including their current IDs, link slug, destination, selected account, and every staged
flag—and succeeds only when exactly one row is affected. This intentionally supports a valid
campaign recreated by preparation; only the one-time legacy-link repair remains fixed to the original
staged identifiers. Bind refuses unsafe or changed state and never auto-binds to the next Reel.
Preserve its JSON output showing `bound`, the campaign ID, exact post ID, exact permalink, and
`active: true`.

## Acceptance test after live approval

Use a genuine second Instagram account to comment `SHIFT`; then verify the public reply, DM,
tracked button, canonical landing page, Copy Prompt behavior, and click log. Confirm `BRAND` and
`CHECK` remain unchanged. Never simulate that sequence or call it complete without the real result.
