import { z } from 'zod'
import { createId } from './crypto'
import type { Env, SessionUser } from './types'

export const projectInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  businessName: z.string().trim().min(2).max(120),
  websiteType: z.string().trim().min(2).max(80),
  objective: z.string().trim().min(10).max(500),
  references: z.string().trim().max(500).optional().default(''),
  preferredStyle: z.string().trim().max(200).optional().default(''),
  requestedPages: z.string().trim().max(500).optional().default(''),
  requestedFeatures: z.string().trim().max(500).optional().default(''),
  budget: z.string().trim().max(80).optional().default(''),
  deadline: z.string().trim().max(80).optional().default(''),
  notes: z.string().trim().max(1000).optional().default(''),
})

export const revisionInputSchema = z.object({
  message: z.string().trim().min(5).max(1000),
})

export const statusInputSchema = z.object({
  status: z.enum(['new', 'discovery', 'design', 'development', 'revision', 'done']),
})

export async function listProjects(env: Env, user: SessionUser) {
  const baseQuery = `
    SELECT
      projects.id,
      projects.title,
      projects.business_name AS businessName,
      projects.website_type AS websiteType,
      projects.status,
      projects.deadline,
      projects.updated_at AS updatedAt,
      users.name AS ownerName
    FROM projects
    JOIN users ON users.id = projects.owner_user_id
  `

  const statement =
    user.role === 'admin'
      ? env.DB.prepare(`${baseQuery} ORDER BY projects.updated_at DESC`)
      : env.DB.prepare(`${baseQuery} WHERE projects.owner_user_id = ?1 ORDER BY projects.updated_at DESC`).bind(user.id)

  const result = await statement.all()
  return result.results
}

export async function createProject(env: Env, user: SessionUser, input: z.infer<typeof projectInputSchema>) {
  const now = new Date().toISOString()
  const projectId = createId('prj')
  await env.DB.prepare(
    `
      INSERT INTO projects (
        id, owner_user_id, title, business_name, website_type, objective, "references",
        preferred_style, requested_pages, requested_features, budget, deadline, notes, status, created_at, updated_at
      ) VALUES (
        ?1, ?2, ?3, ?4, ?5, ?6, ?7,
        ?8, ?9, ?10, ?11, ?12, ?13, 'new', ?14, ?14
      )
    `,
  )
    .bind(
      projectId,
      user.id,
      input.title,
      input.businessName,
      input.websiteType,
      input.objective,
      input.references,
      input.preferredStyle,
      input.requestedPages,
      input.requestedFeatures,
      input.budget,
      input.deadline,
      input.notes,
      now,
    )
    .run()

  return projectId
}

export async function getProjectDetail(env: Env, user: SessionUser, projectId: string) {
  const project = await env.DB.prepare(
    `
      SELECT
        projects.id,
        projects.owner_user_id AS ownerUserId,
        projects.title,
        projects.business_name AS businessName,
        projects.website_type AS websiteType,
        projects.objective,
        projects."references",
        projects.preferred_style AS preferredStyle,
        projects.requested_pages AS requestedPages,
        projects.requested_features AS requestedFeatures,
        projects.budget,
        projects.deadline,
        projects.notes,
        projects.status,
        projects.created_at AS createdAt,
        projects.updated_at AS updatedAt,
        users.name AS ownerName,
        users.email AS ownerEmail
      FROM projects
      JOIN users ON users.id = projects.owner_user_id
      WHERE projects.id = ?1
      LIMIT 1
    `,
  )
    .bind(projectId)
    .first<Record<string, string>>()

  if (!project) {
    return null
  }

  if (user.role !== 'admin' && project.ownerUserId !== user.id) {
    return 'forbidden'
  }

  const revisions = await env.DB.prepare(
    `
      SELECT
        project_revisions.id,
        project_revisions.message,
        project_revisions.created_at AS createdAt,
        users.name AS authorName,
        users.role AS authorRole
      FROM project_revisions
      JOIN users ON users.id = project_revisions.author_user_id
      WHERE project_revisions.project_id = ?1
      ORDER BY project_revisions.created_at DESC
    `,
  )
    .bind(projectId)
    .all()

  return {
    ...project,
    revisions: revisions.results,
  }
}

export async function addRevision(env: Env, user: SessionUser, projectId: string, message: string) {
  const now = new Date().toISOString()
  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO project_revisions (id, project_id, author_user_id, message, created_at) VALUES (?1, ?2, ?3, ?4, ?5)',
    ).bind(createId('rev'), projectId, user.id, message, now),
    env.DB.prepare('UPDATE projects SET status = ?2, updated_at = ?3 WHERE id = ?1').bind(projectId, 'revision', now),
  ])
}

export async function updateProjectStatus(env: Env, projectId: string, status: z.infer<typeof statusInputSchema>['status']) {
  await env.DB.prepare('UPDATE projects SET status = ?2, updated_at = ?3 WHERE id = ?1')
    .bind(projectId, status, new Date().toISOString())
    .run()
}

export async function getDashboardSummary(env: Env, user: SessionUser) {
  const now = new Date().toISOString()
  const where = user.role === 'admin' ? '' : 'WHERE owner_user_id = ?1'
  const summaryQuery = `
    SELECT
      COUNT(*) AS totalProjects,
      SUM(CASE WHEN status != 'done' THEN 1 ELSE 0 END) AS activeProjects,
      SUM(CASE WHEN status = 'revision' THEN 1 ELSE 0 END) AS pendingRevisions,
      SUM(CASE WHEN deadline != '' AND deadline < ?2 AND status != 'done' THEN 1 ELSE 0 END) AS overdueProjects
    FROM projects
    ${where}
  `

  const summary = user.role === 'admin'
    ? await env.DB.prepare(summaryQuery).bind(null, now).first()
    : await env.DB.prepare(summaryQuery).bind(user.id, now).first()

  const recentQuery = `
    SELECT
      projects.id,
      projects.title,
      projects.status,
      projects.updated_at AS updatedAt
    FROM projects
    ${where}
    ORDER BY projects.updated_at DESC
    LIMIT 5
  `

  const recent = user.role === 'admin'
    ? await env.DB.prepare(recentQuery).all()
    : await env.DB.prepare(recentQuery).bind(user.id).all()

  return {
    summary,
    recent: recent.results,
  }
}
