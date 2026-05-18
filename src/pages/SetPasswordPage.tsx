import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { FormMessage } from '../components/FormMessage'
import { apiSend, ApiError } from '../lib/api'

interface SetPasswordState {
  setupToken?: string
  email?: string
}

export function SetPasswordPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refresh } = useAuth()
  const state = useMemo(() => ((location.state ?? {}) as SetPasswordState), [location.state])
  const persistedState = useMemo(() => {
    const raw = sessionStorage.getItem('pending-password-setup')
    if (!raw) {
      return null
    }

    try {
      return JSON.parse(raw) as SetPasswordState
    } catch {
      return null
    }
  }, [])
  const queryState = useMemo<SetPasswordState>(() => ({
    setupToken: searchParams.get('token') ?? undefined,
    email: searchParams.get('email') ?? undefined,
  }), [searchParams])
  const activeState = state.setupToken ? state : (persistedState?.setupToken ? persistedState : queryState)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<'neutral' | 'success' | 'error'>('neutral')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (activeState?.setupToken) {
      sessionStorage.setItem('pending-password-setup', JSON.stringify(activeState))
    }
  }, [activeState])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeState?.setupToken) {
      setTone('error')
      setMessage('Your password setup session is missing. Please verify your email again.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      await apiSend('/api/auth/set-password', 'POST', {
        setupToken: activeState.setupToken,
        password,
        confirmPassword,
      })
      sessionStorage.removeItem('pending-password-setup')
      await refresh()
      navigate('/dashboard')
    } catch (error) {
      setTone('error')
      setMessage(error instanceof ApiError ? error.message : 'Failed to create password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <span className="eyebrow">Final setup</span>
        <h1>Create your password</h1>
        <p>{activeState?.email ? `Verified email: ${activeState.email}` : 'Finish creating your account password.'}</p>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 8 characters"
              required
            />
          </label>
          <label>
            Confirm password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </label>
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Saving...' : 'Create password'}
          </button>
        </form>
        <FormMessage message={message} tone={tone} />
        {!activeState?.setupToken ? (
          <p className="auth-footnote">
            Your setup token is gone. Head back to <Link to="/verify-email">verify email</Link> and request a new code.
          </p>
        ) : null}
      </div>
    </div>
  )
}
