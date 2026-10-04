import { formatINR, lookup, PRODUCTS } from '../src/data/catalog.ts'
import { SUPPORT_EMAIL } from '../src/lib/links.ts'
import { sendEmail } from './email.ts'
import { HttpError, json, readJson, requireSession } from './http.ts'
import { hmacVerify } from './lib.ts'

export type Paid = { userId: number; productId: string; amount: number }

export type RazorpayEvent = {
  event: string
  payload: {
    order?: { entity: { id: string } }
    payment?: { entity: { id: string; order_id: string; refund_status?: string | null } }
    refund?: { entity: { payment_id: string } }
  }
}

const grantsOf = (productId: string) => lookup(PRODUCTS, productId)?.grants ?? []

// ---- DB logic (exported for tests) ----

/** True when the user already holds every course the product grants (blocks paying twice). */
export async function ownsAll(db: D1Database, userId: number, grants: string[]): Promise<boolean> {
  const { results } = await db
    .prepare(`SELECT course_id FROM enrollments WHERE user_id = ? AND revoked_at IS NULL`)
    .bind(userId)
    .all<{ course_id: string }>()
  return grants.every((c) => results.some((r) => r.course_id === c))
}

/**
 * Marks an order paid and grants its courses, in ONE transactional batch: a failure part-way leaves
 * the order unpaid, so the webhook retry can still fulfil it. Idempotent: the client verify call and
 * the webhook both call this, in either order and possibly repeatedly; only the first one acts.
 * An order whose earlier attempt failed can still be paid by a later attempt.
 */
export async function fulfill(db: D1Database, orderId: string, paymentId: string, now: number): Promise<Paid | null> {
  const order = await db
    .prepare(`SELECT user_id, product_id, amount FROM orders WHERE id = ? AND status IN ('created', 'failed')`)
    .bind(orderId)
    .first<{ user_id: number; product_id: string; amount: number }>()
  if (!order) return null
  // The grants only run if this batch's UPDATE was the one that flipped the order (paid_at = now).
  const flipped = `FROM orders WHERE id = ? AND status = 'paid' AND payment_id = ? AND paid_at = ?`
  const [update] = await db.batch([
    db.prepare(`UPDATE orders SET status = 'paid', payment_id = ?, paid_at = ? WHERE id = ? AND status IN ('created', 'failed')`).bind(paymentId, now, orderId),
    ...grantsOf(order.product_id).map((courseId) =>
      db
        .prepare(
          `INSERT INTO enrollments(user_id, course_id, source, granted_at) SELECT user_id, ?, ?, ? ${flipped}
           ON CONFLICT(user_id, course_id) DO UPDATE SET source = excluded.source, granted_at = excluded.granted_at, revoked_at = NULL
           WHERE enrollments.revoked_at IS NOT NULL`,
        )
        .bind(courseId, `order:${orderId}`, now, orderId, paymentId, now),
    ),
    db
      .prepare(`INSERT INTO events(user_id, type, data, at) SELECT user_id, 'order_paid', ?, ? ${flipped}`)
      .bind(JSON.stringify({ orderId, paymentId }), now, orderId, paymentId, now),
  ])
  if (!update.meta.changes) return null // a concurrent call won the race
  return { userId: order.user_id, productId: order.product_id, amount: order.amount }
}

/** Only a still-unpaid order can fail; a late failure event never downgrades a paid one. */
export async function markFailed(db: D1Database, orderId: string, paymentId: string, now: number): Promise<void> {
  const order = await db
    .prepare(`UPDATE orders SET status = 'failed' WHERE id = ? AND status = 'created' RETURNING user_id`)
    .bind(orderId)
    .first<{ user_id: number }>()
  if (order) {
    await db.prepare(`INSERT INTO events(user_id, type, data, at) VALUES(?, 'order_failed', ?, ?)`).bind(order.user_id, JSON.stringify({ orderId, paymentId }), now).run()
  }
}

/**
 * Full refund: revoke what this order granted, unless another paid order of the same user also
 * grants that course (then hand the enrollment over to that order). Admin grants are never touched.
 * One transactional batch, so a failure part-way leaves the order paid and the retry redoes it all.
 */
export async function refund(db: D1Database, paymentId: string, now: number): Promise<void> {
  const order = await db
    .prepare(`SELECT id, user_id, product_id FROM orders WHERE payment_id = ? AND status = 'paid'`)
    .bind(paymentId)
    .first<{ id: string; user_id: number; product_id: string }>()
  if (!order) return
  const { results: others } = await db
    .prepare(`SELECT id, product_id FROM orders WHERE user_id = ? AND status = 'paid' AND id != ?`)
    .bind(order.user_id, order.id)
    .all<{ id: string; product_id: string }>()
  const source = `order:${order.id}`
  const [update] = await db.batch([
    db.prepare(`UPDATE orders SET status = 'refunded' WHERE id = ? AND status = 'paid'`).bind(order.id),
    ...grantsOf(order.product_id).map((courseId) => {
      const keeper = others.find((o) => grantsOf(o.product_id).includes(courseId))
      return keeper
        ? db.prepare(`UPDATE enrollments SET source = ? WHERE user_id = ? AND course_id = ? AND source = ?`).bind(`order:${keeper.id}`, order.user_id, courseId, source)
        : db
            .prepare(`UPDATE enrollments SET revoked_at = ? WHERE user_id = ? AND course_id = ? AND source = ? AND revoked_at IS NULL`)
            .bind(now, order.user_id, courseId, source)
    }),
  ])
  // Logged only by the call that flipped the order, so concurrent duplicates don't double-log.
  if (update.meta.changes) {
    await db.prepare(`INSERT INTO events(user_id, type, data, at) VALUES(?, 'refund', ?, ?)`).bind(order.user_id, JSON.stringify({ orderId: order.id, paymentId }), now).run()
  }
}

