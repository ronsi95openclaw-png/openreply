# Reel 3 — Shift Handoff

This campaign is separate from the protected Reel 1 `BRAND` automation and the Reel 2 `CHECK` automation.

## Prepare before posting

1. Pull the latest `pourandprompt-instagram-mvp` branch and rebuild the local stack.
2. Confirm `NEXTAUTH_URL` is the public HTTPS OpenReply origin, not localhost.
3. Confirm Reel 2 `CHECK` is no longer waiting for the next Reel. Only one campaign should be pending next-Reel attachment.
4. Run:

   ```bash
   docker compose -f docker-compose.local.yml exec dashboard npm run campaign:prepare-reel3
   ```

The command creates one active, whole-word `SHIFT` campaign for the next Reel. It refuses to continue if `SHIFT` belongs to another campaign and never edits `BRAND` or `CHECK`.

## Campaign settings

- Campaign: `Pour&Prompt — Reel 3 Shift Handoff`
- Trigger: next Reel only
- Keyword: `SHIFT`
- Match mode: whole word
- Public replies: enabled with three approved variations
- DM trigger: disabled
- Tracked destination: `/shift-handoff` on the public OpenReply origin
- Button: `Get Shift Handoff Prompt`
- Delivery: copyable Shift Handoff prompt with no-invention and privacy guardrails

## Posting and acceptance test

1. Open the public `/shift-handoff` page on a phone and copy the prompt.
2. In OpenReply, confirm the worker heartbeat and Instagram webhook health.
3. Post Reel 3 as the next Instagram Reel.
4. Confirm the campaign binds to the Reel 3 post ID and is no longer pending.
5. From a second Instagram account, comment `SHIFT`.
6. Confirm the public reply, DM, tracked button, landing page, and copy button.
7. Confirm the send and click appear in OpenReply logs.

If Reel 2 `CHECK` is still pending, or `SHIFT` does not bind to Reel 3, stop before publishing another Reel and resolve the pending-next-Reel conflict.
