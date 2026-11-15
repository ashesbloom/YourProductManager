import { CONTACT_EMAIL, HELLO_EMAIL, SUPPORT_EMAIL } from '../src/lib/links.ts'
import { HttpError, json, readJson } from './http.ts'
import { isEmail } from './lib.ts'

export async function sendEmail(
  env: Env,
  to: string,
  subject: string,
  text: string,
  replyTo = SUPPORT_EMAIL, // mail comes from no-reply@, so a student's reply lands with support
  attachments?: Array<{ filename: string; content: string }>, // content is base64
): Promise<void> {
  if (!env.RESEND_API_KEY) {
    // Local dev without Resend: read the email (e.g. a login code) from the dev server console.
    // Production must have RESEND_API_KEY set (Task 13 checklist), or codes would land in Workers Logs.
    console.log(JSON.stringify({ msg: 'email not sent (no RESEND_API_KEY)', to, subject, text, attachments: attachments?.map((a) => a.filename) }))
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, text, reply_to: replyTo, attachments }),
  })
  if (!res.ok) {
    console.error(JSON.stringify({ msg: 'email failed', to, subject, status: res.status, body: await res.text() }))
    throw new HttpError(502, 'Could not send the email. Please try again.')
  }
}

const CONTACT_PER_HOUR = 20
const CONTACT_TOPICS = ['Courses', '1:1 Coaching', 'Mock Interview', 'Other']

/** Contact form → the support inbox, with Reply-To set to the sender. */
export async function contact(req: Request, env: Env): Promise<Response> {
  const body = await readJson(req)
  // Bots fill every field; people never see this one.
  if (body.website) return json({ ok: true })
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
  const name = str(body.name, 80).replace(/\s+/g, ' ')
  const email = str(body.email, 254).toLowerCase()
  const message = str(body.message, 5000)
  const topic = CONTACT_TOPICS.includes(body.topic as string) ? (body.topic as string) : 'Other'
  if (!name || !isEmail(email) || message.length < 5) throw new HttpError(400, 'Please fill in your name, a valid email and a message.')
  // Resend's quota is shared with login codes, so a hard global cap keeps a flood from breaking login.
  // ponytail: global cap + honeypot; add Turnstile (as on login) if real spam starts hitting the cap.
  const now = Date.now()
  // Count-and-reserve in one statement, so a burst of parallel requests can't overshoot the cap.
  const slot = await env.DB.prepare(
    `INSERT INTO events(user_id, type, data, at) SELECT NULL, 'contact', ?, ?
     WHERE (SELECT COUNT(*) FROM events WHERE type = 'contact' AND at > ?) < ?`,
  )
    .bind(JSON.stringify({ topic }), now, now - 3_600_000, CONTACT_PER_HOUR)
    .run()
  if (!slot.meta.changes) throw new HttpError(429, `Too many messages right now. Please email ${SUPPORT_EMAIL} directly.`)
  await sendEmail(env, topic === 'Courses' ? SUPPORT_EMAIL : CONTACT_EMAIL, `[${topic}] Enquiry from ${name}`, `${message}\n\n— ${name} <${email}>`, email)
  return json({ ok: true })
}

const REVIEWS_PER_HOUR = 10

/** Linkedin profile links only; anything else is dropped rather than emailed on. */
export function linkedinUrl(v: unknown): string | null {
  if (typeof v !== 'string' || !v.trim()) return null
  try {
    const u = new URL(v.trim().startsWith('http') ? v.trim() : `https://${v.trim()}`)
    const ok = u.protocol === 'https:' && (u.hostname === 'linkedin.com' || u.hostname.endsWith('.linkedin.com') || u.hostname === 'lnkd.in')
    return ok ? u.href : null
  } catch {
    return null
  }
}

/** "Write a review" → saved as an event (for a later approve-to-homepage step) and emailed to hello@. */
export async function review(req: Request, env: Env): Promise<Response> {
  const body = await readJson(req)
  if (body.website) return json({ ok: true }) // honeypot, as on the contact form
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
  const name = str(body.name, 80).replace(/\s+/g, ' ')
  const role = str(body.role, 80).replace(/\s+/g, ' ')
  const text = str(body.review, 3000)
  const rating = Number(body.rating)
  const linkedin = linkedinUrl(body.linkedin)
  if (name.length < 2 || !role || text.length < 10 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new HttpError(400, 'Please add your name, background, a star rating and a few words.')
  }
  if (body.linkedin && !linkedin) throw new HttpError(400, 'That LinkedIn link doesn’t look right. Leave it empty or paste your profile link.')
  const now = Date.now()
  const data = { name, role, rating, review: text, linkedin }
  const slot = await env.DB.prepare(
    `INSERT INTO events(user_id, type, data, at) SELECT NULL, 'review', ?, ?
     WHERE (SELECT COUNT(*) FROM events WHERE type = 'review' AND at > ?) < ?`,
  )
    .bind(JSON.stringify(data), now, now - 3_600_000, REVIEWS_PER_HOUR)
    .run()
  if (!slot.meta.changes) throw new HttpError(429, `Too many reviews right now. Please email ${HELLO_EMAIL} instead.`)
  await sendEmail(
    env,
    HELLO_EMAIL,
    `New review: ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} from ${name}`,
    `${name} (${role}) left a ${rating}/5 review on the website:\n\n${text}\n\nLinkedIn: ${linkedin ?? 'not given'}`,
  )
  return json({ ok: true })
}
