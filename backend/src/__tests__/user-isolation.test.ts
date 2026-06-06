/**
 * Backend regression bench: cross-user data isolation
 *
 * Automated equivalent of the Comet browser test script — same 9 checkpoints,
 * no browser required, runs in CI in ~300ms using supertest + in-memory Prisma mock.
 *
 * Checkpoint mapping:
 *   A1  GET /api/config for fresh User A → 404 (no saved config yet)
 *   A2  PUT /api/config salary=444444 → stored under A's row only
 *   A3  After logout (cookie cleared), A's DB row is preserved
 *   B1  GET /api/config for User B → 404, body has NO trace of 444444  ← bug check
 *   B1  User B's ID differs from User A's
 *   B2  PUT /api/config salary=222222 for B → B's row=222222, A's still=444444
 *   A4  A re-authenticates → GET returns 444444 (not 222222, not default 75000)
 *   B3  B re-authenticates → GET returns 222222 (not 444444, not default 75000)
 */

import { describe, it, expect, vi, beforeAll } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import passport from 'passport'

// ─── In-memory Prisma mock ────────────────────────────────────────────────────
type ConfigRow = {
  id: string; userId: string; inputs: object; simpleModeInputs?: object
  scenarios: object; mode: string; showNominal: boolean; schemaVersion: number
  savedAt: Date; updatedAt: Date
}
type VersionRow = { id: string; userId: string; snapshot: object; label?: string; createdAt: Date }

const db = {
  userConfig: new Map<string, ConfigRow>(),
  configVersion: [] as VersionRow[],
  user: new Map<string, { id: string; googleId: string; email: string; name: string; avatarUrl: string | null }>(),
}

let _seq = 0
const uid = () => `id-${++_seq}`

// Mock prisma before any app module loads
vi.mock('../db/client', () => ({
  prisma: {
    userConfig: {
      findUnique: vi.fn(({ where }: { where: { userId: string } }) =>
        Promise.resolve(db.userConfig.get(where.userId) ?? null)),
      upsert: vi.fn(({ where, create, update }: {
        where: { userId: string }
        create: Omit<ConfigRow, 'id' | 'savedAt' | 'updatedAt'>
        update: Partial<ConfigRow>
      }) => {
        const existing = db.userConfig.get(where.userId)
        const now = new Date()
        const row: ConfigRow = existing
          ? { ...existing, ...update, updatedAt: now }
          : { id: uid(), savedAt: now, updatedAt: now, ...create }
        db.userConfig.set(where.userId, row)
        return Promise.resolve(row)
      }),
    },
    configVersion: {
      create: vi.fn(({ data }: { data: Omit<VersionRow, 'id' | 'createdAt'> }) => {
        const row: VersionRow = { id: uid(), createdAt: new Date(), ...data }
        db.configVersion.push(row)
        return Promise.resolve(row)
      }),
      findMany: vi.fn(({ where, skip, take }: {
        where?: { userId?: string }; skip?: number; take?: number
      }) => {
        let rows = db.configVersion.filter(r => !where?.userId || r.userId === where.userId)
        rows = rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        if (skip) rows = rows.slice(skip)
        if (take) rows = rows.slice(0, take)
        return Promise.resolve(rows)
      }),
      deleteMany: vi.fn(({ where }: { where: { id: { in: string[] } } }) => {
        const toDelete = new Set(where.id.in)
        const before = db.configVersion.length
        db.configVersion.splice(0, db.configVersion.length,
          ...db.configVersion.filter(r => !toDelete.has(r.id)))
        return Promise.resolve({ count: before - db.configVersion.length })
      }),
    },
    user: {
      findUnique: vi.fn(({ where }: { where: { id?: string; googleId?: string } }) => {
        const u = where.id
          ? db.user.get(where.id)
          : [...db.user.values()].find(u => u.googleId === where.googleId)
        return Promise.resolve(u ?? null)
      }),
      upsert: vi.fn(({ where, create }: {
        where: { googleId: string }
        create: { googleId: string; email: string; name: string; avatarUrl?: string }
        update: object
      }) => {
        const existing = [...db.user.values()].find(u => u.googleId === where.googleId)
        const row = existing ?? { id: uid(), avatarUrl: null, ...create }
        db.user.set(row.id, row)
        return Promise.resolve(row)
      }),
    },
  },
}))

