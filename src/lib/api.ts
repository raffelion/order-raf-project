export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as { message?: string } | null
  if (!response.ok) {
    throw new ApiError(payload?.message ?? 'Request failed', response.status)
  }
  return payload as T
}

export async function apiGet<T>(path: string) {
  const response = await fetch(path, {
    credentials: 'include',
  })
  return parseJson<T>(response)
}

export async function apiSend<T>(path: string, method: 'POST' | 'PATCH', body?: unknown) {
  const response = await fetch(path, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return parseJson<T>(response)
}
