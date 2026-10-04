import { sendEmail } from './email.ts'
import {
  clearSessionCookie,
  getCookie,
  HttpError,
  json,
  loadSession,
  readJson,
  redirect,
  SESSION_COOKIE,
  SESSION_IDLE_MS,
  sessionCookie,
} from './http.ts'
import { isEmail, randomCode, randomToken, safeNext, sha256Hex } from './lib.ts'

const MIN = 60_000
const DAY = 86_400_000
const OTP_TTL = 10 * MIN
const OTP_COOLDOWN = MIN
const OTP_DAILY_MAX = 10
const OTP_MAX_ATTEMPTS = 5
const MAX_SESSIONS = 3

const normEmail = (v: unknown) => {
  const email = typeof v === 'string' ? v.trim().toLowerCase() : ''
  return isEmail(email) ? email : ''
}
const utmString = (v: unknown) => (typeof v === 'string' && v.length <= 1000 ? v : null)

// ---- DB logic (exported for tests) ----

/** Stores a fresh code for `email`. Rate limits: one per minute, OTP_DAILY_MAX per 24h window. */
export async function issueOtp(db: D1Database, email: string, now: number): Promise<{ code: string } | 'cooldown' | 'limit'> {
  const row = await db
    .prepare(`SELECT sent_at, window_at, sends FROM otps WHERE email = ?`)
    .bind(email)
    .first<{ sent_at: number; window_at: number; sends: number }>()
  if (row && now - row.sent_at < OTP_COOLDOWN) return 'cooldown'
  const inWindow = row !== null && now - row.window_at <= DAY
  if (inWindow && row.sends >= OTP_DAILY_MAX) return 'limit'
  const code = randomCode()
  await db
    .prepare(
      `INSERT INTO otps(email, code_hash, expires_at, attempts, sent_at, window_at, sends) VALUES(?, ?, ?, 0, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0,
         sent_at = excluded.sent_at, window_at = excluded.window_at, sends = excluded.sends`,
    )
    .bind(email, await sha256Hex(`${email}:${code}`), now + OTP_TTL, now, inWindow ? row.window_at : now, inWindow ? row.sends + 1 : 1)
    .run()
  return { code }
}

/** True once for the right, unexpired code; every check (right or wrong) uses up an attempt. */
export async function checkOtp(db: D1Database, email: string, code: string, now: number): Promise<boolean> {
  const row = await db
    .prepare(`UPDATE otps SET attempts = attempts + 1 WHERE email = ? AND expires_at > ? AND attempts < ? RETURNING code_hash`)
    .bind(email, now, OTP_MAX_ATTEMPTS)
    .first<{ code_hash: string }>()
  if (!row || row.code_hash !== (await sha256Hex(`${email}:${code}`))) return false
  // Expire rather than delete, so the send-rate window survives.
  await db.prepare(`UPDATE otps SET expires_at = 0 WHERE email = ?`).bind(email).run()
  return true
}

/** Finds or creates the user. `utm` is only written on creation (first touch). */
export async function upsertUser(
  db: D1Database,
  u: { email: string; name?: string | null; googleSub?: string | null; utm?: string | null },
  now: number,
): Promise<number> {
  if (u.googleSub) {
    const bySub = await db.prepare(`SELECT id FROM users WHERE google_sub = ?`).bind(u.googleSub).first<{ id: number }>()
    if (bySub) return bySub.id
  }
  const row = await db
    .prepare(
      `INSERT INTO users(email, name, google_sub, utm, created_at, last_seen_at) VALUES(?, ?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET name = COALESCE(users.name, excluded.name),
         google_sub = COALESCE(users.google_sub, excluded.google_sub), last_seen_at = excluded.last_seen_at
       RETURNING id`,
    )
    .bind(u.email, u.name ?? null, u.googleSub ?? null, u.utm ?? null, now, now)
    .first<{ id: number }>()
  return row!.id
}

/** Returns the raw token for the cookie; only its hash is stored. */
export async function createSession(db: D1Database, userId: number, now: number): Promise<string> {
  const token = randomToken()
  await db.batch([
    db.prepare(`INSERT INTO sessions(id, user_id, created_at, expires_at) VALUES(?, ?, ?, ?)`).bind(await sha256Hex(token), userId, now, now + SESSION_IDLE_MS),
    // Basic anti-sharing: an account keeps only its most recent sessions.
    db
      .prepare(
        `DELETE FROM sessions WHERE user_id = ? AND id NOT IN
         (SELECT id FROM sessions WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?)`,
      )
      .bind(userId, userId, MAX_SESSIONS),
    db.prepare(`INSERT INTO events(user_id, type, data, at) VALUES(?, 'login', NULL, ?)`).bind(userId, now),
  ])
  return token
}

async function turnstileOk(env: Env, token: string, ip: string | null): Promise<boolean> {
  const form = new FormData()
  form.append('secret', env.TURNSTILE_SECRET)
  form.append('response', token)
  if (ip) form.append('remoteip', ip)
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
  return ((await res.json()) as { success?: boolean }).success === true
}

