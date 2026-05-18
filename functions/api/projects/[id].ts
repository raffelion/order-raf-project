import { requireSessionUser } from '../../_lib/auth'
import { getProjectDetail, statusInputSchema, updateProjectStatus } from '../../_lib/projects'
import { readJson } from '../../_lib/request'
import { badRequest, forbidden, json, notFound, serverError } from '../../_lib/response'
import type { Env } from '../../_lib/types'

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await requireSessionUser(request, env)
  if (user instanceof Response) {
    return user
  }

  const projectId = String(params.id ?? '')
  if (!projectId) {
    return notFound()
  }

  try {
    const detail = await getProjectDetail(env, user, projectId)
    if (detail === 'forbidden') {
      return forbidden()
    }
    if (!detail) {
      return notFound('Project not found')
    }
    return json({ ok: true, project: detail })
  } catch (error) {
    console.error(error)
    return serverError('Failed to load project')
  }
}

export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await requireSessionUser(request, env)
  if (user instanceof Response) {
    return user
  }
  if (user.role !== 'admin') {
    return forbidden('Only admins can change project status')
  }

  const body = await readJson<unknown>(request)
  if (body instanceof Response) {
    return body
  }

  const parsed = statusInputSchema.safeParse(body)
  if (!parsed.success) {
    return badRequest('Please provide a valid project status', parsed.error.flatten())
  }

  try {
    await updateProjectStatus(env, String(params.id ?? ''), parsed.data.status)
    return json({ ok: true, message: 'Project status updated' })
  } catch (error) {
    console.error(error)
    return serverError('Failed to update project status')
  }
}
