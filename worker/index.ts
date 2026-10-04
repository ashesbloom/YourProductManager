import { googleCallback, googleStart, logout, me, sendOtp, verifyOtp } from './auth.ts'
import { HttpError, json } from './http.ts'
import { getProgress, media, saveProgress } from './media.ts'
import { checkout, checkoutVerify, webhook } from './pay.ts'

export default {
  async fetch(req, env, ctx): Promise<Response> {
    const url = new URL(req.url)
    try {
      if (req.method === 'GET' && url.pathname.startsWith('/media/')) return await media(req, env, url.pathname)
      if (req.method === 'GET' && url.pathname.startsWith('/api/progress/')) {
        return await getProgress(req, env, url.pathname.slice('/api/progress/'.length))
      }
      switch (`${req.method} ${url.pathname}`) {
        case 'GET /api/health':
          return json({ ok: true })
        case 'POST /api/auth/otp':
          return await sendOtp(req, env)
        case 'POST /api/auth/verify':
          return await verifyOtp(req, env)
        case 'GET /api/auth/google':
          return googleStart(req, env)
        case 'GET /api/auth/google/callback':
          return await googleCallback(req, env)
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
