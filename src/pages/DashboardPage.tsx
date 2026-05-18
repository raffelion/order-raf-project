import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../lib/api'
import { formatDate } from '../lib/format'
import type { DashboardRecentProject, DashboardSummary } from '../lib/types'
import { StatusPill } from '../components/StatusPill'

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [recent, setRecent] = useState<DashboardRecentProject[]>([])

  useEffect(() => {
    void apiGet<{ ok: true; summary: DashboardSummary; recent: DashboardRecentProject[] }>('/api/dashboard/summary')
      .then((payload) => {
        setSummary(payload.summary)
        setRecent(payload.recent)
      })
      .catch(() => undefined)
  }, [])

  return (
    <section className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Overview</span>
          <h1>Dashboard</h1>
        </div>
        <Link to="/projects/new" className="primary-link">
          New project request
        </Link>
      </header>

      <div className="stats-grid">
        <article className="stat-card">
          <span>Total projects</span>
          <strong>{summary?.totalProjects ?? 0}</strong>
        </article>
        <article className="stat-card">
          <span>Active projects</span>
          <strong>{summary?.activeProjects ?? 0}</strong>
        </article>
        <article className="stat-card">
          <span>Pending revisions</span>
          <strong>{summary?.pendingRevisions ?? 0}</strong>
        </article>
        <article className="stat-card">
          <span>Overdue</span>
          <strong>{summary?.overdueProjects ?? 0}</strong>
        </article>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <h2>Recent project activity</h2>
          <Link to="/projects">View all</Link>
        </div>
        <div className="project-list compact">
          {recent.length === 0 ? (
            <p className="empty-state">No projects yet. Create your first request to start the workflow.</p>
          ) : (
            recent.map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`} className="project-row">
                <div>
                  <strong>{project.title}</strong>
                  <span>Updated {formatDate(project.updatedAt)}</span>
                </div>
                <StatusPill status={project.status} />
              </Link>
            ))
          )}
        </div>
      </section>
    </section>
  )
}
