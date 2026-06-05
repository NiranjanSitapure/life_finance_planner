# Claude Code: Mandatory Post-Push Checks

After every push to `claude/happy-sagan-aZ01Q` (the production branch), you MUST verify both deployment pipelines and iterate until they pass.

## What to check after every push

1. **GitHub Actions CI** (`.github/workflows/ci.yml`)
   - Workflow runs two jobs:
     - `Test & Build` — frontend (vitest + vite build + tsc)
     - `Backend Build (mirrors Railway)` — `npm ci && npx prisma generate && npm run build`
   - Use `mcp__github__actions_list` with `method: list_workflow_runs`, `workflow_runs_filter: { branch: "claude/happy-sagan-aZ01Q" }` to fetch latest runs.
   - The latest run's `head_sha` must match your just-pushed commit and its `conclusion` must be `success`.

2. **Railway** (backend deploy)
   - Railway auto-deploys from this branch using `backend/.nixpacks.toml` (install `npm ci` → build `prisma generate && npm run build` → start `prisma db push --accept-data-loss --skip-generate && node dist/index.js`).
   - The Backend Build CI job mirrors Railway's build phase, so if it passes, Railway's build will too. Healthcheck (`/health`) requires `DATABASE_URL` env var to be linked from the Postgres service — that's a Railway UI config issue, not a code fix.

3. **Vercel** (frontend deploy)
   - Vercel auto-deploys from this branch, root dir `app/`, framework Vite.
   - The frontend `Test & Build` CI job runs `tsc -b && vite build` — the same command Vercel runs. If CI is green, Vercel build will be green.

## The loop

If either CI job fails:
1. Read the failure with `mcp__github__actions_list` → `method: list_workflow_jobs`, then `mcp__github__get_job_logs` for the failing job.
2. Reproduce locally if possible (`cd app && npm run build` or `cd backend && npm ci && npx prisma generate && npm run build`).
3. Fix the root cause in code (not by disabling the check).
4. Commit + push. Repeat the verification.

Do NOT report a task as done while CI is red on the latest commit.

## Common gotchas

- `npm ci` requires `package-lock.json` in the working directory. Both `app/` and `backend/` must keep their lockfiles committed.
- `backend/.gitignore` excludes `node_modules/`, `dist/`, `.env`. Never `git add backend/node_modules` or `backend/dist`.
- Backend uses `prisma db push` (not `migrate deploy`) since there are no migration files. Don't change to `migrate deploy` without first generating migration files.
- Frontend's regression test suite (`app/src/auth/__tests__/sync.test.ts`) guards cross-user data isolation. Don't loosen those assertions to make a failing build pass — fix the underlying isolation break.

## How to monitor

After `git push`, wait ~30 seconds for the run to register, then:

```
mcp__github__actions_list method=list_workflow_runs resource_id=ci.yml \
  workflow_runs_filter={"branch":"claude/happy-sagan-aZ01Q"} per_page=3
```

Match the top result's `head_sha` to your push. If `status: in_progress`, wait another ~60s and re-check. Once `status: completed`, `conclusion` must be `success`.
