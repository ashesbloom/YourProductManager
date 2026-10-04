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
