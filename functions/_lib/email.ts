import type { Env } from './types'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function sendVerificationCodeEmail(env: Env, email: string, name: string, code: string) {
  const provider = env.EMAIL_PROVIDER ?? 'resend'
  const appName = env.APP_NAME ?? 'Order Portal'
  const from = env.EMAIL_FROM

  if (provider !== 'resend') {
    throw new Error(`Unsupported email provider: ${provider}`)
  }

  if (!env.RESEND_API_KEY || !from) {
    throw new Error('Missing RESEND_API_KEY or EMAIL_FROM')
  }

  const payload = {
    from,
    to: [email],
    subject: `${appName} verification code`,
    html: `
      <div style="font-family:Arial,sans-serif;padding:24px;line-height:1.5;color:#1f2937">
        <p>Hi ${escapeHtml(name)},</p>
        <p>Your verification code for ${escapeHtml(appName)} is:</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0">${escapeHtml(code)}</p>
        <p>This code expires in 10 minutes.</p>
        <p>If you did not request this account, you can ignore this email.</p>
      </div>
    `,
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to send email: ${text}`)
  }
}
