import { requireSessionUser } from '../../../_lib/auth'
import { addRevision, getProjectDetail, revisionInputSchema } from '../../../_lib/projects'
import { readJson } from '../../../_lib/request'
import { badRequest, forbidden, json, notFound, serverError } from '../../../_lib/response'
import type { Env } from '../../../_lib/types'

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await requireSessionUser(request, env)
  if (user instanceof Response) {
    return user
  }

  const projectId = String(params.id ?? '')
  const existingProject = await getProjectDetail(env, user, projectId)
  if (existingProject === 'forbidden') {
    return forbidden()
  }
  if (!existingProject) {
    return notFound('Project not found')
  }

  const body = await readJson<unknown>(request)
  if (body instanceof Response) {
    return body
  }

  const parsed = revisionInputSchema.safeParse(body)
  if (!parsed.success) {
    return badRequest('Revision message is too short', parsed.error.flatten())
  }

  try {
    await addRevision(env, user, projectId, parsed.data.message)
    return json({ ok: true, message: 'Revision note added' }, { status: 201 })
  } catch (error) {
    console.error(error)
    return serverError('Failed to add revision note')
  }
}
