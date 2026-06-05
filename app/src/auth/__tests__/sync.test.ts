/**
 * @vitest-environment jsdom
 *
 * Regression bench for cross-user data isolation.
 *
 * The bug class we are guarding against:
 *   User A logs in → sets salary $X (auto-saved to cloud + localStorage).
 *   User A signs out.
 *   User B (a different Google account) signs in on the same browser.
 *   User B must NOT see $X — neither in the UI nor in localStorage,
 *   and a stray auto-save must NOT write A's data into B's cloud record.
 *
 * These tests exercise the real `useStore` + `applyAuthState` + `loadCloudConfig`
 * pipeline against an in-memory fetch mock and the jsdom localStorage.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useStore } from '../../store/useStore'
import { sanitizeInputs } from '../../engine/validate'
import { runProjection } from '../../engine/model'
import {
  APP_STORAGE_PREFIX,
  GUEST_STORAGE_KEY,
  applyAuthState,
  clearAllAppStorage,
  loadCloudConfig,
  storageKeyForUser,
  type AuthSyncDeps,
} from '../sync'

function buildDeps(fetchFn: typeof fetch): AuthSyncDeps {
  return {
    store: useStore as unknown as AuthSyncDeps['store'],
    sanitizeInputs,
    runProjection,
    storage: window.localStorage,
    fetchFn,
    api: 'http://test',
  }
}

// In-memory backend: each call to /api/config (GET) returns whatever the
// current "logged-in user" has saved. PUT writes for the current user.
function makeFakeBackend() {
  const db: Record<string, { inputs: { salary: number }, scenarios: unknown[], mode: string, showNominal: boolean }> = {}
  let currentUserId: string | null = null
  const setUser = (id: string | null) => { currentUserId = id }
  const fetchFn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString()
    if (url.endsWith('/api/auth/me')) {
      return currentUserId
        ? new Response(JSON.stringify({ id: currentUserId, email: `${currentUserId}@x.test`, name: currentUserId, avatarUrl: null }), { status: 200 })
        : new Response(null, { status: 401 })
    }
    if (url.endsWith('/api/config') && (!init || !init.method || init.method === 'GET')) {
      if (!currentUserId || !db[currentUserId]) return new Response(null, { status: 404 })
      return new Response(JSON.stringify(db[currentUserId]), { status: 200 })
    }
    if (url.endsWith('/api/config') && init?.method === 'PUT') {
      if (!currentUserId) return new Response(null, { status: 401 })
      const body = JSON.parse(init.body as string)
      db[currentUserId] = body
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }
    if (url.endsWith('/api/auth/logout')) {
      currentUserId = null
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }
    return new Response(null, { status: 404 })
  }) as unknown as typeof fetch
  return { fetchFn, setUser, db }
}

beforeEach(() => {
  window.localStorage.clear()
  useStore.getState().resetAll()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('storage key namespacing', () => {
  it('guest and user keys never collide', () => {
    expect(storageKeyForUser(null)).toBe(GUEST_STORAGE_KEY)
    expect(storageKeyForUser('alice')).toBe(`${APP_STORAGE_PREFIX}-user-alice`)
    expect(storageKeyForUser('alice')).not.toBe(storageKeyForUser('bob'))
  })
})

describe('cross-user isolation (regression bench)', () => {
  it('User B sees defaults after User A signs out, even if A had set values', async () => {
    const { fetchFn, setUser, db } = makeFakeBackend()
    const deps = buildDeps(fetchFn)

    // A signs in, no cloud config yet
    setUser('alice')
    await applyAuthState(deps, 'alice')
    await loadCloudConfig(deps)
    // A sets a salary; simulate auto-save by writing to fake cloud
    useStore.getState().setInputs({ salary: 999_000 })
    db['alice'] = { inputs: { salary: 999_000 }, scenarios: [], mode: 'simple', showNominal: true }

    // A signs out — full reset + storage wipe
    clearAllAppStorage(deps)
    await applyAuthState(deps, null)
    setUser(null)

    // After logout: store is reset and no user-namespaced data remains
    expect(useStore.getState().inputs.salary).not.toBe(999_000)
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (!k) continue
      // No user-keyed entries allowed; guest key may exist but must not contain leaked data
      expect(k.startsWith(`${APP_STORAGE_PREFIX}-user-`)).toBe(false)
      if (k === GUEST_STORAGE_KEY) {
        const raw = window.localStorage.getItem(k) ?? ''
        expect(raw.includes('999000')).toBe(false)
        expect(raw.includes('999,000')).toBe(false)
      }
    }

    // B signs in, no cloud config of their own
    setUser('bob')
    await applyAuthState(deps, 'bob')
    await loadCloudConfig(deps)

    // The smoking-gun assertion: B does not see A's salary
    expect(useStore.getState().inputs.salary).not.toBe(999_000)
  })

  it('A and B keep separate cloud records — switching back to A restores A; B stays B', async () => {
    const { fetchFn, setUser } = makeFakeBackend()
    const deps = buildDeps(fetchFn)
    const defaultSalary = useStore.getState().inputs.salary

    // A logs in, saves salary 111_000
    setUser('alice')
    await applyAuthState(deps, 'alice')
    await loadCloudConfig(deps)
    useStore.getState().setInputs({ salary: 111_000 })
    await fetchFn('http://test/api/config', {
      method: 'PUT',
      body: JSON.stringify({
        inputs: useStore.getState().inputs,
        scenarios: [],
        mode: 'simple',
        showNominal: true,
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    // logout + B login, saves salary 222_000
    clearAllAppStorage(deps); await applyAuthState(deps, null); setUser(null)
    setUser('bob')
    await applyAuthState(deps, 'bob')
    await loadCloudConfig(deps)
    expect(useStore.getState().inputs.salary).toBe(defaultSalary) // B starts fresh
    useStore.getState().setInputs({ salary: 222_000 })
    await fetchFn('http://test/api/config', {
      method: 'PUT',
      body: JSON.stringify({
        inputs: useStore.getState().inputs,
        scenarios: [],
        mode: 'simple',
        showNominal: true,
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    // Logout, back to A: A still has 111_000
    clearAllAppStorage(deps); await applyAuthState(deps, null); setUser(null)
    setUser('alice')
    await applyAuthState(deps, 'alice')
    await loadCloudConfig(deps)
    expect(useStore.getState().inputs.salary).toBe(111_000)

    // Logout, back to B: B still has 222_000 (A did not overwrite B)
    clearAllAppStorage(deps); await applyAuthState(deps, null); setUser(null)
    setUser('bob')
    await applyAuthState(deps, 'bob')
    await loadCloudConfig(deps)
    expect(useStore.getState().inputs.salary).toBe(222_000)
  })

  it('per-user localStorage keys do not collide on disk', async () => {
    const { fetchFn, setUser } = makeFakeBackend()
    const deps = buildDeps(fetchFn)

    setUser('alice')
    await applyAuthState(deps, 'alice')
    useStore.getState().setInputs({ salary: 123_456 })
    // Wait a tick so zustand persist flushes
    await new Promise(r => setTimeout(r, 10))

    // Switch to B
    setUser('bob')
    await applyAuthState(deps, 'bob')
    useStore.getState().setInputs({ salary: 777_777 })
    await new Promise(r => setTimeout(r, 10))

    // Both users should have separate persisted entries
    const aliceRaw = window.localStorage.getItem(storageKeyForUser('alice'))
    const bobRaw = window.localStorage.getItem(storageKeyForUser('bob'))
    expect(aliceRaw).toBeTruthy()
    expect(bobRaw).toBeTruthy()
    expect(aliceRaw).not.toEqual(bobRaw)
    // The guest key must not contain any user data
    expect(window.localStorage.getItem(GUEST_STORAGE_KEY)).toBeFalsy()
  })

  it('logout wipes every life-finance-planner-* key', async () => {
    const { fetchFn, setUser } = makeFakeBackend()
    const deps = buildDeps(fetchFn)

    setUser('alice')
    await applyAuthState(deps, 'alice')
    useStore.getState().setInputs({ salary: 88_888 })
    await new Promise(r => setTimeout(r, 10))

    // Plant a stale key from a previous user too, to make sure logout sweeps it
    window.localStorage.setItem(`${APP_STORAGE_PREFIX}-user-stale`, 'leftover')

    clearAllAppStorage(deps)

    // After sweep: no app-prefixed keys remain
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (k) expect(k.startsWith(APP_STORAGE_PREFIX)).toBe(false)
    }
  })

  it('does not preserve a previous user data into a new account when cloud is empty', async () => {
    // Direct reproduction of the original bug report
    const { fetchFn, setUser } = makeFakeBackend()
    const deps = buildDeps(fetchFn)

    // A logs in, sets a value (no save needed — the mere in-memory state)
    setUser('alice')
    await applyAuthState(deps, 'alice')
    useStore.getState().setInputs({ salary: 555_555 })
    await new Promise(r => setTimeout(r, 10))

    // A logs out
    clearAllAppStorage(deps)
    await applyAuthState(deps, null)
    setUser(null)

    // B logs in for the first time
    setUser('bob')
    await applyAuthState(deps, 'bob')
    await loadCloudConfig(deps) // 404 from fake backend → defaults retained

    expect(useStore.getState().inputs.salary).not.toBe(555_555)
  })
})
