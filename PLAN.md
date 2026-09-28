# OpenReply

## Set up safe Instagram reply campaigns {#campaigns}
tech: Scoped campaign configuration and exact post binding.
files: [scripts/prepare-reel3-shift.ts, scripts/bind-reel3-shift.ts, scripts/repair-reel3-shift-link.ts, lib/reel3-shift/**, __tests__/reel3-shift.test.ts]
needs: [accounts]
links: [landing-page, delivery]
- [x] Make the staged SHIFT campaign use the canonical handoff page safely {#campaigns-reel3-canonical}
  by: codex
  from: agent

## Keep Instagram accounts protected {#accounts}
tech: Connected-account selection and Meta permalink verification.
files: [lib/meta/**, lib/instagram-accounts.ts, app/api/instagram/**]
links: [campaigns, delivery]
- [x] Keep BRAND protected and preserve its legacy matching setting {#accounts-brand-protected}
  by: codex

## Deliver replies without guessing {#delivery}
tech: Comment and DM worker with explicit keyword matching.
files: [worker/**, lib/queue/**, lib/tracking/**]
needs: [campaigns, accounts]
links: [landing-page]
- [x] Keep CHECK isolated from the SHIFT campaign {#delivery-check-isolated}
  by: codex

## Give managers the handoff prompt {#landing-page}
tech: Canonical public page with a compatibility redirect.
files: [app/shift-handoff/**, app/shift-handoff-prompt/**, app/restaurant-ai-brand-kit/copy-prompt-button.tsx, __tests__/shift-handoff-route.test.ts]
links: [campaigns, delivery]
- [x] Publish one canonical Shift Handoff Prompt page with a safe legacy redirect {#landing-page-canonical-shift}
  by: codex
  from: agent

## Keep the local stack operational {#local-runtime}
tech: Docker Compose, Prisma, dashboard, worker, and scheduler.
files: [Dockerfile, docker-compose.local.yml, docs/local-pc.md]
needs: [delivery]
- [x] Leave the live Docker stack and database untouched during this code-only change {#local-runtime-no-live-change}
  by: codex

## Record the Reel 3 publishing gates {#runbook}
tech: Owner-facing operational runbook for asset approval, deployment, repair, staging, and exact-post binding.
files: [docs/REEL3_SHIFT_RUNBOOK.md, PLAN.md]
needs: [campaigns, landing-page]
- [x] Document deployment and post gates without deploying, posting, or changing live campaigns {#runbook-reel3-gates}
  by: codex
  from: agent

## decisions

- 2026-09-28: `/shift-handoff` is the one canonical Reel 3 destination. The former `/shift-handoff-prompt` path remains only as a compatibility redirect so public links do not break.
- 2026-09-28: Repairing the existing staged SHIFT link must be a deliberately guarded, idempotent command; it is not run as part of this code-only change.
- 2026-09-28: BRAND is protected and currently has legacy `matchAnyPost: true`; this task must not change it. CHECK remains isolated and unchanged.
- 2026-09-28: Final Reel 3 asset, caption, profile-grid-safe cover, and audio approval remain owner gates. No Reel video is created in this implementation.
