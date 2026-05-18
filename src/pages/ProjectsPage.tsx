import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../lib/api'
import { formatDate } from '../lib/format'
import type { ProjectListItem } from '../lib/types'
import { StatusPill } from '../components/StatusPill'

export function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([])

  useEffect(() => {
    void apiGet<{ ok: true; projects: ProjectListItem[] }>('/api/projects')
      .then((payload) => setProjects(payload.projects))
      .catch(() => undefined)
  }, [])

  return (
    <section className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Project pipeline</span>
          <h1>Track every live request in one timeline.</h1>
          <p className="page-lead">
            From first brief to final revision, this is where the client-facing delivery flow stays readable.
          </p>
        </div>
        <Link to="/projects/new" className="primary-link">
          New brief
        </Link>
      </header>

      <div className="panel">
        {projects.length === 0 ? (
          <p className="empty-state">No projects yet. Drop in your first brief and start building with actual structure.</p>
        ) : (
          <div className="project-list">
            {projects.map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`} className="project-row">
                <div>
                  <strong>{project.title}</strong>
                  <span>
                    {project.businessName} • {project.websiteType} • {project.deadline ? `Deadline ${formatDate(project.deadline)}` : 'No deadline set'}
                  </span>
                </div>
                <StatusPill status={project.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
