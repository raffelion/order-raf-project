import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { FormMessage } from '../components/FormMessage'
import { StatusPill } from '../components/StatusPill'
import { apiGet, apiSend, ApiError } from '../lib/api'
import { formatDate } from '../lib/format'
import type { ProjectDetail, ProjectStatus } from '../lib/types'

const statuses: ProjectStatus[] = ['new', 'discovery', 'design', 'development', 'revision', 'done']

export function ProjectDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [revisionMessage, setRevisionMessage] = useState('')
  const [feedback, setFeedback] = useState('')
  const [tone, setTone] = useState<'neutral' | 'success' | 'error'>('neutral')

  async function loadProject() {
    if (!id) {
      return
    }

    const payload = await apiGet<{ ok: true; project: ProjectDetail }>(`/api/projects/${id}`)
    setProject(payload.project)
  }

  useEffect(() => {
    let cancelled = false

    if (!id) {
      return () => undefined
    }

    void apiGet<{ ok: true; project: ProjectDetail }>(`/api/projects/${id}`)
      .then((payload) => {
        if (!cancelled) {
          setProject(payload.project)
        }
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [id])

  async function submitRevision(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!id) {
      return
    }

    try {
      await apiSend(`/api/projects/${id}/revisions`, 'POST', { message: revisionMessage })
      setRevisionMessage('')
      setTone('success')
      setFeedback('Revision note posted')
      await loadProject()
    } catch (error) {
      setTone('error')
      setFeedback(error instanceof ApiError ? error.message : 'Failed to submit revision')
    }
  }

  async function changeStatus(status: ProjectStatus) {
    if (!id) {
      return
    }

    try {
      await apiSend(`/api/projects/${id}`, 'PATCH', { status })
      setTone('success')
      setFeedback('Project status updated')
      await loadProject()
    } catch (error) {
      setTone('error')
      setFeedback(error instanceof ApiError ? error.message : 'Failed to update status')
    }
  }

  if (!project) {
    return <section className="page-shell">Loading project...</section>
  }

  return (
    <section className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Project detail</span>
          <h1>{project.title}</h1>
          <p className="subtle-line">
            {project.businessName} • Owner {project.ownerName} • Updated {formatDate(project.updatedAt)}
          </p>
        </div>
        <StatusPill status={project.status} />
      </header>

      <div className="detail-grid">
        <article className="panel detail-panel">
          <h2>Brief summary</h2>
          <dl className="detail-list">
            <div>
              <dt>Website type</dt>
              <dd>{project.websiteType}</dd>
            </div>
            <div>
              <dt>Objective</dt>
              <dd>{project.objective}</dd>
            </div>
            <div>
              <dt>References</dt>
              <dd>{project.references || 'No references yet'}</dd>
            </div>
            <div>
              <dt>Style</dt>
              <dd>{project.preferredStyle || 'No style notes yet'}</dd>
            </div>
            <div>
              <dt>Requested pages</dt>
              <dd>{project.requestedPages || 'No page list yet'}</dd>
            </div>
            <div>
              <dt>Requested features</dt>
              <dd>{project.requestedFeatures || 'No feature list yet'}</dd>
            </div>
            <div>
              <dt>Budget</dt>
              <dd>{project.budget || 'Not set'}</dd>
            </div>
            <div>
              <dt>Deadline</dt>
              <dd>{project.deadline || 'Not set'}</dd>
            </div>
            <div>
              <dt>Notes</dt>
              <dd>{project.notes || 'No additional notes'}</dd>
            </div>
          </dl>
        </article>

        <article className="panel detail-panel">
          <div className="panel-heading">
            <h2>Revision log</h2>
          </div>
          <form className="form-stack" onSubmit={submitRevision}>
            <label>
              Add revision or update
              <textarea
                value={revisionMessage}
                onChange={(event) => setRevisionMessage(event.target.value)}
                placeholder="Describe the requested change or update"
                required
              />
            </label>
            <button type="submit" className="primary-button">
              Post note
            </button>
          </form>
          <FormMessage message={feedback} tone={tone} />
          <div className="revision-list">
            {project.revisions.length === 0 ? (
              <p className="empty-state">No revision notes yet.</p>
            ) : (
              project.revisions.map((revision) => (
                <article key={revision.id} className="revision-item">
                  <div className="revision-meta">
                    <strong>{revision.authorName}</strong>
                    <span>
                      {revision.authorRole} • {formatDate(revision.createdAt)}
                    </span>
                  </div>
                  <p>{revision.message}</p>
                </article>
              ))
            )}
          </div>
        </article>
      </div>

      {user?.role === 'admin' ? (
        <section className="panel">
          <div className="panel-heading">
            <h2>Admin status controls</h2>
          </div>
          <div className="status-actions">
            {statuses.map((status) => (
              <button
                key={status}
                type="button"
                className={project.status === status ? 'status-button active' : 'status-button'}
                onClick={() => void changeStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  )
}
