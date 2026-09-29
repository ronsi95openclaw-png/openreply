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
directory, then starts `docker compose -p openreply --env-file .env.local -f
docker-compose.local.yml up -d` inside WSL. The reviewed clean checkout is
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

Only after those checks and an owner-approved cutover, start the clean checkout once with the same
project name. That deliberately reuses the two existing `openreply_*` volumes; do not supply a new
project name or run a second worker against the live Instagram account.

```powershell
wsl.exe -d Ubuntu --cd /mnt/c/Users/maste/.codex/worktrees/reel3-shift-canonical/openreply -- bash -lc 'docker compose -p openreply --env-file .env.local -f docker-compose.local.yml up -d --build'
wsl.exe -d Ubuntu --cd /mnt/c/Users/maste/.codex/worktrees/reel3-shift-canonical/openreply -- bash -lc 'docker compose -p openreply ps'
```

Smoke-check the dashboard, worker, scheduler, database, Redis, public HTTPS health endpoint, and
`${NEXTAUTH_URL}/shift-handoff`. Do not invoke a tracked redirect, webhook, campaign command, or
Instagram interaction as a smoke check. Only after those checks succeed, repoint the Scheduled Task
to the clean checkout's unchanged `scripts/start-openreply-wsl.ps1` and start it. Preserve the
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

If any smoke check fails, keep the task pointed at—or restore it to—the dirty deployment checkout,
then run that checkout's one-time `docker compose -p openreply --env-file .env.local -f
docker-compose.local.yml up -d --build` command to restore its images while retaining the same
volumes. To restore the task action, repeat the block above with `$candidate` set to
`C:\Users\maste\OneDrive\Documents\ChatGPT\openreply-reel2-deploy`, then recheck health before
restarting it. Do not delete the clean links, the old checkout, either named volume, or either
credential file until the owner has accepted the clean runtime.

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
