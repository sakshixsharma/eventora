# EVENTORA - College Event Management System

EVENTORA is a Node.js/Express application for managing college events, registrations, attendance, and reports.

## Tech Stack

- **Backend:** Node.js 20+, Express
- **Database:** PostgreSQL (`pg`, `connect-pg-simple` for session storage)
- **Security:** Helmet, express-session, CSRF protection, rate limiting

## Project Structure

```text
.
├── server.js
├── package.json
├── package-lock.json
├── render.yaml
├── .env.example
├── public/
│   └── uploads/
└── src/
    ├── config/
    ├── middleware/
    └── routes/
```

> Note: This repository snapshot contains the server bootstrap and deployment configuration. If you restore the full application modules, keep them under `src/` and static assets under `public/`.

## Local Setup

1. **Install Node.js 20+**.
2. **Install dependencies**:
   ```bash
   npm ci
   ```
3. **Create environment file**:
   ```bash
   cp .env.example .env
   ```
   Fill in real values, especially `DATABASE_URL` and `SESSION_SECRET`.
4. **Start the app**:
   ```bash
   npm run dev
   ```
   Or production mode:
   ```bash
   npm start
   ```

## Environment Variables

See `.env.example` for the full list. Required for production:

- `NODE_ENV=production`
- `PORT` (Render provides this automatically)
- `SESSION_SECRET` (long random string)
- `DATABASE_URL` (PostgreSQL connection string)
- `CLIENT_ORIGIN` (allowed frontend origin)
- `PGSSLMODE` (usually `require` on managed Postgres)

Optional/placeholders depending on your setup:

- `JWT_SECRET`
- `INSFORGE_API_KEY`

## Health Check

`GET /health` returns:

```json
{ "status": "ok" }
```

Use this for Render health checks.

## Render Deployment

1. Push the repository to GitHub/GitLab.
2. In Render, create a **Web Service** from the repo (or use `render.yaml` Blueprint).
3. Configure:
   - **Runtime:** Node
   - **Build Command:** `npm ci`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
4. Set environment variables in the Render dashboard (see below; mark secrets as secret/sync false).
5. Deploy. Render will set `PORT`; the app listens on `0.0.0.0:$PORT`.

### Render Environment Variables (Dashboard)

Set these in Render:

- `NODE_ENV` = `production`
- `SESSION_SECRET` = **secret**
- `DATABASE_URL` = **secret** (Postgres connection string)
- `CLIENT_ORIGIN` = your deployed frontend/origin URL
- `PGSSLMODE` = `require`
- `JWT_SECRET` = **secret** (if used by your app modules)
- `INSFORGE_API_KEY` = **secret** (only if used)

`PORT` is provided by Render automatically; do not hardcode it.

## Production Notes

- The app sets `trust proxy` for secure cookies behind Render's proxy.
- Sessions use PostgreSQL via `connect-pg-simple` (not in-memory).
- Cookies are `httpOnly`, `sameSite=lax`, and `secure` in production.
- CSRF uses a double-submit cookie (`eventora.x-csrf-token`) and requires `x-csrf-token` on non-GET `/api` requests.
- Do **not** commit `.env`, cookies, logs, or `node_modules`.

## Git Commands (Terminal)

```bash
git init
git add .
git commit -m "Prepare Eventora for Render deployment"
git branch -M main
git remote add origin <YOUR_GIT_REMOTE_URL>
git push -u origin main
```

If the repo already exists:

```bash
git add .
git commit -m "Fix Render startup and production config"
git push
```
