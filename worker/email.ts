import { SUPPORT_EMAIL } from '../src/lib/links.ts'
import { HttpError, json, readJson } from './http.ts'
import { isEmail } from './lib.ts'

export async function sendEmail(
  env: Env,
  to: string,
  subject: string,
  text: string,
  replyTo?: string,
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
  await sendEmail(env, SUPPORT_EMAIL, `[${topic}] Enquiry from ${name}`, `${message}\n\n— ${name} <${email}>`, email)
  return json({ ok: true })
}
