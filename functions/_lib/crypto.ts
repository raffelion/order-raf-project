import { PASSWORD_ITERATIONS } from './constants'

const encoder = new TextEncoder()

function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function fromBase64(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return toBase64(digest)
}

export function createCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`
}

export function createOpaqueToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return toBase64(bytes.buffer).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PASSWORD_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )

  return `pbkdf2_sha256$${PASSWORD_ITERATIONS}$${toBase64(salt.buffer)}$${toBase64(bits)}`
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, iterationsValue, saltEncoded, hashEncoded] = storedHash.split('$')
  if (algorithm !== 'pbkdf2_sha256' || !iterationsValue || !saltEncoded || !hashEncoded) {
    return false
  }

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: fromBase64(saltEncoded),
      iterations: Number(iterationsValue),
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )

  return toBase64(bits) === hashEncoded
}