/** Applies one verified Razorpay webhook event. Returns the fulfilled order, if this event fulfilled it. */
export async function applyEvent(db: D1Database, evt: RazorpayEvent, now: number): Promise<Paid | null> {
  const { order, payment, refund: refunded } = evt.payload
  if (evt.event === 'order.paid' && order && payment) return fulfill(db, order.entity.id, payment.entity.id, now)
  if (evt.event === 'payment.failed' && payment) await markFailed(db, payment.entity.order_id, payment.entity.id, now)
  // Partial refunds (goodwill, price adjustments) keep access.
  if (evt.event === 'refund.processed' && refunded && payment?.entity.refund_status === 'full') await refund(db, refunded.entity.payment_id, now)
  return null
}

async function sendReceipt(env: Env, origin: string, paid: Paid): Promise<void> {
  const user = await env.DB.prepare(`SELECT email FROM users WHERE id = ?`).bind(paid.userId).first<{ email: string }>()
  const product = lookup(PRODUCTS, paid.productId)
  if (!user || !product) return
  await sendEmail(
    env,
    user.email,
    `You're enrolled: ${product.title}`,
    `Thank you for enrolling in ${product.title} (${formatINR(paid.amount)}, incl. GST).\n\n` +
      `Start learning: ${origin}/dashboard\nLog in with ${user.email}.\n\nQuestions? Write to ${SUPPORT_EMAIL}.`,
  ).catch((err) => console.error(JSON.stringify({ msg: 'receipt email failed', userId: paid.userId, err: String(err) })))
}

// ---- Routes ----

export async function checkout(req: Request, env: Env): Promise<Response> {
  const session = await requireSession(req, env)
  const product = lookup(PRODUCTS, (await readJson(req)).productId)
  if (!product) throw new HttpError(404, 'Unknown product')
  if (await ownsAll(env.DB, session.userId, product.grants)) throw new HttpError(409, 'You already have access to this course')

  const now = Date.now()
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      authorization: `Basic ${btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`)}`,
      'content-type': 'application/json',
    },
    // Amount always comes from the catalog, never from the request.
    body: JSON.stringify({
      amount: product.pricePaise,
      currency: 'INR',
      receipt: `u${session.userId}-${now}`,
      notes: { userId: String(session.userId), productId: product.id },
    }),
  })
  if (!res.ok) {
    console.error(JSON.stringify({ msg: 'razorpay order failed', status: res.status, body: await res.text() }))
    throw new HttpError(502, 'Could not start the payment. Please try again.')
  }
  const order = (await res.json()) as { id: string; amount: number }
  await env.DB.prepare(`INSERT INTO orders(id, user_id, product_id, amount, status, created_at) VALUES(?, ?, ?, ?, 'created', ?)`)
    .bind(order.id, session.userId, product.id, order.amount, now)
    .run()
  return json({
    orderId: order.id,
    amount: order.amount,
    keyId: env.RAZORPAY_KEY_ID,
    name: product.title,
    prefill: { email: session.email, name: session.name ?? '' },
  })
}

export async function checkoutVerify(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  await requireSession(req, env)
  const body = await readJson(req)
  const orderId = String(body.razorpay_order_id ?? '')
  const paymentId = String(body.razorpay_payment_id ?? '')
  const signature = String(body.razorpay_signature ?? '')
  if (!(await hmacVerify(env.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`, signature))) {
    throw new HttpError(400, 'Payment could not be verified')
  }
  const paid = await fulfill(env.DB, orderId, paymentId, Date.now())
  if (paid) ctx.waitUntil(sendReceipt(env, new URL(req.url).origin, paid))
  const row = await env.DB.prepare(`SELECT status FROM orders WHERE id = ?`).bind(orderId).first<{ status: string }>()
  return json({ status: row?.status ?? 'unknown' })
}

export async function webhook(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const raw = await req.text()
  if (!(await hmacVerify(env.RAZORPAY_WEBHOOK_SECRET, raw, req.headers.get('x-razorpay-signature') ?? ''))) {
    return json({ error: 'Bad signature' }, 400)
  }
  const evt = JSON.parse(raw) as RazorpayEvent
  console.log(JSON.stringify({ msg: 'razorpay webhook', id: req.headers.get('x-razorpay-event-id'), event: evt.event }))
  const paid = await applyEvent(env.DB, evt, Date.now())
  if (paid) ctx.waitUntil(sendReceipt(env, new URL(req.url).origin, paid))
  return json({ ok: true })
}
