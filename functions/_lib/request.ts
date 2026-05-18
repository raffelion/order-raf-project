import { badRequest } from './response'

export async function readJson<T>(request: Request): Promise<T | Response> {
  try {
    return (await request.json()) as T
  } catch {
    return badRequest('Invalid JSON payload')
  }
}
