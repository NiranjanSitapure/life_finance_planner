import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useStore } from '../store/useStore'
import { sanitizeInputs } from '../engine/validate'
import { runProjection } from '../engine/model'

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

let saveTimer: ReturnType<typeof setTimeout> | null = null

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const loadCloudConfig = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/config`, { credentials: 'include' })
      if (!res.ok) return // no saved config yet — keep localStorage data
      const config = await res.json()
      const store = useStore.getState()
      if (config.inputs) {
        const sanitized = sanitizeInputs(config.inputs)
        const { rows, summary } = runProjection(sanitized)
        useStore.setState({
          inputs: sanitized,
          rows,
          summary,
          scenarios: Array.isArray(config.scenarios) ? config.scenarios : [],
          mode: config.mode ?? store.mode,
          showNominal: config.showNominal ?? store.showNominal,
        })
      }
    } catch { /* stay on localStorage */ }
  }, [])

  // Check if user is already logged in on mount
  useEffect(() => {
    fetch(`${API}/api/auth/me`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setUser(data)
          loadCloudConfig()
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [loadCloudConfig])

  const scheduleSave = useCallback(() => {
    if (!user) return
    if (saveTimer) clearTimeout(saveTimer)
    setSaveStatus('saving')
    saveTimer = setTimeout(async () => {
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
    await fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' })
    setUser(null)
    setSaveStatus('idle')
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, saveStatus }}>
      {children}
    </AuthContext.Provider>
  )
}
