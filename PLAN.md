# OpenReply

## Set up safe Instagram reply campaigns {#campaigns}
tech: Scoped campaign configuration and exact post binding.
files: [scripts/prepare-reel3-shift.ts, scripts/bind-reel3-shift.ts, scripts/repair-reel3-shift-link.ts, lib/reel3-shift/**, __tests__/reel3-shift.test.ts]
needs: [accounts]
links: [landing-page, delivery]
- [x] Make the staged SHIFT campaign use the canonical handoff page safely {#campaigns-reel3-canonical}
  by: codex
  from: agent
- [x] Make the staged SHIFT commands refuse stale or wrong-account writes {#campaigns-reel3-atomic-safety}
  by: codex
  from: agent
- [x] Bind a recreated SHIFT campaign only when its verified configuration still matches {#campaigns-reel3-recreated-bind}
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
- [x] Keep the live follow gate and webhook subscriptions in the deployment source {#delivery-live-runtime-parity}
  by: codex
  from: agent

## Give managers the handoff prompt {#landing-page}
tech: Canonical public page with a compatibility redirect.
files: [app/shift-handoff/**, app/shift-handoff-prompt/**, app/restaurant-ai-brand-kit/copy-prompt-button.tsx, __tests__/shift-handoff-route.test.ts]
links: [campaigns, delivery]
- [x] Publish one canonical Shift Handoff Prompt page with a safe legacy redirect {#landing-page-canonical-shift}
  by: codex
  from: agent

## Keep the local stack operational {#local-runtime}
tech: Docker Compose, Prisma, dashboard, worker, and scheduler.
files: [Dockerfile, docker-compose.local.yml, scripts/start-openreply-wsl.ps1, scripts/resolve-wsl-path.ps1, __tests__/local-runtime.test.ts, docs/local-pc.md]
needs: [delivery]
- [x] Leave the live Docker stack and database untouched during this code-only change {#local-runtime-no-live-change}
  by: codex
- [x] Start only the reviewed app services during a no-migration cutover {#local-runtime-no-migrate-cutover}
  by: codex
  from: agent
- [x] Convert the scheduled task's Windows checkout path safely inside WSL {#local-runtime-wsl-path}
  by: codex
  from: agent

## Record the Reel 3 publishing gates {#runbook}
tech: Owner-facing operational runbook for asset approval, deployment, repair, staging, and exact-post binding.
files: [docs/REEL3_SHIFT_RUNBOOK.md, PLAN.md]
needs: [campaigns, landing-page]
- [x] Document deployment and post gates without deploying, posting, or changing live campaigns {#runbook-reel3-gates}
  by: codex
  from: agent
- [x] Make the clean-runtime cutover and rollback explicitly migration-safe {#runbook-no-migrate-cutover}
  by: codex
  from: agent
- [x] Keep rollback manual until its old task has a reviewed safe launcher {#runbook-safe-rollback-task}
  by: codex
  from: agent
- [x] Stop the old task before switching services and keep it stopped through rollback {#runbook-stop-unsafe-task}
  by: codex
  from: agent

## decisions

- 2026-09-28: `/shift-handoff` is the one canonical Reel 3 destination. The former `/shift-handoff-prompt` path remains only as a compatibility redirect so public links do not break.
- 2026-09-28: Repairing the existing staged SHIFT link must be a deliberately guarded, idempotent command; it is not run as part of this code-only change.
- 2026-09-28: SHIFT repair and binding must make one conditional database write that repeats every checked campaign, tracked-link, and connected-account precondition; a stale snapshot must refuse rather than mutate a changed record.
- 2026-09-28: BRAND is protected and currently has legacy `matchAnyPost: true`; this task must not change it. CHECK remains isolated and unchanged.
- 2026-09-28: The one-time staged-link repair stays fixed to the original campaign and link identifiers, while exact binding must use the sole currently verified prepared SHIFT campaign and link so an intentionally recreated valid configuration can proceed safely.
- 2026-09-28: Final Reel 3 asset, caption, profile-grid-safe cover, and audio approval remain owner gates. No Reel video is created in this implementation.
- 2026-09-28: A clean-runtime cutover or rollback must never use normal Compose dependency startup: dashboard and worker depend on `migrate`, so only an owner-approved schema-state check followed by `up --no-deps` for the explicit app services can keep migration execution separate.
- 2026-09-28: The old deployment checkout's task launcher is not treated as migration-safe. Until it has its own reviewed launcher, a rollback may restart app services through the explicit no-dependency command but must not restore or start that checkout's Scheduled Task.
- 2026-09-28: The old `OpenReply WSL Runtime` task both keeps WSL alive after sign-in and launches plain Compose, which can run migrations. An owner-approved no-migration cutover must stop and disable that task before manual app-only recovery; leave it stopped throughout rollback and use only explicit `--no-deps` recovery until the owner separately approves a reviewed migration-safe launcher.
