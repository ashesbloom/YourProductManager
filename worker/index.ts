import { googleCallback, googleStart, logout, me, sendOtp, verifyOtp } from './auth.ts'
import { HttpError, json } from './http.ts'

export default {
  async fetch(req, env): Promise<Response> {
    const url = new URL(req.url)
    try {
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
      }
      return json({ error: 'Not found' }, 404)
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status)
      console.error(JSON.stringify({ msg: 'unhandled', path: url.pathname, err: String(err), stack: (err as Error).stack }))
      return json({ error: 'Something went wrong' }, 500)
    }
  },
} satisfies ExportedHandler<Env>
