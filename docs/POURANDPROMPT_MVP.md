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
- Local PC: dashboard, webhook endpoint, worker, scheduler, PostgreSQL, Redis
- Local password login: one Pour&Prompt administrator; no email delivery service
- Meta Developer App: Instagram Login plus `comments` and `messages` webhooks
- Secure HTTPS tunnel: only added after local testing, so Meta can reach the
  locally hosted webhook endpoint

## Deployment sequence

### 1. Start the local PC stack
Follow [the local PC guide](local-pc.md). It starts PostgreSQL, Redis, the
dashboard, the DM worker, and the scheduler with one Docker command. The
database and Redis are private to Docker; the dashboard is only available on
this PC at `http://localhost:3000`.

### 2. Confirm the local dashboard
Sign in with the local dashboard password. Do not enter Meta credentials yet.

### 3. Prepare a public webhook URL
After the local stack is healthy, create a secure HTTPS tunnel that points only
to the dashboard's webhook endpoint. Do not expose PostgreSQL, Redis, or the
Docker control panel.

### 4. Meta Developer App
Create a Business app using the use case:

`Manage messaging and content on Instagram`

Add the Pour&Prompt Instagram account as an Instagram tester and accept the tester invitation inside Instagram.

Set the OAuth callback to:

```text
https://<public-https-url>/api/instagram/callback
```

Set the webhook callback to:

```text
https://<public-https-url>/api/webhook
```

Subscribe to BOTH:
- `comments`
- `messages`

Set privacy, terms, and data deletion URLs using the pages already shipped with OpenReply.

### 5. Connect Pour&Prompt
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
