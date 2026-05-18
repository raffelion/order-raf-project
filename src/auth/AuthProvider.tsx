import { useEffect, useState, type PropsWithChildren } from 'react'
import { apiGet, apiSend } from '../lib/api'
import type { SessionUser } from '../lib/types'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [ready, setReady] = useState(false)

  async function refresh() {
    try {
      const payload = await apiGet<{ ok: true; user: SessionUser }>('/api/auth/me')
      setUser(payload.user)
    } catch {
      setUser(null)
    } finally {
      setReady(true)
    }
  }

  async function signOut() {
    await apiSend('/api/auth/sign-out', 'POST')
    setUser(null)
  }

  useEffect(() => {
    let cancelled = false

    void apiGet<{ ok: true; user: SessionUser }>('/api/auth/me')
      .then((payload) => {
        if (!cancelled) {
          setUser(payload.user)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setReady(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AuthContext value={{ user, ready, refresh, signOut }}>
      {children}
    </AuthContext>
  )
}
