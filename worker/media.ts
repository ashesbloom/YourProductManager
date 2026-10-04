import { COMPLETE_PCT, COURSES, LECTURES, lookup } from '../src/data/catalog.ts'
import { bucketCount, countHex, isHexBitmap, orHex } from '../src/lib/bitmap.ts'
import { getCookie, HttpError, json, readJson, requireSession, SESSION_COOKIE } from './http.ts'
import { CONTENT_TYPES, mediaKey, sha256Hex } from './lib.ts'

type TrackedLecture = { id: string; courseId: string; durationS: number; free: boolean }

// ---- DB logic (exported for tests) ----

/** Live session whose user holds an unrevoked enrollment in the course. */
export async function hasAccess(db: D1Database, sid: string, courseId: string, now: number): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT 1 AS ok FROM sessions s JOIN enrollments e ON e.user_id = s.user_id
       WHERE s.id = ? AND s.expires_at > ? AND e.course_id = ? AND e.revoked_at IS NULL`,
    )
    .bind(sid, now, courseId)
    .first()
  return row !== null
}

/** Validates a heartbeat body. Lectures without a video yet (durationS 0) can't be tracked. */
export function parseProgress(
  body: Record<string, unknown>,
  lectures: Record<string, TrackedLecture> = LECTURES,
): { lecture: TrackedLecture; positionS: number; watched: string } {
  const lecture = lookup(lectures, body.lectureId)
  if (!lecture || lecture.durationS <= 0) throw new HttpError(404, 'Unknown lecture')
  if (typeof body.watched !== 'string' || !isHexBitmap(body.watched, bucketCount(lecture.durationS))) {
    throw new HttpError(400, 'Invalid progress')
  }
  const positionS = Math.min(lecture.durationS, Math.max(0, Math.floor(Number(body.positionS) || 0)))
  return { lecture, positionS, watched: body.watched }
}

/** ORs the new buckets into the stored ones; completion is set once and never undone. */
export async function recordProgress(
  db: D1Database,
  userId: number,
  lecture: { id: string; durationS: number },
  positionS: number,
  watched: string,
  now: number,
): Promise<{ pct: number; completed: boolean }> {
  const n = bucketCount(lecture.durationS)
  const prev = await db
    .prepare(`SELECT watched, completed_at FROM progress WHERE user_id = ? AND lecture_id = ?`)
    .bind(userId, lecture.id)
    .first<{ watched: string; completed_at: number | null }>()
  const merged = orHex(prev?.watched ?? '', watched, n)
  const pct = Math.floor((countHex(merged, n) * 100) / n)
  const newlyDone = !prev?.completed_at && pct >= COMPLETE_PCT
  const completedAt = prev?.completed_at ?? (newlyDone ? now : null)
  const stmts = [
    db
      .prepare(
        `INSERT INTO progress(user_id, lecture_id, position_s, watched, pct, completed_at, updated_at) VALUES(?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, lecture_id) DO UPDATE SET position_s = excluded.position_s, watched = excluded.watched,
           pct = excluded.pct, completed_at = excluded.completed_at, updated_at = excluded.updated_at`,
      )
      .bind(userId, lecture.id, positionS, merged, pct, completedAt, now),
  ]
  if (newlyDone) {
    stmts.push(db.prepare(`INSERT INTO events(user_id, type, data, at) VALUES(?, 'lecture_done', ?, ?)`).bind(userId, JSON.stringify({ lectureId: lecture.id }), now))
  }
  await db.batch(stmts)
  return { pct, completed: completedAt !== null }
}

// ---- Routes ----

export async function media(req: Request, env: Env, pathname: string): Promise<Response> {
  const parsed = mediaKey(pathname)
  const lecture = parsed ? lookup(LECTURES, parsed.lectureId) : undefined
  if (!parsed || !lecture) return json({ error: 'Not found' }, 404)
  if (!lecture.free) {
    const token = getCookie(req, SESSION_COOKIE)
    if (!token) return json({ error: 'Please log in' }, 401)
    // ponytail: one D1 read per video chunk; switch to a signed short-lived media cookie if latency or read volume ever matters.
    if (!(await hasAccess(env.DB, await sha256Hex(token), lecture.courseId, Date.now()))) {
      return json({ error: 'No access to this lecture' }, 403)
    }
  }
  const obj = await env.MEDIA.get(parsed.key)
  if (!obj) return json({ error: 'Not found' }, 404)
  return new Response(obj.body, {
    headers: {
      'content-type': CONTENT_TYPES[parsed.ext],
      etag: obj.httpEtag,
      // private: chunks must never sit in a shared cache where a non-student could fetch them.
      'cache-control': parsed.ext === 'm3u8' ? 'private, no-cache' : 'private, max-age=86400',
    },
  })
}

export async function saveProgress(req: Request, env: Env): Promise<Response> {
  const session = await requireSession(req, env)
  const { lecture, positionS, watched } = parseProgress(await readJson(req))
  const now = Date.now()
  if (!lecture.free && !(await hasAccess(env.DB, session.sid, lecture.courseId, now))) {
    throw new HttpError(403, 'No access to this lecture')
  }
  return json(await recordProgress(env.DB, session.userId, lecture, positionS, watched, now))
}

export async function getProgress(req: Request, env: Env, courseId: string): Promise<Response> {
  const session = await requireSession(req, env)
  if (!lookup(COURSES, courseId)) throw new HttpError(404, 'Unknown course')
  const { results } = await env.DB.prepare(`SELECT lecture_id, position_s, pct, completed_at, updated_at FROM progress WHERE user_id = ?`)
    .bind(session.userId)
    .all<{ lecture_id: string; position_s: number; pct: number; completed_at: number | null; updated_at: number }>()
  const lectures: Record<string, { positionS: number; pct: number; completed: boolean; updatedAt: number }> = {}
  for (const r of results) {
    if (lookup(LECTURES, r.lecture_id)?.courseId !== courseId) continue
    lectures[r.lecture_id] = { positionS: r.position_s, pct: r.pct, completed: r.completed_at !== null, updatedAt: r.updated_at }
  }
  return json({ lectures })
}
