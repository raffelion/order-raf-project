import { json, unauthorized } from '../../_lib/response'
import { getSessionUser } from '../../_lib/session'
import type { Env } from '../../_lib/types'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getSessionUser(request, env)
  if (!user) {
    return unauthorized()
  }
  return json({ ok: true, user })
}
