import { HttpError } from './http.ts'

export async function sendEmail(env: Env, to: string, subject: string, text: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    // Local dev without Resend: read the email (e.g. a login code) from the dev server console.
    // Production must have RESEND_API_KEY set (Task 13 checklist), or codes would land in Workers Logs.
    console.log(JSON.stringify({ msg: 'email not sent (no RESEND_API_KEY)', to, subject, text }))
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, text }),
  })
  if (!res.ok) {
    console.error(JSON.stringify({ msg: 'email failed', to, subject, status: res.status, body: await res.text() }))
    throw new HttpError(502, 'Could not send the email. Please try again.')
  }
}