// ─── Build a minimal test app that mirrors index.ts without env.ts validation ─
// This avoids the process.exit(1) that env.ts triggers when DATABASE_URL etc.
// are not real production values. All logic (routes, auth, config) is real.

const TEST_JWT_SECRET = 'test-secret-at-least-16-chars-long'

async function buildTestApp() {
  const { authRouter } = await import('../routes/auth')
  const { configRouter } = await import('../routes/config')

  const app = express()
  app.set('trust proxy', 1)
  app.use(cors({ origin: true, credentials: true }))
  app.use(express.json())
  app.use(cookieParser())
  app.use(passport.initialize())
  app.use('/api/auth', authRouter)
  app.use('/api/config', configRouter)
  app.get('/health', (_req, res) => res.json({ ok: true }))
  return app
}

// Swap the JWT secret that auth.ts and requireAuth.ts read so signing + verifying use the same key
vi.mock('../env', () => ({
  env: {
    DATABASE_URL: 'postgresql://u:p@localhost:5432/test',
    JWT_SECRET: TEST_JWT_SECRET,
    FRONTEND_URL: 'http://localhost:5173',
    GOOGLE_CLIENT_ID: 'test-client-id',
    GOOGLE_CLIENT_SECRET: 'test-client-secret',
    GOOGLE_CALLBACK_URL: undefined,
    PORT: 0,
    NODE_ENV: 'test',
  },
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cookieFor(userId: string) {
  return `token=${jwt.sign({ userId }, TEST_JWT_SECRET, { expiresIn: '1h' })}`
}

function makePayload(salary: number) {
  return {
    inputs: { salary },
    simpleModeInputs: { salary, currentAge: 28, retirementAge: 65, totalSavings: 25000, lifestyle: 'comfortable' },
    scenarios: [], mode: 'simple', showNominal: true, schemaVersion: 1,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('Cross-user data isolation (regression bench)', () => {
  let app: express.Express

  const USER_A = 'user-alice-001'
  const USER_B = 'user-bob-002'
  const SALARY_A = 444_444
  const SALARY_B = 222_222
  const DEFAULT_SALARY = 75_000

  beforeAll(async () => {
    db.user.set(USER_A, { id: USER_A, googleId: 'goog-a', email: 'a@test.com', name: 'User A', avatarUrl: null })
    db.user.set(USER_B, { id: USER_B, googleId: 'goog-b', email: 'b@test.com', name: 'User B', avatarUrl: null })
    app = await buildTestApp()
  })

  // Reset DB rows between tests (not the user seed)
  beforeAll(() => {
    db.userConfig.clear()
    db.configVersion.length = 0
  })

  // A1 ─────────────────────────────────────────────────────────────────────────
  it('A1: fresh User A login → GET /api/config returns 404 (no cloud config)', async () => {
    const res = await request(app).get('/api/config').set('Cookie', cookieFor(USER_A))
    expect(res.status).toBe(404)
  })

  // A2 ─────────────────────────────────────────────────────────────────────────
  it('A2: User A saves salary 444444 → stored under A\'s row only, B has nothing', async () => {
    db.userConfig.clear()
    const res = await request(app).put('/api/config').set('Cookie', cookieFor(USER_A)).send(makePayload(SALARY_A))
    expect(res.status).toBe(200)
    expect(db.userConfig.has(USER_A)).toBe(true)
    expect(db.userConfig.has(USER_B)).toBe(false)
  })

  // A3 ─────────────────────────────────────────────────────────────────────────
  it('A3: after logout, A\'s DB row is preserved (logout = cookie clear, not data wipe)', async () => {
    db.userConfig.clear()
    await request(app).put('/api/config').set('Cookie', cookieFor(USER_A)).send(makePayload(SALARY_A))
    const logoutRes = await request(app).post('/api/auth/logout').set('Cookie', cookieFor(USER_A))
    expect(logoutRes.status).toBe(200)
    expect((db.userConfig.get(USER_A)!.inputs as { salary: number }).salary).toBe(SALARY_A)
  })

  // B1 — THE BUG CHECK ─────────────────────────────────────────────────────────
  it('B1 (bug check): User B logs in after A → GET /api/config returns 404, no trace of A\'s salary', async () => {
    db.userConfig.clear()
    await request(app).put('/api/config').set('Cookie', cookieFor(USER_A)).send(makePayload(SALARY_A))
    const res = await request(app).get('/api/config').set('Cookie', cookieFor(USER_B))
    expect(res.status).toBe(404)
    expect(JSON.stringify(res.body)).not.toContain(String(SALARY_A))
  })

  it('B1: User A and User B have different IDs and JWT payloads', () => {
    expect(USER_A).not.toBe(USER_B)
    const pA = jwt.verify(jwt.sign({ userId: USER_A }, TEST_JWT_SECRET), TEST_JWT_SECRET) as { userId: string }
    const pB = jwt.verify(jwt.sign({ userId: USER_B }, TEST_JWT_SECRET), TEST_JWT_SECRET) as { userId: string }
    expect(pA.userId).not.toBe(pB.userId)
  })

  // B2 ─────────────────────────────────────────────────────────────────────────
  it('B2: User B saves 222222 → B row=222222, A row still=444444, no cross-contamination', async () => {
    db.userConfig.clear()
    await request(app).put('/api/config').set('Cookie', cookieFor(USER_A)).send(makePayload(SALARY_A))
    const res = await request(app).put('/api/config').set('Cookie', cookieFor(USER_B)).send(makePayload(SALARY_B))
    expect(res.status).toBe(200)
    expect((db.userConfig.get(USER_B)!.inputs as { salary: number }).salary).toBe(SALARY_B)
    expect((db.userConfig.get(USER_A)!.inputs as { salary: number }).salary).toBe(SALARY_A)
    expect(JSON.stringify(db.userConfig.get(USER_B)!)).not.toContain(String(SALARY_A))
  })

  // A4 ─────────────────────────────────────────────────────────────────────────
  it('A4 (round-trip): A re-logs in → GET returns 444444, not 222222, not default 75000', async () => {
    db.userConfig.clear()
    await request(app).put('/api/config').set('Cookie', cookieFor(USER_A)).send(makePayload(SALARY_A))
    await request(app).put('/api/config').set('Cookie', cookieFor(USER_B)).send(makePayload(SALARY_B))
    const res = await request(app).get('/api/config').set('Cookie', cookieFor(USER_A))
    expect(res.status).toBe(200)
    const salary = (res.body.inputs as { salary: number }).salary
    expect(salary).toBe(SALARY_A)
    expect(salary).not.toBe(SALARY_B)
    expect(salary).not.toBe(DEFAULT_SALARY)
    expect((res.body.simpleModeInputs as { salary: number }).salary).toBe(SALARY_A)
  })

  // B3 ─────────────────────────────────────────────────────────────────────────
  it('B3 (round-trip): B re-logs in → GET returns 222222, not 444444, not default 75000', async () => {
    db.userConfig.clear()
    await request(app).put('/api/config').set('Cookie', cookieFor(USER_A)).send(makePayload(SALARY_A))
    await request(app).put('/api/config').set('Cookie', cookieFor(USER_B)).send(makePayload(SALARY_B))
    const res = await request(app).get('/api/config').set('Cookie', cookieFor(USER_B))
    expect(res.status).toBe(200)
    const salary = (res.body.inputs as { salary: number }).salary
    expect(salary).toBe(SALARY_B)
    expect(salary).not.toBe(SALARY_A)
    expect(salary).not.toBe(DEFAULT_SALARY)
  })

  // Security basics ─────────────────────────────────────────────────────────────
  it('forged JWT (wrong secret) → 401', async () => {
    const forgery = jwt.sign({ userId: USER_B }, 'wrong-secret')
    const res = await request(app).get('/api/config').set('Cookie', `token=${forgery}`)
    expect(res.status).toBe(401)
  })

  it('no token → 401', async () => {
    expect((await request(app).get('/api/config')).status).toBe(401)
  })

  it('/health → 200 without auth', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})
