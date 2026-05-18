import { Link } from 'react-router-dom'
import { BrandLockup } from '../components/BrandLockup'

export function LandingPage() {
  return (
    <div className="landing-page">
      <section className="hero-panel">
        <div className="hero-topbar">
          <BrandLockup className="brand-light" subtitle="Client delivery portal" />
          <div className="hero-badges">
            <span>Private by default</span>
            <span>Built for async teams</span>
          </div>
        </div>

        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Cloudflare-ready client portal</span>
            <h1>Run client work like a real product, not a chaotic group chat.</h1>
            <p>
              RAF Project turns sign-up, project intake, revisions, approvals, and delivery updates into one clean
              workflow your clients can actually trust.
            </p>
            <div className="hero-actions">
              <Link to="/sign-up" className="primary-link">
                Start onboarding
              </Link>
              <Link to="/sign-in" className="secondary-link">
                Open dashboard
              </Link>
            </div>
            <div className="hero-meta">
              <div>
                <strong>01</strong>
                <span>Verified account flow</span>
              </div>
              <div>
                <strong>02</strong>
                <span>Clean project intake</span>
              </div>
              <div>
                <strong>03</strong>
                <span>Revision tracking built in</span>
              </div>
            </div>
          </div>

          <div className="hero-stage">
            <article className="hero-stage-card hero-stage-primary">
              <span className="mini-label">Live workflow</span>
              <strong>Client onboarding that actually feels premium</strong>
              <p>Sign up, verify email, set password, enter workspace.</p>
              <div className="stage-list">
                <span>Create account</span>
                <span>Verify code</span>
                <span>Ship faster</span>
              </div>
            </article>
            <article className="hero-stage-card hero-stage-secondary">
              <span className="mini-label">Inside the portal</span>
              <strong>Project status that makes sense</strong>
              <p>Clients stop asking “any update?” every four hours. Anjay 😹</p>
            </article>
          </div>
        </div>

        <div className="hero-card-grid">
          <article className="hero-card">
            <strong>Onboarding that feels legit</strong>
            <p>New users verify first, set password second, and land inside a protected workspace.</p>
          </article>
          <article className="hero-card">
            <strong>Project briefs that stay structured</strong>
            <p>Track scope, budget, references, pages, features, and deadlines without messy handoffs.</p>
          </article>
          <article className="hero-card">
            <strong>Revision receipts, not chaos</strong>
            <p>Every feedback note lives on the project timeline, not buried in random messages.</p>
          </article>
        </div>
      </section>
    </div>
  )
}
