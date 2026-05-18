import { requireSessionUser } from '../../_lib/auth'
import { getDashboardSummary } from '../../_lib/projects'
import { json, serverError } from '../../_lib/response'
import type { Env } from '../../_lib/types'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireSessionUser(request, env)
  if (user instanceof Response) {
    return user
  }

  try {
    const payload = await getDashboardSummary(env, user)
    return json({ ok: true, ...payload })
  } catch (error) {
    console.error(error)
    return serverError('Failed to load dashboard summary')
  }
}
