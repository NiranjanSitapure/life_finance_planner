# Life Finance Planner — Backend

Node.js + Express + Prisma + PostgreSQL backend with Google OAuth.

## Setup

1. Copy `.env.example` to `.env` and fill in credentials
2. Install dependencies: `npm install`
3. Generate Prisma client: `npm run db:generate`
4. Run migrations: `npm run db:migrate`
5. Start dev server: `npm run dev`

## Google Cloud Console Setup

1. Go to https://console.cloud.google.com
2. Create a new project (or select existing)
3. Enable **Google People API**
4. Go to **Credentials** → Create → OAuth 2.0 Client ID → Web application
5. Add Authorized redirect URIs:
   - Dev: `http://localhost:3001/api/auth/google/callback`
   - Prod: `https://your-domain.com/api/auth/google/callback`
6. Copy Client ID and Client Secret into `.env`

## Database (Neon — Recommended)

1. Create a free account at https://neon.tech
2. Create a new project → copy the connection string
3. Paste as `DATABASE_URL` in `.env`

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/auth/google | — | Initiate Google OAuth |
| GET | /api/auth/google/callback | — | OAuth callback |
| GET | /api/auth/me | Cookie | Current user |
| POST | /api/auth/logout | Cookie | Clear session |
| GET | /api/config | Cookie | Load saved config |
| PUT | /api/config | Cookie | Save config |
| GET | /api/config/versions | Cookie | List last 10 versions |
| POST | /api/config/versions/:id/restore | Cookie | Restore a version |
