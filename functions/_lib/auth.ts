import { z } from 'zod'
import {
  PASSWORD_SETUP_TTL_MS,
  VERIFICATION_MAX_FAILED_ATTEMPTS,
  VERIFICATION_RESEND_COOLDOWN_MS,
  VERIFICATION_CODE_TTL_MS,
} from './constants'
import { createCode, createId, createOpaqueToken, hashPassword, sha256, verifyPassword } from './crypto'
import { sendVerificationCodeEmail } from './email'
import { badRequest, tooManyRequests, unauthorized } from './response'
import { createSession, getSessionUser, makeSessionCookie } from './session'
import type { Env, SessionUser } from './types'

export const signUpRequestSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().transform((value) => value.toLowerCase()),
})

export const verifyCodeSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  code: z.string().length(6).regex(/^\d{6}$/),
})

export const resendCodeSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
})

export const setPasswordSchema = z
  .object({
    setupToken: z.string().min(20),
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const signInSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72),
})

export async function requireSessionUser(request: Request, env: Env): Promise<SessionUser | Response> {
  const user = await getSessionUser(request, env)
  if (!user) {
    return unauthorized('Please sign in first')
  }
  return user
}

async function issueVerificationCode(env: Env, email: string, name: string) {
  const latestCode = await env.DB.prepare(
    `
      SELECT id, created_at AS createdAt, used_at AS usedAt
      FROM verification_codes
      WHERE email = ?1
        AND purpose = 'signup'
      ORDER BY created_at DESC
      LIMIT 1
    `,
  )
    .bind(email)
    .first<{ id: string; createdAt: string; usedAt: string | null }>()

  if (latestCode) {
    const elapsedMs = Date.now() - new Date(latestCode.createdAt).getTime()
    if (elapsedMs < VERIFICATION_RESEND_COOLDOWN_MS) {
      const retryAfterSeconds = Math.ceil((VERIFICATION_RESEND_COOLDOWN_MS - elapsedMs) / 1000)
      return tooManyRequests('Please wait before requesting another code', { retryAfterSeconds })
    }
  }

  const now = new Date()
  await env.DB.prepare(
    'UPDATE verification_codes SET used_at = ?2 WHERE email = ?1 AND purpose = \'signup\' AND used_at IS NULL',
  )
    .bind(email, now.toISOString())
    .run()

  const code = createCode()
  const codeHash = await sha256(code)
  const expiresAt = new Date(now.getTime() + VERIFICATION_CODE_TTL_MS).toISOString()

  await env.DB.prepare(
    `
      INSERT INTO verification_codes (id, email, purpose, code_hash, failed_attempts, expires_at, created_at)
      VALUES (?1, ?2, 'signup', ?3, 0, ?4, ?5)
    `,
  )
    .bind(createId('verify'), email, codeHash, expiresAt, now.toISOString())
    .run()

  await sendVerificationCodeEmail(env, email, name, code)

  return {
    email,
    expiresAt,
    devCode: env.ALLOW_DEV_CODE_RESPONSE === 'true' ? code : undefined,
  }
}

export async function sendSignUpCode(env: Env, input: z.infer<typeof signUpRequestSchema>) {
  const existingUser = await env.DB.prepare(
    `
      SELECT id, email_verified AS emailVerified
      FROM users
      WHERE email = ?1
      LIMIT 1
    `,
  )
    .bind(input.email)
    .first<{ id: string; emailVerified: number }>()

  if (existingUser && existingUser.emailVerified) {
    return badRequest('An account with this email already exists')
  }

  const now = new Date()
  const userId = existingUser?.id ?? createId('usr')

  await env.DB.prepare(
    `
      INSERT INTO users (id, name, email, role, email_verified, created_at, updated_at)
      VALUES (?1, ?2, ?3, 'client', 0, ?4, ?4)
      ON CONFLICT(email) DO UPDATE SET
        name = excluded.name,
        updated_at = excluded.updated_at
    `,
  )
    .bind(userId, input.name, input.email, now.toISOString())
    .run()

  await env.DB.prepare(
    'UPDATE users SET email_verified = 0, password_hash = NULL, updated_at = ?2 WHERE email = ?1 AND email_verified = 0',
  )
    .bind(input.email, now.toISOString())
    .run()

  return issueVerificationCode(env, input.email, input.name)
}

export async function resendSignUpCode(env: Env, input: z.infer<typeof resendCodeSchema>) {
  const user = await env.DB.prepare(
    `
      SELECT name, email_verified AS emailVerified
      FROM users
      WHERE email = ?1
      LIMIT 1
    `,
  )
    .bind(input.email)
    .first<{ name: string; emailVerified: number }>()

  if (!user) {
    return badRequest('No sign-up session found for this email')
  }

  if (user.emailVerified) {
    return badRequest('This email is already verified. Please sign in instead.')
  }

  return issueVerificationCode(env, input.email, user.name)
}

