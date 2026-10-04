export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  const res = Response.json(data, { status, headers })
  res.headers.set('cache-control', 'no-store')
  return res
}
