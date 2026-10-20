import { test } from 'node:test'
import assert from 'node:assert/strict'
import { COURSES, LECTURES, PRODUCTS, courseLectures, formatINR, lookup } from '../src/data/catalog.ts'

test('catalog: lecture ids are unique and URL/R2-safe', () => {
  const ids = Object.values(COURSES).flatMap((c) => courseLectures(c.id).map((l) => l.id))
  assert.equal(new Set(ids).size, ids.length)
  for (const id of ids) assert.match(id, /^[a-z0-9-]+$/)
  assert.equal(Object.keys(LECTURES).length, ids.length)
})

test('catalog: products grant existing courses at the agreed prices', () => {
  for (const p of Object.values(PRODUCTS)) {
    assert.ok(Number.isInteger(p.pricePaise) && p.pricePaise > 0, p.id)
    for (const c of p.grants) assert.ok(lookup(COURSES, c), `${p.id} grants unknown course ${c}`)
  }
  assert.equal(PRODUCTS['ai-product'].pricePaise, 999_900)
  assert.deepEqual(PRODUCTS['ai-product'].grants, ['ai-product', 'foundations'])
  assert.deepEqual(Object.keys(PRODUCTS), ['ai-product']) // Foundations is not sold on its own
})

test('catalog: lookup ignores prototype keys and non-strings', () => {
  assert.equal(lookup(PRODUCTS, '__proto__'), undefined)
  assert.equal(lookup(PRODUCTS, 'constructor'), undefined)
  assert.equal(lookup(PRODUCTS, 42), undefined)
  assert.equal(lookup(PRODUCTS, 'ai-product')?.id, 'ai-product')
})

test('catalog: formatINR uses Indian digit grouping', () => {
  assert.equal(formatINR(1_199_900), '₹11,999')
  assert.equal(formatINR(29_990_000), '₹2,99,900')
})

test('catalog: AI PM lists all 50 lectures', { todo: 'awaiting the full lecture list from Drive; Task 13 removes this todo' }, () => {
  assert.equal(courseLectures('ai-product').length, 50)
})
import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { hmacVerify, isEmail, mediaKey, randomCode, randomToken, safeNext, sha256Hex } from './lib.ts'
import { bucketCount, countHex, fromRanges, isHexBitmap, orHex } from '../src/lib/bitmap.ts'
/** D1 stand-in over node:sqlite with the real migration applied: prepare/bind/first/all/run/batch. */
function testDb(): D1Database {
  const db = new DatabaseSync(':memory:')
  db.exec('PRAGMA foreign_keys = ON;')
  db.exec(readFileSync(new URL('../migrations/0001_init.sql', import.meta.url), 'utf8'))
  const stmt = (sql: string, args: unknown[] = []) => ({
    bind: (...a: unknown[]) => stmt(sql, a),
    first: async () => db.prepare(sql).get(...(args as never[])) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...(args as never[])) }),
    run: async () => {
      const r = db.prepare(sql).run(...(args as never[]))
      return { meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } }
    },
  })
  return {
    prepare: (sql: string) => stmt(sql),
    // Transactional, like D1: a failing statement rolls back the whole batch.
    batch: async (stmts: Array<{ run: () => Promise<unknown> }>) => {
      db.exec('BEGIN')
      try {
        const out = []
        for (const s of stmts) out.push(await s.run())
        db.exec('COMMIT')
        return out
      } catch (err) {
        db.exec('ROLLBACK')
        throw err
      }
    },
  } as unknown as D1Database
}

const DAY = 86_400_000

test('schema: orders.status only allows known states', async () => {
  const db = testDb()
  await db.prepare(`INSERT INTO users(id, email, created_at, last_seen_at) VALUES(1, 'a@b.co', 0, 0)`).run()
  await assert.rejects(
    db.prepare(`INSERT INTO orders(id, user_id, product_id, amount, status, created_at) VALUES('o1', 1, 'foundations', 100, 'bogus', 0)`).run(),
  )
})