export async function verifySignUpCode(env: Env, input: z.infer<typeof verifyCodeSchema>) {
  const verification = await env.DB.prepare(
    `
      SELECT id, email, code_hash AS codeHash, failed_attempts AS failedAttempts, expires_at AS expiresAt
      FROM verification_codes
      WHERE email = ?1
        AND purpose = 'signup'
        AND used_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `,
  )
    .bind(input.email)
    .first<{ id: string; email: string; codeHash: string; failedAttempts: number; expiresAt: string }>()

  if (!verification) {
    return badRequest('No active verification code found for this email')
  }

  if (verification.expiresAt <= new Date().toISOString()) {
    return badRequest('Verification code has expired')
  }

  if (verification.failedAttempts >= VERIFICATION_MAX_FAILED_ATTEMPTS) {
    return badRequest('Too many incorrect attempts. Please request a new verification code.')
  }

  const incomingHash = await sha256(input.code)
  if (incomingHash !== verification.codeHash) {
    const failedAttempts = verification.failedAttempts + 1
    const now = new Date().toISOString()
    const shouldInvalidate = failedAttempts >= VERIFICATION_MAX_FAILED_ATTEMPTS
    await env.DB.prepare(
      'UPDATE verification_codes SET failed_attempts = ?2, used_at = ?3 WHERE id = ?1',
    )
      .bind(verification.id, failedAttempts, shouldInvalidate ? now : null)
      .run()

    if (shouldInvalidate) {
      return badRequest('Too many incorrect attempts. Please request a new verification code.')
    }

    return badRequest('Verification code is invalid')
  }

  const now = new Date()

  await env.DB.prepare('UPDATE verification_codes SET used_at = ?2 WHERE id = ?1').bind(verification.id, now.toISOString()).run()
  await env.DB.prepare('UPDATE users SET email_verified = 1, updated_at = ?2 WHERE email = ?1').bind(input.email, now.toISOString()).run()

  const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?1 LIMIT 1').bind(input.email).first<{ id: string }>()
  if (!user) {
    return badRequest('Unable to find user account')
  }

  const setupToken = createOpaqueToken()
  const setupTokenHash = await sha256(setupToken)
  const expiresAt = new Date(now.getTime() + PASSWORD_SETUP_TTL_MS).toISOString()

  await env.DB.prepare(
    'UPDATE password_setup_tickets SET used_at = ?2 WHERE user_id = ?1 AND used_at IS NULL',
  )
    .bind(user.id, now.toISOString())
    .run()

  await env.DB.prepare(
    `
      INSERT INTO password_setup_tickets (id, user_id, token_hash, expires_at, created_at)
      VALUES (?1, ?2, ?3, ?4, ?5)
    `,
  )
    .bind(createId('ticket'), user.id, setupTokenHash, expiresAt, now.toISOString())
    .run()

  return { setupToken, expiresAt }
}

export async function completePasswordSetup(request: Request, env: Env, input: z.infer<typeof setPasswordSchema>) {
  const tokenHash = await sha256(input.setupToken)
  const ticket = await env.DB.prepare(
    `
      SELECT id, user_id AS userId, expires_at AS expiresAt
      FROM password_setup_tickets
      WHERE token_hash = ?1
        AND used_at IS NULL
      LIMIT 1
    `,
  )
    .bind(tokenHash)
    .first<{ id: string; userId: string; expiresAt: string }>()

  if (!ticket) {
    return badRequest('Password setup session is invalid')
  }

  if (ticket.expiresAt <= new Date().toISOString()) {
    return badRequest('Password setup session has expired')
  }

  const passwordHash = await hashPassword(input.password)
  const now = new Date().toISOString()

  await env.DB.batch([
    env.DB.prepare('UPDATE users SET password_hash = ?2, updated_at = ?3 WHERE id = ?1').bind(ticket.userId, passwordHash, now),
    env.DB.prepare('UPDATE password_setup_tickets SET used_at = ?2 WHERE id = ?1').bind(ticket.id, now),
  ])

  const session = await createSession(env, ticket.userId)
  return {
    sessionCookie: makeSessionCookie(env, request, session.token, session.expiresAt),
  }
}

export async function signInWithPassword(request: Request, env: Env, input: z.infer<typeof signInSchema>) {
  const user = await env.DB.prepare(
    `
      SELECT id, password_hash AS passwordHash, email_verified AS emailVerified
      FROM users
      WHERE email = ?1
      LIMIT 1
    `,
  )
    .bind(input.email)
    .first<{ id: string; passwordHash: string | null; emailVerified: number }>()

  if (!user || !user.passwordHash) {
    return badRequest('Email or password is incorrect')
  }

  if (!user.emailVerified) {
    return badRequest('Please verify your email first')
  }

  const ok = await verifyPassword(input.password, user.passwordHash)
  if (!ok) {
    return badRequest('Email or password is incorrect')
  }

  const session = await createSession(env, user.id)
  return {
    sessionCookie: makeSessionCookie(env, request, session.token, session.expiresAt),
  }
}
