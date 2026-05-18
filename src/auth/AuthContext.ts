import { createContext } from 'react'
import type { SessionUser } from '../lib/types'

export interface AuthContextValue {
  user: SessionUser | null
  ready: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
