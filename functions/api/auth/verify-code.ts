import { verifyCodeSchema, verifySignUpCode } from '../../_lib/auth'
import { readJson } from '../../_lib/request'
import { badRequest, json, serverError } from '../../_lib/response'
import type { Env } from '../../_lib/types'

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson<unknown>(request)
  if (body instanceof Response) {
    return body
  }

  const parsed = verifyCodeSchema.safeParse(body)
  if (!parsed.success) {
    return badRequest('Please enter a valid email and 6-digit code', parsed.error.flatten())
  }

  try {
    const result = await verifySignUpCode(env, parsed.data)
    if (result instanceof Response) {
      return result
    }
    return json({
      ok: true,
      message: 'Email verified. You can now create your password.',
      ...result,
    })
  } catch (error) {
    console.error(error)
    return serverError('Failed to verify code')
  }
}
