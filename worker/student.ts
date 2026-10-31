import { courseLectures } from '../src/data/catalog.ts'
import { HttpError, json, readJson, requireSession } from './http.ts'

// The certificate programme is every AI PM lecture (Foundations is the free bonus). Matched by id
// prefix rather than an IN list: D1 allows at most 100 bound parameters per query.
const PROGRAMME = 'ai-product'
const PROGRAMME_GLOB = `${PROGRAMME}-*`
export const PROGRAMME_SIZE = courseLectures(PROGRAMME).length
const DAY = 86_400_000
const IST = 19_800_000 // +05:30, so "days" in charts start at Indian midnight

export const certificateId = (userId: number) => `YPM${String(userId).padStart(7, '0')}`

export type Certificate = { id: string; name: string | null; completedAt: number }

/**
 * Earned by EITHER completing every programme lecture while enrolled, OR an admin marking the 1:1
 * Coaching Programme complete. Dated by whichever came first.
 */
export async function certificateFor(db: D1Database, userId: number): Promise<Certificate | null> {
  const row = await db
    .prepare(
      `SELECT u.name, u.coaching_completed_at AS coached,
         EXISTS(SELECT 1 FROM enrollments e WHERE e.user_id = u.id AND e.course_id = ? AND e.revoked_at IS NULL) AS enrolled,
         (SELECT COUNT(*) FROM progress p WHERE p.user_id = u.id AND p.completed_at IS NOT NULL AND p.lecture_id GLOB ?) AS done,
         (SELECT MAX(p.completed_at) FROM progress p WHERE p.user_id = u.id AND p.lecture_id GLOB ?) AS last
       FROM users u WHERE u.id = ?`,
    )
    .bind(PROGRAMME, PROGRAMME_GLOB, PROGRAMME_GLOB, userId)
    .first<{ name: string | null; coached: number | null; enrolled: number; done: number; last: number | null }>()
  if (!row) return null
  const course = row.enrolled && row.done >= PROGRAMME_SIZE ? row.last : null
  const dates = [course, row.coached].filter((d): d is number => d !== null)
  return dates.length ? { id: certificateId(userId), name: row.name, completedAt: Math.min(...dates) } : null
}

// ---- Routes ----

/** Public: anyone can check a certificate ID. */
export async function verifyCertificate(env: Env, id: string): Promise<Response> {
  const m = /^YPM(\d{7})$/.exec(id.toUpperCase())
  const cert = m && Number(m[1]) > 0 ? await certificateFor(env.DB, Number(m[1])) : null
  if (!cert) return json({ error: 'No certificate with that ID' }, 404)
  return json({ name: cert.name ?? 'YPM Learner', completedAt: cert.completedAt })
}

export async function saveProfile(req: Request, env: Env): Promise<Response> {
  const session = await requireSession(req, env)
  const body = await readJson(req)
  const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ').slice(0, 80) : ''
  if (name.length < 2) throw new HttpError(400, 'Enter your full name as it should appear on your certificate')
  await env.DB.prepare(`UPDATE users SET name = ? WHERE id = ?`).bind(name, session.userId).run()
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
  const userId = Number(body.userId)
  if (!Number.isInteger(userId) || userId <= 0) throw new HttpError(400, 'Invalid user')
  const now = Date.now()
  const res = await env.DB.prepare(`UPDATE users SET coaching_completed_at = ? WHERE id = ?`).bind(body.done ? now : null, userId).run()
  if (!res.meta.changes) throw new HttpError(404, 'No such user')
  await env.DB.prepare(`INSERT INTO events(user_id, type, data, at) VALUES(?, 'coaching', ?, ?)`)
    .bind(userId, JSON.stringify({ done: !!body.done, by: admin.userId }), now)
    .run()
  return json({ ok: true })
}
