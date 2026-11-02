import { googleCallback, googleStart, logout, me, sendOtp, verifyOtp } from './auth.ts'
import { contact } from './email.ts'
import { HttpError, json } from './http.ts'
import { getProgress, media, saveProgress } from './media.ts'
import { checkout, checkoutVerify, webhook } from './pay.ts'
import {
  adminCoaching,
  adminDeleteSignature,
  adminEmailCertificate,
  adminIssueCertificate,
  adminRemoveCertificatePdf,
  adminStatsRoute,
  adminUploadCertificatePdf,
  adminUploadSignature,
  certificatePdf,
  saveProfile,
  signatureImage,
  verifyCertificate,
} from './student.ts'

// Same as public/_headers, which covers the static pages; these cover the Worker's own responses.
const SECURITY_HEADERS: Record<string, string> = {
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'SAMEORIGIN',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'content-security-policy': "frame-ancestors 'self'; object-src 'none'; base-uri 'self'",
}

export default {
  async fetch(req, env, ctx): Promise<Response> {
    const res = await route(req, env, ctx)
    const secured = new Response(res.body, res) // copies status and headers; redirects' own headers are immutable
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) secured.headers.set(k, v)
    return secured
  },
} satisfies ExportedHandler<Env>

async function route(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(req.url)
  try {
    if (req.method === 'GET' && url.pathname.startsWith('/media/')) return await media(req, env, url.pathname)
    if (req.method === 'GET' && url.pathname.startsWith('/api/progress/')) {
      return await getProgress(req, env, url.pathname.slice('/api/progress/'.length))
    }
    if (req.method === 'GET' && url.pathname.startsWith('/api/certificate/')) {
      const rest = url.pathname.slice('/api/certificate/'.length)
      return rest.endsWith('/pdf') ? await certificatePdf(env, rest.slice(0, -'/pdf'.length)) : await verifyCertificate(env, rest)
    }
    const certPdf = /^\/api\/admin\/certificate\/([A-Za-z0-9]+)\/pdf$/.exec(url.pathname)
    if (certPdf && req.method === 'PUT') return await adminUploadCertificatePdf(req, env, certPdf[1])
    if (certPdf && req.method === 'DELETE') return await adminRemoveCertificatePdf(req, env, certPdf[1])
    switch (`${req.method} ${url.pathname}`) {
      case 'GET /api/health':
        return json({ ok: true })
      case 'POST /api/auth/otp':
        return await sendOtp(req, env)
      case 'POST /api/auth/verify':
        return await verifyOtp(req, env, ctx)
      case 'GET /api/auth/google':
        return googleStart(req, env)
      case 'GET /api/auth/google/callback':
        return await googleCallback(req, env, ctx)
      case 'POST /api/auth/logout':
        return await logout(req, env)
      case 'GET /api/me':
        return await me(req, env)
      case 'POST /api/checkout':
        return await checkout(req, env)
      case 'POST /api/checkout/verify':
        return await checkoutVerify(req, env, ctx)
      case 'POST /api/razorpay/webhook':
        return await webhook(req, env, ctx)
      case 'POST /api/profile':
        return await saveProfile(req, env)
      case 'GET /api/admin/stats':
        return await adminStatsRoute(req, env)
      case 'POST /api/admin/coaching':
        return await adminCoaching(req, env)
      case 'POST /api/admin/certificate':
        return await adminIssueCertificate(req, env)
      case 'POST /api/admin/certificate/email':
        return await adminEmailCertificate(req, env)
      case 'GET /api/signature':
        return await signatureImage(env)
      case 'PUT /api/admin/signature':
        return await adminUploadSignature(req, env)
      case 'DELETE /api/admin/signature':
        return await adminDeleteSignature(req, env)
      case 'POST /api/contact':
        return await contact(req, env)
      case 'POST /api/progress':
        return await saveProgress(req, env, ctx)
    }
    return json({ error: 'Not found' }, 404)
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status)
    console.error(JSON.stringify({ msg: 'unhandled', path: url.pathname, err: String(err), stack: (err as Error).stack }))
    return json({ error: 'Something went wrong' }, 500)
  }
}