// ---- Routes ----

export async function sendOtp(req: Request, env: Env): Promise<Response> {
  const body = await readJson(req)
  const email = normEmail(body.email)
  if (!email) throw new HttpError(400, 'Enter a valid email address')
  if (typeof body.turnstileToken !== 'string' || !(await turnstileOk(env, body.turnstileToken, req.headers.get('cf-connecting-ip')))) {
    throw new HttpError(400, 'Verification failed. Please try again.')
  }
  const result = await issueOtp(env.DB, email, Date.now())
  if (result === 'cooldown') throw new HttpError(429, 'Please wait a minute before requesting another code')
  if (result === 'limit') throw new HttpError(429, 'Too many codes today. Try again tomorrow or continue with Google.')
  await sendEmail(
    env,
    email,
    'Your YPM login code',
    `Your login code is ${result.code}. It expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.`,
  )
  return json({ ok: true })
}

export async function verifyOtp(req: Request, env: Env): Promise<Response> {
  const body = await readJson(req)
  const email = normEmail(body.email)
  const code = typeof body.code === 'string' ? body.code.trim() : ''
  if (!email || !/^\d{6}$/.test(code)) throw new HttpError(400, 'Enter the 6-digit code from the email')
  const now = Date.now()
  if (!(await checkOtp(env.DB, email, code, now))) throw new HttpError(400, 'That code is wrong or has expired')
  const userId = await upsertUser(env.DB, { email, utm: utmString(body.utm) }, now)
  const token = await createSession(env.DB, userId, now)
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie(token) })
}

const GOOGLE_COOKIE = 'ypm_g'

export function googleStart(req: Request, env: Env): Response {
  if (!env.GOOGLE_CLIENT_ID) throw new HttpError(503, 'Google sign-in is not configured')
  const url = new URL(req.url)
  const state = randomToken(16)
  const saved = encodeURIComponent(
    JSON.stringify({ state, next: safeNext(url.searchParams.get('next')), utm: utmString(url.searchParams.get('utm')) }),
  )
  const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  auth.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${url.origin}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  }).toString()
  return redirect(
    auth.toString(),
    new Headers({ 'set-cookie': `${GOOGLE_COOKIE}=${saved}; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=600` }),
  )
}

export async function googleCallback(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url)
  const fail = () => redirect('/login?error=google')
  let saved: { state?: string; next?: string; utm?: string | null }
  try {
    saved = JSON.parse(decodeURIComponent(getCookie(req, GOOGLE_COOKIE) ?? ''))
  } catch {
    return fail()
  }
  const code = url.searchParams.get('code')
  if (!code || !saved.state || saved.state !== url.searchParams.get('state')) return fail()

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${url.origin}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  })
  if (!tokenRes.ok) {
    console.error(JSON.stringify({ msg: 'google token exchange failed', status: tokenRes.status, body: await tokenRes.text() }))
    return fail()
  }
  const { id_token } = (await tokenRes.json()) as { id_token: string }
  // Received straight from Google's token endpoint over TLS, so the JWT signature needn't be re-verified.
  const payload = id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  const claims = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(payload), (c) => c.charCodeAt(0)))) as {
    aud: string
    sub: string
    email: string
    email_verified: boolean
    name?: string
  }
  if (claims.aud !== env.GOOGLE_CLIENT_ID || !claims.email_verified) return fail()

  const now = Date.now()
  const userId = await upsertUser(
    env.DB,
    { email: claims.email.toLowerCase(), name: claims.name ?? null, googleSub: claims.sub, utm: saved.utm ?? null },
    now,
  )
  const headers = new Headers()
  headers.append('set-cookie', sessionCookie(await createSession(env.DB, userId, now)))
  headers.append('set-cookie', `${GOOGLE_COOKIE}=; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=0`)
  return redirect(safeNext(saved.next), headers)
}

export async function logout(req: Request, env: Env): Promise<Response> {
  await readJson(req) // JSON-only, like every state-changing POST
  const token = getCookie(req, SESSION_COOKIE)
  if (token) await env.DB.prepare(`DELETE FROM sessions WHERE id = ?`).bind(await sha256Hex(token)).run()
  return json({ ok: true }, 200, { 'set-cookie': clearSessionCookie })
}

export async function me(req: Request, env: Env): Promise<Response> {
  const session = await loadSession(env.DB, getCookie(req, SESSION_COOKIE), Date.now())
  if (!session) return json({ user: null, enrollments: [] })
  const { results } = await env.DB.prepare(`SELECT course_id FROM enrollments WHERE user_id = ? AND revoked_at IS NULL`)
    .bind(session.userId)
    .all<{ course_id: string }>()
  return json({ user: { email: session.email, name: session.name }, enrollments: results.map((r) => r.course_id) })
}
