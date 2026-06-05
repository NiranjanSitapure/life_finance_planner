# Deploying Life Finance Planner

The app is two pieces:
- **Frontend** (`app/`) — static React SPA → deployed to **Vercel**
- **Backend** (`backend/`) — Express API + Postgres → deployed to **Railway**

Total setup time: ~15 minutes once you have accounts.

---

## Step 1 — Deploy the Backend to Railway

### 1a. Create the project

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select `life_finance_planner` and pick the branch `feature/google-auth`
4. **Settings → Root Directory** → set to `backend`
5. Railway auto-detects Node from `package.json` and uses `railway.json` for the build

### 1b. Add a Postgres database

1. In the same Railway project, click **+ New** → **Database** → **Add PostgreSQL**
2. Railway provisions it and automatically exposes `DATABASE_URL` as an env var
3. In your **backend service** → **Variables** → **Add Reference** → pick `DATABASE_URL` from the Postgres service

### 1c. Add the rest of the environment variables

In the backend service's **Variables** tab, add:

```
GOOGLE_CLIENT_ID=<from Google Cloud Console — see Step 3>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
JWT_SECRET=<run: openssl rand -hex 64>
FRONTEND_URL=<your Vercel URL, e.g. https://life-finance-planner.vercel.app>
NODE_ENV=production
```

**Note on FRONTEND_URL:** This can be a comma-separated list to allow preview deployments, e.g.:
```
FRONTEND_URL=https://life-finance-planner.vercel.app,https://life-finance-planner-git-feature-google-auth-yourname.vercel.app
```

### 1d. Get your public backend URL

1. Backend service → **Settings → Networking → Generate Domain**
2. Copy the URL, e.g. `https://life-finance-planner-production.up.railway.app`
3. Save this — you'll need it for Vercel and Google

### 1e. Trigger first deploy

Railway redeploys automatically on every push to `feature/google-auth`. The build runs:
- `npm install`
- `prisma generate`
- `npm run build` (TypeScript compile)
- `prisma migrate deploy` (applies schema to Postgres)
- `node dist/index.js`

Watch the logs — once you see `Backend running on port XXXX`, hit `https://your-railway-url/health` to confirm.

---

## Step 2 — Deploy the Frontend to Vercel

### 2a. Create the project

1. [vercel.com](https://vercel.com) → **Add New → Project** → import the same GitHub repo
2. **Root Directory** → set to `app`
3. Framework Preset → **Vite** (auto-detected)
4. Build command: `npm run build` (default)
5. Output directory: `dist` (default)

### 2b. Add environment variable

**Settings → Environment Variables**:

```
VITE_API_URL=https://your-railway-backend.up.railway.app
```

⚠️ **No trailing slash.** Apply to Production, Preview, and Development.

### 2c. Deploy

Vercel rebuilds on every push. Once green, open your Vercel URL.

---

## Step 3 — Configure Google OAuth

1. [console.cloud.google.com](https://console.cloud.google.com) → select/create a project
2. **APIs & Services → Library** → enable **Google People API**
3. **APIs & Services → OAuth consent screen** → External → fill in app name, support email → add scopes `openid`, `email`, `profile` → add yourself as a test user (or publish the app)
4. **APIs & Services → Credentials** → **Create Credentials → OAuth client ID** → Web application
5. **Authorized redirect URIs** — add **both**:
   ```
   http://localhost:3001/api/auth/google/callback
   https://your-railway-backend.up.railway.app/api/auth/google/callback
   ```
6. Copy **Client ID** and **Client Secret** → paste into Railway env vars from Step 1c
7. Railway will redeploy automatically

---

## Step 4 — Verify

1. Open your Vercel URL
2. Click **Sign in with Google**
3. Browser redirects to `https://your-railway-backend/api/auth/google`
4. Google consent screen → approve
5. Redirects back to your Vercel app with the avatar showing in the header
6. Adjust any slider → wait 2 seconds → **✓ Saved** appears
7. Open the app in a different browser → sign in → your values load

---

## Troubleshooting

### "localhost refused to connect" when clicking Sign in
`VITE_API_URL` isn't set on Vercel. Add it, then **redeploy** (env vars only apply to new builds — push an empty commit or hit "Redeploy" in the Vercel dashboard).

### "CORS: origin XXX not allowed"
Add the Vercel URL (including any preview URLs) to `FRONTEND_URL` on Railway as a comma-separated list. Restart the backend service.

### "Cookie not set" / login redirects but `/me` returns 401
- Make sure `NODE_ENV=production` is set on Railway (this triggers `sameSite=none, secure=true` for cross-site cookies)
- Confirm both frontend and backend are on HTTPS — `sameSite=none` cookies require it
- Confirm the Vercel domain in `FRONTEND_URL` matches the exact origin your browser is sending

### Database migration failed on deploy
`DATABASE_URL` is missing or wrong. Check Railway → backend → Variables → confirm the reference to the Postgres service is there.

### "redirect_uri_mismatch" from Google
The exact callback URL must be in the OAuth client's Authorized Redirect URIs list. Copy it from the error message and paste it verbatim.

---

## Costs

- **Railway:** $5/month free credit, enough for the backend + Postgres at low traffic. After that, ~$5/mo for hobby usage.
- **Vercel:** Free tier covers personal projects indefinitely.
- **Google OAuth:** Free.

For zero cost, you can swap Railway for **Render** (free tier, sleeps after 15min idle) or **Fly.io** (free tier, 3 shared-cpu VMs).

---

## Local Development

Unchanged. See `SETUP_AUTH.md` for the local setup flow.
