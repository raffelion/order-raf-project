import { COOKIE_NAME_FALLBACK, SESSION_DURATION_MS } from './constants'
import { createId, createOpaqueToken, sha256 } from './crypto'
import type { Env, SessionUser } from './types'

function parseCookies(request: Request) {
  const rawCookie = request.headers.get('cookie') ?? ''
  return rawCookie.split(';').reduce<Record<string, string>>((acc, chunk) => {
    const [key, ...rest] = chunk.trim().split('=')
    if (!key) {
      return acc
    }
    acc[key] = rest.join('=')
    return acc
  }, {})
}

function getCookieName(env: Env) {
  return env.SESSION_COOKIE_NAME || COOKIE_NAME_FALLBACK
}

function shouldUseSecureCookie(env: Env, request: Request) {
  const requestUrl = new URL(request.url)
  if (requestUrl.protocol === 'https:') {
    return true
  }

  if (env.APP_URL) {
    try {
      return new URL(env.APP_URL).protocol === 'https:'
    } catch {
      return false
    }
  }

  return false
}

export async function createSession(env: Env, userId: string) {
  const token = createOpaqueToken()
  const tokenHash = await sha256(token)
  const sessionId = createId('sess')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS).toISOString()

  await env.DB.prepare(
    `
      INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at)
      VALUES (?1, ?2, ?3, ?4, ?5)
    `,
  )
    .bind(sessionId, userId, tokenHash, expiresAt, now.toISOString())
    .run()

  return { token, expiresAt }
}

export function makeSessionCookie(env: Env, request: Request, token: string, expiresAt: string) {
  const secure = shouldUseSecureCookie(env, request) ? '; Secure' : ''
  return `${getCookieName(env)}=${token}; Path=/; HttpOnly${secure}; SameSite=Lax; Expires=${new Date(expiresAt).toUTCString()}`
}

export function clearSessionCookie(env: Env, request: Request) {
  const secure = shouldUseSecureCookie(env, request) ? '; Secure' : ''
  return `${getCookieName(env)}=; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=0`
}

export async function getSessionUser(request: Request, env: Env): Promise<SessionUser | null> {
  const cookies = parseCookies(request)
  const token = cookies[getCookieName(env)]
  if (!token) {
    return null
  }

  const tokenHash = await sha256(token)
  const result = await env.DB.prepare(
    `
      SELECT
        users.id,
        users.name,
        users.email,
        users.role,
        users.email_verified AS emailVerified
      FROM sessions
      JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?1
        AND sessions.expires_at > ?2
      LIMIT 1
    `,
  )
    .bind(tokenHash, new Date().toISOString())
    .first<{
      id: string
      name: string
      email: string
      role: SessionUser['role']
      emailVerified: number
    }>()

  if (!result) {
    return null
  }

  return {
    id: result.id,
    name: result.name,
    email: result.email,
    role: result.role,
    emailVerified: Boolean(result.emailVerified),
  }
}

export async function deleteSessionByRequest(request: Request, env: Env) {
  const cookies = parseCookies(request)
  const token = cookies[getCookieName(env)]
  if (!token) {
    return
  }

  const tokenHash = await sha256(token)
  await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?1').bind(tokenHash).run()
}
