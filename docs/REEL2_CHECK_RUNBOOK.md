# Reel 2 — Daily Ops Check

This campaign is separate from the protected Reel 1 `BRAND` automation.

## Prepare before posting

1. Pull the latest `pourandprompt-instagram-mvp` branch and rebuild the local stack.
2. Confirm `NEXTAUTH_URL` is the public HTTPS OpenReply origin, not localhost.
3. Run:

   ```bash
   docker compose -f docker-compose.local.yml exec dashboard npm run campaign:prepare-reel2
   ```

The command creates one active, whole-word `CHECK` campaign for the next Reel. It refuses to continue if `CHECK` already belongs to another campaign, and it never edits `BRAND`.

## Campaign settings

- Campaign: `Pour&Prompt — Reel 2 Daily Ops Check`
- Trigger: next Reel only
- Keyword: `CHECK`
- Match mode: whole word
- Public replies: enabled with three approved variations
- DM trigger: disabled
- Tracked destination: `/daily-ops-check` on the public OpenReply origin
- Button: `Get Daily Ops Check`
- Workbook: `Pour_and_Prompt_Daily_Ops_Check.xlsx`

## Posting and acceptance test

1. Post Reel 2 as the next Instagram Reel.
2. Wait for the scheduler to bind the campaign to the new Reel.
3. In OpenReply, confirm the campaign shows the Reel 2 post ID and is active.
4. From a second Instagram account, comment `CHECK`.
5. Confirm the public reply, DM, tracked button, landing page, and workbook download.
6. Confirm the send and click appear in OpenReply logs.

If the campaign does not bind to Reel 2, stop it before publishing another Reel and check the scheduler and Instagram connection.
