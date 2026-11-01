import { CERTIFICATE_PROGRAMME, courseLectures } from '../src/data/catalog.ts'
import { sendEmail } from './email.ts'
import { HttpError, json, readJson, requireSession } from './http.ts'
import { isEmail } from './lib.ts'

// The certificate programme is every AI PM lecture (Foundations is the free bonus). Matched by id
// prefix rather than an IN list: D1 allows at most 100 bound parameters per query.
export const PROGRAMME = 'ai-product'
const PROGRAMME_GLOB = `${PROGRAMME}-*`
export const PROGRAMME_SIZE = courseLectures(PROGRAMME).length
const DAY = 86_400_000
const IST = 19_800_000 // +05:30, so "days" in charts start at Indian midnight

// No 0/O/1/I: people type these in from a printed certificate.
const CERT_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const newCertificateId = () =>
  'YPM' + Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => CERT_ALPHABET[b % CERT_ALPHABET.length]).join('')

export type Certificate = { id: string; name: string | null; title: string | null; completedAt: number }

/**
 * Earned by EITHER completing every programme lecture while enrolled, OR an admin marking the 1:1
 * Coaching Programme complete. Dated by whichever came first. The public ID is assigned on first issue.
 */
export async function certificateFor(db: D1Database, userId: number): Promise<Certificate | null> {
  const row = await db
    .prepare(
      `SELECT u.name, u.cert_id, u.cert_title, u.coaching_completed_at AS coached,
         EXISTS(SELECT 1 FROM enrollments e WHERE e.user_id = u.id AND e.course_id = ? AND e.revoked_at IS NULL) AS enrolled,
         (SELECT COUNT(*) FROM progress p WHERE p.user_id = u.id AND p.completed_at IS NOT NULL AND p.lecture_id GLOB ?) AS done,
         (SELECT MAX(p.completed_at) FROM progress p WHERE p.user_id = u.id AND p.lecture_id GLOB ?) AS last
       FROM users u WHERE u.id = ?`,
    )
    .bind(PROGRAMME, PROGRAMME_GLOB, PROGRAMME_GLOB, userId)
    .first<{ name: string | null; cert_id: string | null; cert_title: string | null; coached: number | null; enrolled: number; done: number; last: number | null }>()
  if (!row) return null
  const course = row.enrolled && row.done >= PROGRAMME_SIZE ? row.last : null
  const dates = [course, row.coached].filter((d): d is number => d !== null)
  if (!dates.length) return null
  let id = row.cert_id
  if (!id) {
    // Two concurrent requests may both get here; only the first write sticks, so re-read the winner.
    await db.prepare(`UPDATE users SET cert_id = ? WHERE id = ? AND cert_id IS NULL`).bind(newCertificateId(), userId).run()
    id = (await db.prepare(`SELECT cert_id FROM users WHERE id = ?`).bind(userId).first<{ cert_id: string }>())!.cert_id
  }
  return { id, name: row.name, title: row.cert_title, completedAt: Math.min(...dates) }
}

/**
 * Admin-issued certificate (1:1 coaching, or any learner Khushbu chooses). Creates the account if the
 * person never logged in. Issuing again for the same email only updates the name and programme line.
 */
export async function issueCertificate(db: D1Database, input: { email: string; name: string; title: string | null }, now: number) {
  await db.prepare(`INSERT INTO users(email, created_at, last_seen_at) VALUES(?, ?, ?) ON CONFLICT(email) DO NOTHING`).bind(input.email, now, now).run()
  const user = (await db.prepare(`SELECT id FROM users WHERE email = ?`).bind(input.email).first<{ id: number }>())!
  const existing = await certificateFor(db, user.id)
  await db
    .prepare(`UPDATE users SET name = ?, cert_title = ?, coaching_completed_at = ? WHERE id = ?`)
    .bind(input.name, input.title, existing ? (await coachedAt(db, user.id)) : now, user.id)
    .run()
  return { userId: user.id, certificate: (await certificateFor(db, user.id))! }
}

const coachedAt = async (db: D1Database, userId: number) =>
  (await db.prepare(`SELECT coaching_completed_at AS c FROM users WHERE id = ?`).bind(userId).first<{ c: number | null }>())!.c

/** True for exactly one caller: the one that gets to send the first "your certificate is ready" email. */
export async function claimCertificateEmail(db: D1Database, userId: number, now: number): Promise<boolean> {
  const res = await db.prepare(`UPDATE users SET cert_emailed_at = ? WHERE id = ? AND cert_emailed_at IS NULL`).bind(now, userId).run()
  return res.meta.changes > 0
}

async function emailCertificate(env: Env, to: string, cert: Certificate, origin: string) {
  const greeting = cert.name ? `Hi ${cert.name},` : 'Hi,'
  await sendEmail(
    env,
    to,
    'Your YPM certificate',
    `${greeting}\n\nCongratulations! Your certificate for the ${cert.title || CERTIFICATE_PROGRAMME} is ready.\n\n` +
      `View and download it (PDF): ${origin}/verify?id=${cert.id}\nCertificate ID: ${cert.id}\n\n` +
      `Anyone can confirm it is genuine at ${origin}/verify.\n\nKhushbu Sharma, YPM`,
  )
}

