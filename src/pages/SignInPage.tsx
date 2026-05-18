import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { FormMessage } from '../components/FormMessage'
import { apiSend, ApiError } from '../lib/api'

export function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { refresh } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const targetPath = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      await apiSend('/api/auth/sign-in', 'POST', { email, password })
      await refresh()
      navigate(targetPath, { replace: true })
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Unable to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <span className="eyebrow">Welcome back</span>
        <h1>Sign in to your dashboard</h1>
        <p>Use your verified email and password to open your project workspace.</p>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <FormMessage message={message} tone={message ? 'error' : 'neutral'} />
        <p className="auth-footnote">
          Need an account? <Link to="/sign-up">Create one here</Link>.
        </p>
      </div>
    </div>
  )
}
