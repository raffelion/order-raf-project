import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiSend, ApiError } from '../lib/api'
import { FormMessage } from '../components/FormMessage'

interface VerifyLocationState {
  email?: string
  devCode?: string
}

export function VerifyEmailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = (location.state ?? {}) as VerifyLocationState
  const [email, setEmail] = useState(state.email ?? '')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState(state.devCode ? `Dev code: ${state.devCode}` : '')
  const [tone, setTone] = useState<'neutral' | 'success' | 'error'>(state.devCode ? 'success' : 'neutral')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const result = await apiSend<{
        ok: true
        setupToken: string
      }>('/api/auth/verify-code', 'POST', { email, code })

      sessionStorage.setItem(
        'pending-password-setup',
        JSON.stringify({
          email,
          setupToken: result.setupToken,
        }),
      )

      navigate('/set-password', {
        state: {
          email,
          setupToken: result.setupToken,
        },
      })
    } catch (error) {
      setTone('error')
      setMessage(error instanceof ApiError ? error.message : 'Failed to verify email code')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setMessage('')

    try {
      const result = await apiSend<{
        ok: true
        email: string
        devCode?: string
      }>('/api/auth/resend-code', 'POST', { email })

      setTone('success')
      setMessage(result.devCode ? `Fresh code sent. Dev code: ${result.devCode}` : 'Fresh code sent to your inbox.')
    } catch (error) {
      setTone('error')
      setMessage(error instanceof ApiError ? error.message : 'Failed to resend verification code')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <span className="eyebrow">Email verification</span>
        <h1>Enter your 6-digit code</h1>
        <p>Use the code we sent to your inbox, then continue to set your password.</p>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Verification code
            <input
              inputMode="numeric"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              required
            />
          </label>
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Checking...' : 'Verify email'}
          </button>
        </form>
        <FormMessage message={message} tone={tone} />
        <p className="auth-footnote">
          Need a fresh start? <Link to="/sign-up">Go back to sign up</Link>.
        </p>
        <button
          type="button"
          className="ghost-button inline-action"
          onClick={() => void handleResend()}
          disabled={resending || !email}
        >
          {resending ? 'Sending again...' : 'Resend code'}
        </button>
      </div>
    </div>
  )
}