/** After a programme lecture is completed: the first time the learner holds a certificate, email it once. */
export async function notifyCertificate(env: Env, userId: number, origin: string, now: number) {
  const row = await env.DB.prepare(`SELECT email, cert_emailed_at FROM users WHERE id = ?`).bind(userId).first<{ email: string; cert_emailed_at: number | null }>()
  if (!row || row.cert_emailed_at !== null) return
  const cert = await certificateFor(env.DB, userId)
  if (cert && (await claimCertificateEmail(env.DB, userId, now))) await emailCertificate(env, row.email, cert, origin)
}

// ---- Routes ----

/** Public: anyone can check a certificate ID. */
export async function verifyCertificate(env: Env, id: string): Promise<Response> {
  const user = /^YPM[A-Z0-9]{8}$/.test(id.toUpperCase())
    ? await env.DB.prepare(`SELECT id FROM users WHERE cert_id = ?`).bind(id.toUpperCase()).first<{ id: number }>()
    : null
  // Re-checked on every lookup, so a certificate from a refunded course stops verifying.
  const cert = user ? await certificateFor(env.DB, user.id) : null
  if (!cert) return json({ error: 'No certificate with that ID' }, 404)
  return json({ name: cert.name ?? 'YPM Learner', title: cert.title, completedAt: cert.completedAt })
}

export async function saveProfile(req: Request, env: Env): Promise<Response> {
  const session = await requireSession(req, env)
  const body = await readJson(req)
  const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ').slice(0, 80) : ''
  if (name.length < 2) throw new HttpError(400, 'Enter your full name as it should appear on your certificate')
  // Once a certificate is issued its name is fixed (it may still be filled in if it was blank).
  const res = await env.DB.prepare(`UPDATE users SET name = ? WHERE id = ? AND (cert_id IS NULL OR name IS NULL)`).bind(name, session.userId).run()
  if (!res.meta.changes) throw new HttpError(409, 'Your certificate has been issued, so the name is locked. Contact support to correct it.')
  return json({ name })
}

async function requireAdmin(req: Request, env: Env) {
  const session = await requireSession(req, env)
  const row = await env.DB.prepare(`SELECT is_admin FROM users WHERE id = ?`).bind(session.userId).first<{ is_admin: number }>()
  if (!row?.is_admin) throw new HttpError(403, 'Admins only')
  return session
}

type StudentRow = {
  id: number
  name: string | null
  email: string
  enrolled_at: number
  done: number
  last_watch: number | null
  coached: number | null
}

/** Everything the admin dashboard shows, computed from D1. Traffic lives in Google Analytics. */
export async function adminStats(db: D1Database, now: number) {
  const since = now - 30 * DAY
  // ponytail: every student in one response; paginate once there are thousands.
  const [students, users, paid, signupDays, orderDays] = await Promise.all([
    db
      .prepare(
        `SELECT u.id, u.name, u.email, e.granted_at AS enrolled_at, u.coaching_completed_at AS coached,
           (SELECT COUNT(*) FROM progress p WHERE p.user_id = u.id AND p.completed_at IS NOT NULL AND p.lecture_id GLOB ?) AS done,
           (SELECT MAX(p.updated_at) FROM progress p WHERE p.user_id = u.id) AS last_watch
         FROM users u JOIN enrollments e ON e.user_id = u.id AND e.course_id = ? AND e.revoked_at IS NULL
         ORDER BY e.granted_at DESC`,
      )
      .bind(PROGRAMME_GLOB, PROGRAMME)
      .all<StudentRow>(),
    db.prepare(`SELECT COUNT(*) AS total, SUM(created_at >= ?) AS recent FROM users`).bind(since).first<{ total: number; recent: number | null }>(),
    db.prepare(`SELECT COUNT(*) AS n, COALESCE(SUM(amount), 0) AS paise FROM orders WHERE status = 'paid'`).first<{ n: number; paise: number }>(),
    db
      .prepare(`SELECT CAST((created_at + ?) / ? AS INTEGER) AS day, COUNT(*) AS n FROM users WHERE created_at >= ? GROUP BY day`)
      .bind(IST, DAY, since)
      .all<{ day: number; n: number }>(),
    db
      .prepare(`SELECT CAST((paid_at + ?) / ? AS INTEGER) AS day, COUNT(*) AS n, SUM(amount) AS paise FROM orders WHERE status = 'paid' AND paid_at >= ? GROUP BY day`)
      .bind(IST, DAY, since)
      .all<{ day: number; n: number; paise: number }>(),
  ])
  const list = students.results
  // ponytail: one certificateFor per holder (it re-checks validity); a single query if holders reach the thousands.
  const holders = (await db.prepare(`SELECT id, email FROM users WHERE cert_id IS NOT NULL`).all<{ id: number; email: string }>()).results
  const certificates = (
    await Promise.all(
      holders.map(async (h) => {
        const c = await certificateFor(db, h.id)
        return c && { id: c.id, email: h.email, name: c.name, title: c.title, issuedAt: c.completedAt, coached: (await coachedAt(db, h.id)) !== null }
      }),
    )
  )
    .filter((c) => c !== null)
    .sort((a, b) => b.issuedAt - a.issuedAt)
  const pct = (s: StudentRow) => Math.min(100, Math.round((s.done * 100) / PROGRAMME_SIZE))
  const today = Math.floor((now + IST) / DAY)
  const signupsBy = new Map(signupDays.results.map((r) => [r.day, r.n]))
  const ordersBy = new Map(orderDays.results.map((r) => [r.day, r]))
  return {
    totalStudents: list.length,
    activeStudents: list.filter((s) => s.last_watch !== null && s.last_watch >= now - 7 * DAY).length,
    newStudents: list.filter((s) => s.enrolled_at >= since).length,
    completionRate: list.length ? Math.round((list.filter((s) => s.done >= PROGRAMME_SIZE).length * 100) / list.length) : 0,
    averageProgress: list.length ? Math.round(list.reduce((n, s) => n + pct(s), 0) / list.length) : 0,
    signups: { total: users?.total ?? 0, last30: users?.recent ?? 0 },
    revenue: { orders: paid?.n ?? 0, paise: paid?.paise ?? 0 },
    // Last 30 days, oldest first; `date` is the IST calendar day.
    daily: Array.from({ length: 30 }, (_, i) => {
      const day = today - 29 + i
      return {
        date: new Date(day * DAY).toISOString().slice(0, 10),
        signups: signupsBy.get(day) ?? 0,
        enrollments: ordersBy.get(day)?.n ?? 0,
        paise: ordersBy.get(day)?.paise ?? 0,
      }
    }),
    students: list.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      enrolledAt: s.enrolled_at,
      progress: pct(s),
      lastWatchedAt: s.last_watch,
      coachingDone: s.coached !== null,
    })),
    certificates,
  }
}

