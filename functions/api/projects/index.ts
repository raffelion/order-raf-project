import { requireSessionUser } from '../../_lib/auth'
import { createProject, listProjects, projectInputSchema } from '../../_lib/projects'
import { readJson } from '../../_lib/request'
import { badRequest, json, serverError } from '../../_lib/response'
import type { Env } from '../../_lib/types'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireSessionUser(request, env)
  if (user instanceof Response) {
    return user
  }

  try {
    const projects = await listProjects(env, user)
    return json({ ok: true, projects })
  } catch (error) {
    console.error(error)
    return serverError('Failed to load projects')
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireSessionUser(request, env)
  if (user instanceof Response) {
    return user
  }

  const body = await readJson<unknown>(request)
  if (body instanceof Response) {
    return body
  }

  const parsed = projectInputSchema.safeParse(body)
  if (!parsed.success) {
    return badRequest('Please complete the required project fields', parsed.error.flatten())
  }

  try {
    const projectId = await createProject(env, user, parsed.data)
    return json({ ok: true, projectId, message: 'Project request created' }, { status: 201 })
  } catch (error) {
    console.error(error)
    return serverError('Failed to create project')
  }
}
