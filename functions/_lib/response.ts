export function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('content-type', 'application/json; charset=utf-8')
  return new Response(JSON.stringify(data), { ...init, headers })
}

export function badRequest(message: string, details?: unknown) {
  return json({ ok: false, message, details }, { status: 400 })
}

export function tooManyRequests(message = 'Too many requests', details?: unknown) {
  return json({ ok: false, message, details }, { status: 429 })
}

export function unauthorized(message = 'Unauthorized') {
  return json({ ok: false, message }, { status: 401 })
}

export function forbidden(message = 'Forbidden') {
  return json({ ok: false, message }, { status: 403 })
}

export function notFound(message = 'Not found') {
  return json({ ok: false, message }, { status: 404 })
}

export function serverError(message = 'Something went wrong') {
  return json({ ok: false, message }, { status: 500 })
}
