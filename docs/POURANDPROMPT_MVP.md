# Pour&Prompt Instagram MVP

## Goal
Launch the first Pour&Prompt Instagram automation using OpenReply.

## MVP scope
- Instagram only
- Pour&Prompt connected as a Creator or Business account
- Comment keyword -> private DM
- DM keyword -> automated response
- Story reply keyword -> automated response
- Optional public comment reply
- Tracked resource link
- Initial keywords: `PROMPT`, `INVENTORY`, `COSTING`, `TRAINING`, `AUTOMATE`

## Architecture
- Vercel: Next.js web app, dashboard, OAuth callback, webhook endpoint
- Railway: worker, PostgreSQL, Redis
- Meta Developer App: Instagram Login plus `comments` and `messages` webhooks
- Resend or SMTP: magic-link login

## Deployment sequence

### 1. Railway
Create a new Railway project with:
- PostgreSQL
- Redis
- Worker service sourced from this repository

Worker commands:

```text
Build Command: npm run db:generate
Start Command: npm run worker
```

The worker should use Railway internal database and Redis URLs.

### 2. Generate secrets
Create:
- `NEXTAUTH_SECRET`
- `CRON_SECRET`
- `ENCRYPTION_KEY` using `openssl rand -hex 32`
- `WEBHOOK_VERIFY_TOKEN`

`ENCRYPTION_KEY` must be identical on the Vercel web app and Railway worker.

Never commit secrets to GitHub.

### 3. Vercel
Import this fork into Vercel.

Use:
- Railway PUBLIC Postgres URL for `DATABASE_URL`
- Railway PUBLIC Redis URL for `REDIS_URL`
- the exact same `ENCRYPTION_KEY` used by the worker

Deploy and keep the final `*.vercel.app` URL.

### 4. Database
Run the production migration once against the public PostgreSQL URL:

```bash
DATABASE_URL="postgresql://..." npm run db:migrate
```

### 5. Meta Developer App
Create a Business app using the use case:

`Manage messaging and content on Instagram`

Add the Pour&Prompt Instagram account as an Instagram tester and accept the tester invitation inside Instagram.

Set the OAuth callback to:

```text
https://<vercel-domain>/api/instagram/callback
```

Set the webhook callback to:

```text
https://<vercel-domain>/api/webhook
```

Subscribe to BOTH:
- `comments`
- `messages`

Set privacy, terms, and data deletion URLs using the pages already shipped with OpenReply.

### 6. Connect Pour&Prompt
Sign into OpenReply, then connect the Pour&Prompt Instagram account from Settings.

## First campaign

### Campaign
`Pour&Prompt — PROMPT MVP`

### Trigger
`PROMPT`

Enable the keyword for:
- Instagram comments
- Instagram DMs
- Story replies

### Public reply options
Rotate concise approved responses:
- `Sent — check your DMs.`
- `Got you. Check your inbox.`
- `On the way.`

### Private DM

```text
Got you, {username}. Here’s the Pour&Prompt resource. Built for restaurant + bar operators who want practical AI without the tech headache.
```

Attach the tracked lead-magnet/resource link once the first resource URL is ready.

## Acceptance test
Use a DIFFERENT Instagram account.

1. Comment `PROMPT` on a test Reel.
2. Confirm the public reply fires if enabled.
3. Confirm the private DM arrives.
4. Send `PROMPT` directly by DM.
5. Confirm the DM trigger fires.
6. Click the tracked resource link.
7. Confirm the send and click appear in OpenReply logs.

## Guardrails
- Do not enable generative AI for public replies in v1.
- Keep the first version deterministic: keyword -> approved response -> approved resource.
- Do not add TikTok until the Instagram MVP is stable.
- Never commit Meta secrets, database URLs, Redis URLs, SMTP credentials, or encryption keys.

## Phase 2
After the first funnel is validated:
- add resource routing for `INVENTORY`, `COSTING`, `TRAINING`, and `AUTOMATE`
- add lead capture and conversion analytics
- evaluate Composio as the agent/integration layer for higher-level inbox operations
