import { deleteSessionByRequest, clearSessionCookie } from '../../_lib/session'
import { json } from '../../_lib/response'
import type { Env } from '../../_lib/types'

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  await deleteSessionByRequest(request, env)
  return json(
    { ok: true, message: 'Signed out' },
    { headers: { 'Set-Cookie': clearSessionCookie(env, request) } },
  )
}
