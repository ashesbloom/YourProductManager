import { sha256Hex } from './lib.ts'
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
/** A JSON-only body blocks cross-site form posts (CSRF): browsers can't send it cross-origin without a CORS preflight, which we never approve. */
export async function readJson(req: Request): Promise<Record<string, unknown>> {
  if (!req.headers.get('content-type')?.startsWith('application/json')) throw new HttpError(415, 'Expected JSON')
  try {
    const body: unknown = await req.json()
    if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>
  } catch {
    // fall through
  }
  throw new HttpError(400, 'Invalid JSON')
}

export function getCookie(req: Request, name: string): string | null {
  for (const part of (req.headers.get('cookie') ?? '').split(';')) {
    const i = part.indexOf('=')
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim()
  }
  return null
}

export function redirect(location: string, headers = new Headers()): Response {
  headers.set('location', location)
  return new Response(null, { status: 302, headers })
}

const DAY = 86_400_000
export const SESSION_COOKIE = 'ypm_s'
export const SESSION_IDLE_MS = 14 * DAY

// The cookie deliberately outlives the idle timeout: the server-side expiry is what logs people out.
export const sessionCookie = (token: string) =>
  `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=34560000`
export const clearSessionCookie = `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`

export type Session = { sid: string; userId: number; email: string; name: string | null }

export async function loadSession(db: D1Database, token: string | null, now: number): Promise<Session | null> {
  if (!token) return null
  const sid = await sha256Hex(token)
  const row = await db
    .prepare(
      `SELECT s.user_id, s.expires_at, u.email, u.name FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.expires_at > ?`,
    )
    .bind(sid, now)
    .first<{ user_id: number; expires_at: number; email: string; name: string | null }>()
  if (!row) return null
  // Sliding idle timeout, written at most once a day per session.
  if (row.expires_at - now < SESSION_IDLE_MS - DAY) {
    await db.batch([
      db.prepare(`UPDATE sessions SET expires_at = ? WHERE id = ?`).bind(now + SESSION_IDLE_MS, sid),
      db.prepare(`UPDATE users SET last_seen_at = ? WHERE id = ?`).bind(now, row.user_id),
    ])
  }
  return { sid, userId: row.user_id, email: row.email, name: row.name }
}

export async function requireSession(req: Request, env: Env): Promise<Session> {
  const session = await loadSession(env.DB, getCookie(req, SESSION_COOKIE), Date.now())
  if (!session) throw new HttpError(401, 'Please log in')
  return session
}
