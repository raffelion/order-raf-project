import { execSync } from 'node:child_process'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const args = process.argv.slice(2)
const emailArg = args.find((arg) => arg.startsWith('--email='))
const nameArg = args.find((arg) => arg.startsWith('--name='))
const appUrlArg = args.find((arg) => arg.startsWith('--app-url='))
const modeArg = args.find((arg) => arg === '--local' || arg === '--remote') ?? '--local'

if (!emailArg) {
  console.error('Usage: node scripts/promote-admin.mjs --email=user@example.com [--name=Admin Name] [--app-url=https://your-app.pages.dev] [--local|--remote]')
  process.exit(1)
}

const email = emailArg.slice('--email='.length).trim().toLowerCase()
if (!email) {
  console.error('Missing email value.')
  process.exit(1)
}

const name = (nameArg?.slice('--name='.length).trim() || email.split('@')[0] || 'Admin').replace(/'/g, "''")
const normalizedEmail = email.replace(/'/g, "''")
const now = new Date().toISOString()
const userId = `usr_${randomUUID().replace(/-/g, '')}`
const setupToken = randomBytes(32).toString('base64url')
const setupTokenHash = createHash('sha256').update(setupToken).digest('base64')
const ticketId = `ticket_${randomUUID().replace(/-/g, '')}`
const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()

const sql = `
INSERT INTO users (id, name, email, role, email_verified, created_at, updated_at)
VALUES ('${userId}', '${name}', '${normalizedEmail}', 'admin', 1, '${now}', '${now}')
ON CONFLICT(email) DO UPDATE SET
  name = excluded.name,
  role = 'admin',
  email_verified = 1,
  updated_at = excluded.updated_at;

UPDATE password_setup_tickets
SET used_at = '${now}'
WHERE user_id = (SELECT id FROM users WHERE lower(email) = '${normalizedEmail}')
  AND used_at IS NULL;

INSERT INTO password_setup_tickets (id, user_id, token_hash, expires_at, created_at)
VALUES (
  '${ticketId}',
  (SELECT id FROM users WHERE lower(email) = '${normalizedEmail}'),
  '${setupTokenHash}',
  '${expiresAt}',
  '${now}'
);

SELECT id, name, email, role, email_verified
FROM users
WHERE lower(email) = '${normalizedEmail}';
`.trim()

const tempDir = mkdtempSync(join(tmpdir(), 'order-portal-admin-'))
const sqlPath = join(tempDir, 'promote-admin.sql')
writeFileSync(sqlPath, sql, 'utf8')

try {
  execSync(`npx wrangler d1 execute DB ${modeArg} --file "${sqlPath}"`, {
    stdio: 'inherit',
  })
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}

const appUrl = appUrlArg?.slice('--app-url='.length).trim()
if (appUrl) {
  const setupUrl = new URL('/set-password', appUrl)
  setupUrl.searchParams.set('token', setupToken)
  setupUrl.searchParams.set('email', email)
  console.log(`\nAdmin setup URL:\n${setupUrl.toString()}\n`)
} else {
  console.log(`\nSetup token for ${email}:\n${setupToken}\n`)
}
