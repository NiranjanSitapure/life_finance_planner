# Full-Stack Auth Setup Guide

This guide walks you through running the Life Finance Planner with Google OAuth and PostgreSQL persistence.

## Prerequisites

- Node.js 18+
- A PostgreSQL database (local or hosted — Neon recommended for free tier)
- A Google Cloud project with OAuth 2.0 credentials

---

## Step 1: Google Cloud Console

1. Go to https://console.cloud.google.com and create or select a project.
2. Enable the **Google People API** (APIs & Services → Library → search "Google People API").
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**.
4. Application type: **Web application**.
5. Add Authorized redirect URIs:
   - Development: `http://localhost:3001/api/auth/google/callback`
   - Production: `https://your-domain.com/api/auth/google/callback`
6. Copy the **Client ID** and **Client Secret** — you'll need them below.

---

## Step 2: Database (Neon — Free Tier)

1. Create an account at https://neon.tech.
2. Create a new project → copy the **Connection string** (starts with `postgresql://`).
3. Use this as your `DATABASE_URL`.

Alternatively, run PostgreSQL locally:
```
postgresql://postgres:password@localhost:5432/life_finance_planner
```

---

## Step 3: Backend Setup

```bash
cd backend

# Copy and fill in environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations (creates tables)
npm run db:migrate

# Start dev server (http://localhost:3001)
npm run dev
```

### Generating JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the output as `JWT_SECRET` in `.env`.

---

## Step 4: Frontend Setup

```bash
cd app

# Copy and optionally edit the API URL
cp .env.example .env
# VITE_API_URL=http://localhost:3001 (default — no change needed for local dev)

# Install dependencies (if not already done)
npm install

# Start dev server (http://localhost:5173)
npm run dev
```

---

## Step 5: Verify Everything Works

1. Open http://localhost:5173 in your browser.
2. Click **Sign in with Google** in the top-right corner.
3. Complete the Google OAuth flow — you'll be redirected back to the app.
4. Your avatar/name should appear in the header.
5. Any changes to inputs are auto-saved to the database after a 2-second debounce.
6. The save status dot (amber = saving, green = saved) appears next to your avatar.

---

## Architecture Overview

```
app/ (React + Vite, port 5173)
  └── AuthContext.tsx        — OAuth login state + auto-save subscription
  └── components/auth/       — LoginButton, UserMenu, SaveStatusBadge

backend/ (Express + Prisma, port 3001)
  └── src/routes/auth.ts     — /api/auth/google, /callback, /me, /logout
  └── src/routes/config.ts   — /api/config (GET/PUT) + /versions
  └── src/services/          — configService with version history
  └── prisma/schema.prisma   — users, user_configs, config_versions tables
```

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/auth/google | — | Initiate Google OAuth |
| GET | /api/auth/google/callback | — | OAuth callback, sets cookie |
| GET | /api/auth/me | Cookie | Get current user |
| POST | /api/auth/logout | Cookie | Clear session cookie |
| GET | /api/config | Cookie | Load saved config |
| PUT | /api/config | Cookie | Save config (creates version snapshot) |
| GET | /api/config/versions | Cookie | List last 10 version snapshots |
| POST | /api/config/versions/:id/restore | Cookie | Restore a previous version |

## Guest Mode

Users who are not logged in continue to use localStorage for persistence — no change to existing behavior. Cloud sync only activates after signing in.
