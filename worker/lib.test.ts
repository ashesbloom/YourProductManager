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
  assert.equal(PRODUCTS['ai-product'].pricePaise, 1_199_900)
  assert.deepEqual(PRODUCTS['ai-product'].grants, ['ai-product', 'foundations'])
  assert.equal(PRODUCTS.foundations.pricePaise, 299_900)
})

test('catalog: lookup ignores prototype keys and non-strings', () => {
  assert.equal(lookup(PRODUCTS, '__proto__'), undefined)
  assert.equal(lookup(PRODUCTS, 'constructor'), undefined)
  assert.equal(lookup(PRODUCTS, 42), undefined)
  assert.equal(lookup(PRODUCTS, 'foundations')?.id, 'foundations')
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
    batch: async (stmts: Array<{ run: () => Promise<unknown> }>) => {
      const out = []
      for (const s of stmts) out.push(await s.run())
      return out
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
