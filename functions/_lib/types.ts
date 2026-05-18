export type AppRole = 'admin' | 'client'

export interface Env {
  DB: D1Database
  FILES?: R2Bucket
  RESEND_API_KEY?: string
  EMAIL_FROM?: string
  EMAIL_PROVIDER?: string
  APP_NAME?: string
  APP_URL?: string
  SESSION_COOKIE_NAME?: string
  ALLOW_DEV_CODE_RESPONSE?: string
}

export interface SessionUser {
  id: string
  name: string
  email: string
  role: AppRole
  emailVerified: boolean
}