export async function adminStatsRoute(req: Request, env: Env): Promise<Response> {
  await requireAdmin(req, env)
  return json(await adminStats(env.DB, Date.now()))
}

/** Marks (or unmarks) the 1:1 Coaching Programme complete, which issues the certificate. */
export async function adminCoaching(req: Request, env: Env): Promise<Response> {
  const admin = await requireAdmin(req, env)
  const body = await readJson(req)
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const now = Date.now()
  // By email, so 1:1 clients who never bought the course can be marked too (they must have logged in once).
  const user = await env.DB.prepare(`UPDATE users SET coaching_completed_at = ? WHERE email = ? RETURNING id`)
    .bind(body.done ? now : null, email)
    .first<{ id: number }>()
  if (!user) throw new HttpError(404, 'No account with that email yet. Ask them to log in once first.')
  const userId = user.id
  await env.DB.prepare(`INSERT INTO events(user_id, type, data, at) VALUES(?, 'coaching', ?, ?)`)
    .bind(userId, JSON.stringify({ done: !!body.done, by: admin.userId }), now)
    .run()
  return json({ ok: true })
}

const field = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '')

export async function adminIssueCertificate(req: Request, env: Env): Promise<Response> {
  const admin = await requireAdmin(req, env)
  const body = await readJson(req)
  const email = field(body.email, 200).toLowerCase()
  const name = field(body.name, 80)
  if (!isEmail(email)) throw new HttpError(400, 'Enter a valid email address')
  if (name.length < 2) throw new HttpError(400, 'Enter the name to print on the certificate')
  const now = Date.now()
  const { userId, certificate } = await issueCertificate(env.DB, { email, name, title: field(body.title, 80) || null }, now)
  await env.DB.prepare(`INSERT INTO events(user_id, type, data, at) VALUES(?, 'certificate_issue', ?, ?)`)
    .bind(userId, JSON.stringify({ by: admin.userId, emailed: !!body.send }), now)
    .run()
  if (body.send) {
    await emailCertificate(env, email, certificate, new URL(req.url).origin)
    await env.DB.prepare(`UPDATE users SET cert_emailed_at = ? WHERE id = ?`).bind(now, userId).run()
  }
  return json({ id: certificate.id })
}

export async function adminEmailCertificate(req: Request, env: Env): Promise<Response> {
  await requireAdmin(req, env)
  const email = field((await readJson(req)).email, 200).toLowerCase()
  const user = await env.DB.prepare(`SELECT id FROM users WHERE email = ?`).bind(email).first<{ id: number }>()
  const cert = user && (await certificateFor(env.DB, user.id))
  if (!user || !cert) throw new HttpError(404, 'That email has no certificate')
  await emailCertificate(env, email, cert, new URL(req.url).origin)
  await env.DB.prepare(`UPDATE users SET cert_emailed_at = ? WHERE id = ?`).bind(Date.now(), user.id).run()
  return json({ ok: true })
}
