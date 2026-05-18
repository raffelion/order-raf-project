import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiSend, ApiError } from '../lib/api'
import { FormMessage } from '../components/FormMessage'

const defaultForm = {
  title: '',
  businessName: '',
  websiteType: '',
  objective: '',
  references: '',
  preferredStyle: '',
  requestedPages: '',
  requestedFeatures: '',
  budget: '',
  deadline: '',
  notes: '',
}

export function NewProjectPage() {
  const [form, setForm] = useState(defaultForm)
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<'neutral' | 'success' | 'error'>('neutral')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const payload = await apiSend<{ ok: true; projectId: string }>('/api/projects', 'POST', form)
      navigate(`/projects/${payload.projectId}`)
    } catch (error) {
      setTone('error')
      setMessage(error instanceof ApiError ? error.message : 'Failed to create project request')
    } finally {
      setLoading(false)
    }
  }

  function updateField<Key extends keyof typeof defaultForm>(key: Key, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <section className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Project intake</span>
          <h1>Write the brief once. Keep the whole project aligned.</h1>
          <p className="page-lead">
            Share the business context, goals, references, and must-have features so the build starts with less
            guesswork.
          </p>
        </div>
      </header>

      <form className="panel form-grid" onSubmit={handleSubmit}>
        <label>
          Project title
          <input value={form.title} onChange={(event) => updateField('title', event.target.value)} required />
        </label>
        <label>
          Business name
          <input value={form.businessName} onChange={(event) => updateField('businessName', event.target.value)} required />
        </label>
        <label>
          Website type
          <input
            value={form.websiteType}
            onChange={(event) => updateField('websiteType', event.target.value)}
            placeholder="Landing page, company site, portfolio, store"
            required
          />
        </label>
        <label>
          Budget
          <input value={form.budget} onChange={(event) => updateField('budget', event.target.value)} placeholder="$1,000 - $2,500 or custom range" />
        </label>
        <label>
          Deadline
          <input value={form.deadline} onChange={(event) => updateField('deadline', event.target.value)} placeholder="2026-06-10 or launch target" />
        </label>
        <label className="wide">
          Project objective
          <textarea
            value={form.objective}
            onChange={(event) => updateField('objective', event.target.value)}
            placeholder="What should this website help the business achieve?"
            required
          />
        </label>
        <label className="wide">
          References
          <textarea
            value={form.references}
            onChange={(event) => updateField('references', event.target.value)}
            placeholder="Paste links, screenshots, or describe the vibe you want"
          />
        </label>
        <label>
          Preferred style
          <input
            value={form.preferredStyle}
            onChange={(event) => updateField('preferredStyle', event.target.value)}
            placeholder="Minimal, editorial, modern tech, bold"
          />
        </label>
        <label>
          Requested pages
          <input
            value={form.requestedPages}
            onChange={(event) => updateField('requestedPages', event.target.value)}
            placeholder="Home, About, Services, Contact, Pricing"
          />
        </label>
        <label className="wide">
          Requested features
          <textarea
            value={form.requestedFeatures}
            onChange={(event) => updateField('requestedFeatures', event.target.value)}
            placeholder="CMS, payment flow, booking, WhatsApp CTA, blog, gallery"
          />
        </label>
        <label className="wide">
          Additional notes
          <textarea
            value={form.notes}
            onChange={(event) => updateField('notes', event.target.value)}
            placeholder="Anything sensitive, fixed, or non-negotiable before design and build starts"
          />
        </label>
        <div className="wide form-actions">
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Submitting...' : 'Create brief'}
          </button>
          <FormMessage message={message} tone={tone} />
        </div>
      </form>
    </section>
  )
}
