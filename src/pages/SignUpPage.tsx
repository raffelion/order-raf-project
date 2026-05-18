import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandLockup } from '../components/BrandLockup'
import { apiSend, ApiError } from '../lib/api'
import { FormMessage } from '../components/FormMessage'

export function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<'neutral' | 'success' | 'error'>('neutral')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const result = await apiSend<{
        ok: true
        email: string
        expiresAt: string
        devCode?: string
      }>('/api/auth/sign-up', 'POST', { name, email })

      navigate('/verify-email', {
        state: {
          email: result.email,
          devCode: result.devCode,
        },
      })
    } catch (error) {
      setTone('error')
      setMessage(error instanceof ApiError ? error.message : 'Unable to create your sign-up session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <BrandLockup className="brand-light auth-brand" subtitle="Portal client access" />
        <span className="eyebrow">New client access</span>
        <h1>Create your portal account</h1>
        <p>We will send a 6-digit code to your email before you create your password.</p>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            Full name
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your Name" required />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Sending code...' : 'Send verification code'}
          </button>
        </form>
        <FormMessage message={message} tone={tone} />
        <p className="auth-footnote">
          Already registered? <Link to="/sign-in">Sign in here</Link>.
        </p>
      </div>
    </div>
  )
}
