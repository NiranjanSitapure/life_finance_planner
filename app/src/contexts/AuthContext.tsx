import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import { useStore } from '../store/useStore'
import { sanitizeInputs } from '../engine/validate'
import { runProjection } from '../engine/model'
import {
  applyAuthState,
  clearAllAppStorage,
  loadCloudConfig as loadCloudConfigImpl,
  type AuthSyncDeps,
} from '../auth/sync'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export interface AuthUser {
  id: string
  email: string
  name: string
  avatarUrl: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: () => void
  logout: () => Promise<void>
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: async () => {},
  saveStatus: 'idle',
})

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}

function buildDeps(): AuthSyncDeps {
  return {
    store: useStore,
    sanitizeInputs,
    runProjection,
    storage: typeof window !== 'undefined' ? window.localStorage : null,
    fetchFn: (...args) => fetch(...args),
    api: API,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const hydratedForUserId = useRef<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initial session resolution: switch persist key per user, then load cloud
  useEffect(() => {
    const deps = buildDeps()
    let cancelled = false
    ;(async () => {
      try {
        const res = await deps.fetchFn(`${API}/api/auth/me`, { credentials: 'include' })
        const data: AuthUser | null = res.ok ? await res.json() : null
        if (cancelled) return
        await applyAuthState(deps, data ? data.id : null)
        if (data) {
          await loadCloudConfigImpl(deps)
          hydratedForUserId.current = data.id
          setUser(data)
        }
      } catch { /* leave as guest */ }
      finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const scheduleSave = useCallback(() => {
    if (!user || hydratedForUserId.current !== user.id) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaveStatus('saving')
    saveTimer.current = setTimeout(async () => {
      const { inputs, simpleModeInputs, scenarios, mode, showNominal } = useStore.getState()
      try {
        const res = await fetch(`${API}/api/config`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs, simpleModeInputs, scenarios, mode, showNominal, schemaVersion: 1 }),
        })
        setSaveStatus(res.ok ? 'saved' : 'error')
        if (res.ok) setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('error')
      }
    }, 2000)
  }, [user])

  useEffect(() => {
    if (!user) return
    const unsub = useStore.subscribe(() => scheduleSave())
    return unsub
  }, [user, scheduleSave])

  const login = () => {
    window.location.href = `${API}/api/auth/google`
  }

  const logout = async () => {
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null }
    hydratedForUserId.current = null
    const deps = buildDeps()
    try {
      await deps.fetchFn(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' })
    } catch { /* clear locally regardless */ }
    setUser(null)
    setSaveStatus('idle')
    // Wipe every app storage key and the in-memory store, then rehydrate as guest
    clearAllAppStorage(deps)
    await applyAuthState(deps, null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, saveStatus }}>
      {children}
    </AuthContext.Provider>
  )
}