test('lib: sha256Hex matches the standard test vector', async () => {
  assert.equal(await sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
})

test('lib: hmacVerify accepts the right signature and rejects tampering', async () => {
  const sig = createHmac('sha256', 'shh').update('order_1|pay_1').digest('hex')
  assert.equal(await hmacVerify('shh', 'order_1|pay_1', sig), true)
  assert.equal(await hmacVerify('shh', 'order_1|pay_2', sig), false)
  assert.equal(await hmacVerify('other', 'order_1|pay_1', sig), false)
  assert.equal(await hmacVerify('shh', 'order_1|pay_1', 'not-hex'), false)
})

test('lib: randomCode is 6 digits; randomToken is url-safe', () => {
  for (let i = 0; i < 50; i++) assert.match(randomCode(), /^\d{6}$/)
  assert.match(randomToken(), /^[A-Za-z0-9_-]{43}$/)
})

test('lib: safeNext only allows same-site paths', () => {
  assert.equal(safeNext('/learn/foundations'), '/learn/foundations')
  assert.equal(safeNext('//evil.com'), '/dashboard')
  assert.equal(safeNext('/\\evil.com'), '/dashboard')
  assert.equal(safeNext('https://evil.com'), '/dashboard')
  assert.equal(safeNext(null), '/dashboard')
  assert.equal(safeNext('/\t/evil.com'), '/dashboard') // browsers strip tabs: would become //evil.com
  assert.equal(safeNext('/learn/x?y=1#z'), '/learn/x?y=1#z')
})

test('lib: isEmail', () => {
  assert.equal(isEmail('a@b.co'), true)
  assert.equal(isEmail('a@b'), false)
  assert.equal(isEmail('a b@c.co'), false)
  assert.equal(isEmail(`${'x'.repeat(250)}@b.co`), false)
})

test('lib: mediaKey accepts HLS paths and rejects traversal', () => {
  assert.deepEqual(mediaKey('/media/foundations-01/master.m3u8'), {
    lectureId: 'foundations-01',
    key: 'foundations-01/master.m3u8',
    ext: 'm3u8',
  })
  assert.equal(mediaKey('/media/foundations-01/720p/seg_0003.ts')?.key, 'foundations-01/720p/seg_0003.ts')
  assert.equal(mediaKey('/media/foundations-01/../secret.ts'), null)
  assert.equal(mediaKey('/media/foundations-01/x.exe'), null)
  assert.equal(mediaKey('/media/Foundations-01/master.m3u8'), null)
})

test('bitmap: only fully played 10s buckets count; seeking adds nothing', () => {
  const d = 100 // 10 buckets
  assert.equal(countHex(fromRanges([[0, 5], [95, 100]], d), bucketCount(d)), 0) // jumped to the end
  assert.equal(countHex(fromRanges([[0, 50]], d), bucketCount(d)), 5)
  assert.equal(countHex(fromRanges([[0, 9.6]], d), bucketCount(d)), 1) // 0.5s float tolerance
})

test('bitmap: the short last bucket counts when played to the end', () => {
  assert.equal(countHex(fromRanges([[90, 95]], 95), bucketCount(95)), 1)
})

test('bitmap: two partial sessions merge past the completion bar', () => {
  const n = bucketCount(100)
  const merged = orHex(fromRanges([[0, 50]], 100), fromRanges([[50, 90]], 100), n)
  assert.equal(Math.floor((countHex(merged, n) * 100) / n), 90)
})

test('bitmap: validation rejects non-hex, odd-length and oversized input', () => {
  const n = bucketCount(100) // 2 bytes
  assert.equal(isHexBitmap('ff03', n), true)
  assert.equal(isHexBitmap('', n), true)
  assert.equal(isHexBitmap('zz03', n), false)
  assert.equal(isHexBitmap('fff', n), false)
  assert.equal(isHexBitmap('ff03ff', n), false)
})

test('bitmap: bits beyond the lecture length are ignored', () => {
  assert.equal(countHex('ffff', 10), 10)
})
import { checkOtp, createSession, issueOtp, upsertUser } from './auth.ts'
import { loadSession, SESSION_IDLE_MS } from './http.ts'
test('otp: single-use code, 60s cooldown, expiry', async () => {
  const db = testDb()
  const t0 = 1_000_000
  const first = (await issueOtp(db, 'a@b.co', t0)) as { code: string }
  assert.match(first.code, /^\d{6}$/)
  assert.equal(await issueOtp(db, 'a@b.co', t0 + 30_000), 'cooldown')
  assert.equal(await checkOtp(db, 'a@b.co', first.code === '000000' ? '111111' : '000000', t0 + 1), false)
  assert.equal(await checkOtp(db, 'a@b.co', first.code, t0 + 2), true)
  assert.equal(await checkOtp(db, 'a@b.co', first.code, t0 + 3), false) // already used
  const second = (await issueOtp(db, 'a@b.co', t0 + 61_000)) as { code: string }
  assert.equal(await checkOtp(db, 'a@b.co', second.code, t0 + 61_000 + 10 * 60_000 + 1), false) // expired
})

test('otp: locks after 5 wrong attempts', async () => {
  const db = testDb()
  const { code } = (await issueOtp(db, 'a@b.co', 0)) as { code: string }
  const wrong = code === '000000' ? '111111' : '000000'
  for (let i = 0; i < 5; i++) assert.equal(await checkOtp(db, 'a@b.co', wrong, 1), false)
  assert.equal(await checkOtp(db, 'a@b.co', code, 2), false)
})

test('otp: at most 10 codes per email per 24h', async () => {
  const db = testDb()
  for (let i = 0; i < 10; i++) assert.equal(typeof (await issueOtp(db, 'a@b.co', i * 61_000)), 'object')
  assert.equal(await issueOtp(db, 'a@b.co', 10 * 61_000), 'limit')
  assert.equal(typeof (await issueOtp(db, 'a@b.co', DAY + 1)), 'object')
})

test('users: first-touch utm kept; Google sub links to the same account', async () => {
  const db = testDb()
  const id = await upsertUser(db, { email: 'a@b.co', utm: '{"utm_source":"meta"}' }, 1)
  assert.equal(await upsertUser(db, { email: 'a@b.co', utm: '{"utm_source":"organic"}' }, 2), id)
  assert.equal(await upsertUser(db, { email: 'a@b.co', googleSub: 'g-1', name: 'A' }, 3), id)
  assert.equal(await upsertUser(db, { email: 'renamed@b.co', googleSub: 'g-1' }, 4), id) // Google email changed
  const row = (await db.prepare(`SELECT utm, name, google_sub FROM users WHERE id = ?`).bind(id).first()) as Record<string, unknown>
  assert.equal(row.utm, '{"utm_source":"meta"}')
  assert.equal(row.name, 'A')
  assert.equal(row.google_sub, 'g-1')
})

test('session: lookup, idle expiry, sliding refresh, max 3 per user', async () => {
  const db = testDb()
  const uid = await upsertUser(db, { email: 'a@b.co' }, 0)
  const t1 = await createSession(db, uid, 0)
  assert.equal((await loadSession(db, t1, 1))?.userId, uid)
  assert.equal(await loadSession(db, t1, SESSION_IDLE_MS + 1), null) // idle too long
  assert.equal(await loadSession(db, 'not-a-token', 1), null)
  const t2 = await createSession(db, uid, 0)
  await loadSession(db, t2, 2 * DAY) // activity on day 2 slides the expiry
  assert.ok(await loadSession(db, t2, SESSION_IDLE_MS + DAY))
  await createSession(db, uid, 10)
  const t4 = await createSession(db, uid, 20) // 4th session evicts the oldest (t1)
  assert.equal(await loadSession(db, t1, 30), null)
  assert.ok(await loadSession(db, t4, 30))
})
import { applyEvent, fulfill, markFailed, ownsAll, refund } from './pay.ts'
async function seedOrder(db: D1Database, id: string, productId: string, userId = 1) {
  await db.prepare(`INSERT OR IGNORE INTO users(id, email, created_at, last_seen_at) VALUES(?, ?, 0, 0)`).bind(userId, `u${userId}@b.co`).run()
  await db
    .prepare(`INSERT INTO orders(id, user_id, product_id, amount, status, created_at) VALUES(?, ?, ?, 100, 'created', 0)`)
    .bind(id, userId, productId)
    .run()
}
const active = async (db: D1Database, userId = 1) =>
  (
    await db.prepare(`SELECT course_id FROM enrollments WHERE user_id = ? AND revoked_at IS NULL ORDER BY course_id`).bind(userId).all()
  ).results.map((r) => (r as { course_id: string }).course_id)
const paidEvent = (orderId: string, paymentId: string) => ({
  event: 'order.paid',
  payload: { order: { entity: { id: orderId } }, payment: { entity: { id: paymentId, order_id: orderId } } },
})
const refundEvent = (orderId: string, paymentId: string, refund_status: string) => ({
  event: 'refund.processed',
  payload: { refund: { entity: { payment_id: paymentId } }, payment: { entity: { id: paymentId, order_id: orderId, refund_status } } },
})

test('pay: client verify and webhook racing grant access exactly once', async () => {
  const db = testDb()
  await seedOrder(db, 'order_A', 'ai-product')
  assert.ok(await fulfill(db, 'order_A', 'pay_1', 10))
  assert.equal(await applyEvent(db, paidEvent('order_A', 'pay_1'), 11), null) // webhook arrives second
  assert.equal(await fulfill(db, 'order_A', 'pay_1', 12), null) // retried delivery
  assert.deepEqual(await active(db), ['ai-product', 'foundations'])
  const { n } = (await db.prepare(`SELECT COUNT(*) AS n FROM events WHERE type = 'order_paid'`).first()) as { n: number }
  assert.equal(n, 1)
})

test('pay: failed attempt then success on the same order; a late failure never downgrades', async () => {
  const db = testDb()
  await seedOrder(db, 'order_A', 'ai-product')
  await markFailed(db, 'order_A', 'pay_1', 1)
  assert.ok(await fulfill(db, 'order_A', 'pay_2', 2))
  await markFailed(db, 'order_A', 'pay_3', 3)
  const { status } = (await db.prepare(`SELECT status FROM orders WHERE id = 'order_A'`).first()) as { status: string }
  assert.equal(status, 'paid')
  assert.deepEqual(await active(db), ['ai-product', 'foundations'])
})

test('pay: unknown order is a no-op', async () => {
  assert.equal(await fulfill(testDb(), 'order_missing', 'pay', 1), null)
})

test('pay: ownsAll blocks paying twice', async () => {
  const db = testDb()
  const grants = PRODUCTS['ai-product'].grants
  await seedOrder(db, 'order_A', 'ai-product')
  assert.equal(await ownsAll(db, 1, grants), false)
  await fulfill(db, 'order_A', 'pay_1', 1)
  assert.equal(await ownsAll(db, 1, grants), true)
})

test('pay: partial refund keeps access; full refund revokes', async () => {
  const db = testDb()
  await seedOrder(db, 'order_A', 'ai-product')
  await applyEvent(db, paidEvent('order_A', 'pay_A'), 1)
  await applyEvent(db, refundEvent('order_A', 'pay_A', 'partial'), 2)
  assert.deepEqual(await active(db), ['ai-product', 'foundations'])
  await applyEvent(db, refundEvent('order_A', 'pay_A', 'full'), 3)
  assert.deepEqual(await active(db), [])
})

test('pay: full refund revokes only what that order granted', async () => {
  const db = testDb()
  await seedOrder(db, 'order_A', 'ai-product')
  await fulfill(db, 'order_A', 'pay_A', 1)
  await seedOrder(db, 'order_B', 'ai-product')
  await fulfill(db, 'order_B', 'pay_B', 2)
  await refund(db, 'pay_A', 3)
  assert.deepEqual(await active(db), ['ai-product', 'foundations']) // order B still grants both
  await refund(db, 'pay_B', 4)
  assert.deepEqual(await active(db), [])
})

test('pay: admin grants survive refunds; buying again after a refund restores access', async () => {
  const db = testDb()
  await seedOrder(db, 'order_A', 'ai-product')
  await fulfill(db, 'order_A', 'pay_A', 1)
  await db.prepare(`UPDATE enrollments SET source = 'admin' WHERE course_id = 'foundations'`).run()
  await refund(db, 'pay_A', 2)
  assert.deepEqual(await active(db), ['foundations'])
  await seedOrder(db, 'order_C', 'ai-product')
  await fulfill(db, 'order_C', 'pay_C', 3)
  assert.deepEqual(await active(db), ['ai-product', 'foundations'])
})
import { hasAccess, parseProgress, recordProgress } from './media.ts'
test('media: access needs a live session and an unrevoked enrollment in that course', async () => {
  const db = testDb()
  const uid = await upsertUser(db, { email: 'a@b.co' }, 0)
  const sid = await sha256Hex(await createSession(db, uid, 0))
  assert.equal(await hasAccess(db, sid, 'foundations', 1), false) // not enrolled
  await db.prepare(`INSERT INTO enrollments(user_id, course_id, source, granted_at) VALUES(?, 'foundations', 'admin', 0)`).bind(uid).run()
  assert.equal(await hasAccess(db, sid, 'foundations', 1), true)
  assert.equal(await hasAccess(db, sid, 'ai-product', 1), false) // a different course
  assert.equal(await hasAccess(db, sid, 'foundations', SESSION_IDLE_MS + 1), false) // session expired mid-video
  await db.prepare(`UPDATE enrollments SET revoked_at = 5`).run()
  assert.equal(await hasAccess(db, sid, 'foundations', 6), false) // refunded / revoked mid-video
})

test('progress: rejects lectures without video and malformed bitmaps; clamps position', () => {
  const lectures = {
    live: { id: 'live', title: 'L', free: false, durationS: 100, courseId: 'foundations' },
    soon: { id: 'soon', title: 'S', free: false, durationS: 0, courseId: 'foundations' },
  }
  assert.throws(() => parseProgress({ lectureId: 'soon', watched: '' }, lectures), { status: 404 })
  assert.throws(() => parseProgress({ lectureId: '__proto__', watched: '' }, lectures), { status: 404 })
  assert.throws(() => parseProgress({ lectureId: 'live', watched: 'zz' }, lectures), { status: 400 })
  assert.throws(() => parseProgress({ lectureId: 'live', watched: 'ff'.repeat(50) }, lectures), { status: 400 })
  assert.equal(parseProgress({ lectureId: 'live', watched: 'ff03', positionS: 9999 }, lectures).positionS, 100)
  assert.equal(parseProgress({ lectureId: 'live', watched: 'ff03', positionS: 'x' }, lectures).positionS, 0)
})

test('progress: completes once at 85% across sessions; seeking adds nothing; resume follows the latest beat', async () => {
  const db = testDb()
  const uid = await upsertUser(db, { email: 'a@b.co' }, 0)
  const lec = { id: 'foundations-01', durationS: 100 }
  assert.deepEqual(await recordProgress(db, uid, lec, 50, fromRanges([[0, 50]], 100), 1), { pct: 50, completed: false })
  assert.deepEqual(await recordProgress(db, uid, lec, 95, fromRanges([[0, 5], [95, 100]], 100), 2), { pct: 50, completed: false })
  assert.deepEqual(await recordProgress(db, uid, lec, 90, fromRanges([[50, 90]], 100), 3), { pct: 90, completed: true })
  assert.deepEqual(await recordProgress(db, uid, lec, 10, fromRanges([[0, 10]], 100), 4), { pct: 90, completed: true })
  const { n } = (await db.prepare(`SELECT COUNT(*) AS n FROM events WHERE type = 'lecture_done'`).first()) as { n: number }
  assert.equal(n, 1)
  const { position_s } = (await db.prepare(`SELECT position_s FROM progress`).first()) as { position_s: number }
  assert.equal(position_s, 10)
})

test('pay: a failure while granting leaves the order retryable (no paid-without-access)', async () => {
  const db = testDb()
  await seedOrder(db, 'order_A', 'ai-product')
  await db.prepare(`CREATE TRIGGER boom BEFORE INSERT ON enrollments BEGIN SELECT RAISE(ABORT, 'boom'); END`).run()
  await assert.rejects(fulfill(db, 'order_A', 'pay_1', 1))
  await db.prepare(`DROP TRIGGER boom`).run()
  assert.ok(await fulfill(db, 'order_A', 'pay_1', 2)) // the webhook retry repairs it
  assert.deepEqual(await active(db), ['ai-product', 'foundations'])
})

test('pay: a failure while revoking leaves the refund retryable', async () => {
  const db = testDb()
  await seedOrder(db, 'order_A', 'ai-product')
  await fulfill(db, 'order_A', 'pay_A', 1)
  await db.prepare(`CREATE TRIGGER boom BEFORE UPDATE ON enrollments BEGIN SELECT RAISE(ABORT, 'boom'); END`).run()
  await assert.rejects(refund(db, 'pay_A', 2))
  await db.prepare(`DROP TRIGGER boom`).run()
  await refund(db, 'pay_A', 3)
  assert.deepEqual(await active(db), [])
  const { n } = (await db.prepare(`SELECT COUNT(*) AS n FROM events WHERE type = 'refund'`).first()) as { n: number }
  assert.equal(n, 1)
})
