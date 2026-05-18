import { completePasswordSetup, setPasswordSchema } from '../../_lib/auth'
import { readJson } from '../../_lib/request'
import { badRequest, json, serverError } from '../../_lib/response'
import type { Env } from '../../_lib/types'

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson<unknown>(request)
  if (body instanceof Response) {
    return body
  }

  const parsed = setPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return badRequest('Please enter a valid password', parsed.error.flatten())
  }

  try {
    const result = await completePasswordSetup(request, env, parsed.data)
    if (result instanceof Response) {
      return result
    }
    return json(
      { ok: true, message: 'Password created successfully' },
      { headers: { 'Set-Cookie': result.sessionCookie } },
    )
  } catch (error) {
    console.error(error)
    return serverError('Failed to create password')
  }
}
