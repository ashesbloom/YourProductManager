import { googleCallback, googleStart, logout, me, sendOtp, verifyOtp } from './auth.ts'
import { contact } from './email.ts'
import { HttpError, json } from './http.ts'
import { getProgress, media, saveProgress } from './media.ts'
import { checkout, checkoutVerify, webhook } from './pay.ts'
import { adminCoaching, adminStatsRoute, saveProfile, verifyCertificate } from './student.ts'

export default {
  async fetch(req, env, ctx): Promise<Response> {
    const url = new URL(req.url)
    try {
      if (req.method === 'GET' && url.pathname.startsWith('/media/')) return await media(req, env, url.pathname)
      if (req.method === 'GET' && url.pathname.startsWith('/api/progress/')) {
        return await getProgress(req, env, url.pathname.slice('/api/progress/'.length))
      }
      if (req.method === 'GET' && url.pathname.startsWith('/api/certificate/')) {
        return await verifyCertificate(env, url.pathname.slice('/api/certificate/'.length))
      }
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
        case 'POST /api/contact':
          return await contact(req, env)
        case 'POST /api/progress':
          return await saveProgress(req, env)
      }
      return json({ error: 'Not found' }, 404)
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status)
      console.error(JSON.stringify({ msg: 'unhandled', path: url.pathname, err: String(err), stack: (err as Error).stack }))
      return json({ error: 'Something went wrong' }, 500)
    }
  },
} satisfies ExportedHandler<Env>
