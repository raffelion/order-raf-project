import { signUpRequestSchema, sendSignUpCode } from '../../_lib/auth'
import { readJson } from '../../_lib/request'
import { badRequest, json, serverError } from '../../_lib/response'
import type { Env } from '../../_lib/types'

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson<unknown>(request)
  if (body instanceof Response) {
    return body
  }

  const parsed = signUpRequestSchema.safeParse(body)
  if (!parsed.success) {
    return badRequest('Please enter a valid name and email', parsed.error.flatten())
  }

  try {
    const result = await sendSignUpCode(env, parsed.data)
    if (result instanceof Response) {
      return result
    }
    return json({
      ok: true,
      message: 'Verification code sent',
      ...result,
    })
  } catch (error) {
    console.error(error)
    return serverError('Failed to send verification code')
  }
}
