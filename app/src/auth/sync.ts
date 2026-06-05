// Pure orchestration for auth-driven storage isolation.
// Each user gets their own localStorage key so a different user's data can
// never appear in another user's session — the keys themselves don't collide.

import type { ModelInputs } from '../engine/types'

export const GUEST_STORAGE_KEY = 'life-finance-planner-guest'
export const APP_STORAGE_PREFIX = 'life-finance-planner'

export function storageKeyForUser(userId: string | null): string {
  return userId ? `${APP_STORAGE_PREFIX}-user-${userId}` : GUEST_STORAGE_KEY
}

// Minimal shape we depend on so tests can pass mocks without pulling in zustand internals.
export interface PersistApi {
  setOptions: (opts: { name: string }) => void
  rehydrate: () => Promise<void> | void
  clearStorage: () => void
}

export interface StoreLike {
  getState: () => { resetAll: () => void; showNominal: boolean }
  setState: (partial: Record<string, unknown>) => void
  persist: PersistApi
}

export interface AuthSyncDeps {
  store: StoreLike
  sanitizeInputs: (raw: unknown) => ModelInputs
  runProjection: (inputs: ModelInputs) => { rows: unknown[]; summary: unknown }
  storage: Pick<Storage, 'removeItem' | 'key' | 'length'> | null
  fetchFn: typeof fetch
  api: string
}

// Switch the persist key to the one owned by `userId` (or guest), then rehydrate.
// Always wipes the in-memory store first so no leftover data from the previous
// session is visible during the brief window before rehydrate completes.
export async function applyAuthState(deps: AuthSyncDeps, userId: string | null): Promise<void> {
  // Switch keys FIRST so the in-memory reset doesn't leak defaults into the
  // previously-active key (which could be another user's namespace).
  deps.store.persist.setOptions({ name: storageKeyForUser(userId) })
  deps.store.getState().resetAll()
  await deps.store.persist.rehydrate()
}

// Remove every key the app could have written under any user — used on logout
// so a different account on the same browser cannot see prior data even by
// inspecting localStorage. Includes the persist key currently in use.
export function clearAllAppStorage(deps: AuthSyncDeps): void {
  const storage = deps.storage
  if (!storage) return
  const toDelete: string[] = []
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i)
    if (k && k.startsWith(APP_STORAGE_PREFIX)) toDelete.push(k)
  }
  for (const k of toDelete) storage.removeItem(k)
  try { deps.store.persist.clearStorage() } catch { /* persist may be unset */ }
}

interface CloudConfig {
  inputs?: unknown
  simpleModeInputs?: unknown
  scenarios?: unknown
  mode?: string
  showNominal?: boolean
}

// Load the authenticated user's cloud config and overlay it onto the store.
// If the server has no config (404), the freshly-reset defaults stay in place.
export async function loadCloudConfig(deps: AuthSyncDeps): Promise<void> {
  try {
    const res = await deps.fetchFn(`${deps.api}/api/config`, { credentials: 'include' })
    if (!res.ok) return
    const config = await res.json() as CloudConfig
    if (!config?.inputs) return
    const sanitized = deps.sanitizeInputs(config.inputs)
    const { rows, summary } = deps.runProjection(sanitized)
    const patch: Record<string, unknown> = {
      inputs: sanitized,
      rows,
      summary,
      scenarios: Array.isArray(config.scenarios) ? config.scenarios : [],
      mode: 'simple',
      showNominal: config.showNominal ?? deps.store.getState().showNominal,
    }
    // The Basic-mode UI renders from simpleModeInputs; without restoring it,
    // re-login shows defaults even though the cloud has the user's data.
    if (config.simpleModeInputs && typeof config.simpleModeInputs === 'object') {
      patch.simpleModeInputs = config.simpleModeInputs
    }
    deps.store.setState(patch)
  } catch { /* keep defaults */ }
}
