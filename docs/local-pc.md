# Pour&Prompt — Local PC setup

This runs the dashboard, worker, PostgreSQL, and Redis on the PC. Nothing is
hosted on Railway, Vercel, or another app platform.

## First start

1. Install Docker Desktop and start it.
2. In this project folder, copy `.env.local.example` to `.env.local`.
3. Replace the four `replace-with...` values with random secrets, then set your
   email and a dashboard password of at least 16 characters. Keep this file
   private. The stack refuses to start with placeholder or weak values.
4. Start everything:

   ```bash
   docker compose -f docker-compose.local.yml up --build -d
   ```

5. Open `http://localhost:3000` and enter the dashboard password. The worker
   and the scheduler start automatically and resume after a PC restart once
   Docker Desktop is running.

## What stays local

- PostgreSQL and Redis have no public ports.
- The dashboard is bound to `127.0.0.1`, so it opens only on this PC.
- Meta/Instagram credentials stay blank until the connection stage. Connect
  Instagram before creating the first campaign.

## Before connecting Instagram

Keep the current `NEXTAUTH_URL=http://localhost:3000` while this PC-only setup
is local. At the later Meta connection stage, Instagram requires a public HTTPS
origin for the webhook and OAuth login. Set `NEXTAUTH_URL` to that exact public
origin, and configure the same origin's OAuth redirect URL in Meta before
starting the connection. Do not expose Postgres, Redis, or the Docker control
panel to the internet.
