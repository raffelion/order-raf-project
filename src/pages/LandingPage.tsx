import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <div className="landing-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Cloudflare-ready client portal</span>
          <h1>Keep orders, revisions, and approvals in one place.</h1>
          <p>
            This portal is built for web projects with account verification, private dashboards,
            project requests, and revision threads that stop the random chat chaos.
          </p>
          <div className="hero-actions">
            <Link to="/sign-up" className="primary-link">
              Create account
            </Link>
            <Link to="/sign-in" className="secondary-link">
              Sign in
            </Link>
          </div>
        </div>
        <div className="hero-card-grid">
          <article className="hero-card">
            <strong>Account onboarding</strong>
            <p>Sign up, verify by email code, set password, and enter the dashboard.</p>
          </article>
          <article className="hero-card">
            <strong>Projects that stay organized</strong>
            <p>Track website type, requested pages, features, deadlines, and budget notes.</p>
          </article>
          <article className="hero-card">
            <strong>Revision log</strong>
            <p>Keep every change request attached to the project instead of drowning in chat.</p>
          </article>
        </div>
      </section>
    </div>
  )
}
