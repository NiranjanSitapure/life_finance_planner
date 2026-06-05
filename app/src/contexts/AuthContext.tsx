import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import { useStore } from '../store/useStore'
import { sanitizeInputs } from '../engine/validate'
import { runProjection } from '../engine/model'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const STORE_KEY = 'life-finance-planner'

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const hydratedForUserId = useRef<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadCloudConfig = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/config`, { credentials: 'include' })
      if (!res.ok) return // store was reset before this call; defaults already in place
      const config = await res.json()
      if (config.inputs) {
        const sanitized = sanitizeInputs(config.inputs)
        const { rows, summary } = runProjection(sanitized)
        useStore.setState({
          inputs: sanitized,
          rows,
          summary,
          scenarios: Array.isArray(config.scenarios) ? config.scenarios : [],
          mode: 'simple',
          showNominal: config.showNominal ?? true,
        })
      }
    } catch { /* keep defaults */ }
  }, [])

  // Check session on mount
  useEffect(() => {
    fetch(`${API}/api/auth/me`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(async (data: AuthUser | null) => {
        if (data) {
          // Wipe any leftover in-memory data from a previous user/guest before loading this user's cloud config
          useStore.getState().resetAll()
          setUser(data)
          await loadCloudConfig()
          hydratedForUserId.current = data.id
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [loadCloudConfig])

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

  // Subscribe to store changes and auto-save
  useEffect(() => {
    if (!user) return
    const unsub = useStore.subscribe(() => scheduleSave())
    return unsub
  }, [user, scheduleSave])

  const login = () => {
    window.location.href = `${API}/api/auth/google`
  }

  const logout = async () => {
    // Block any pending or future saves immediately
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null }
    hydratedForUserId.current = null
    try {
      await fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' })
    } catch { /* clear locally regardless */ }
    setUser(null)
    setSaveStatus('idle')
    // Wipe in-memory + persisted data so the next user/guest starts clean
    useStore.getState().resetAll()
    try { localStorage.removeItem(STORE_KEY) } catch { /* ignore */ }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, saveStatus }}>
      {children}
    </AuthContext.Provider>
  )
}
