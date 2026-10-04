import { HttpError, json } from './http.ts'

export default {
  async fetch(req): Promise<Response> {
    const url = new URL(req.url)
    try {
      switch (`${req.method} ${url.pathname}`) {
        case 'GET /api/health':
          return json({ ok: true })
      }
      return json({ error: 'Not found' }, 404)
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status)
      console.error(JSON.stringify({ msg: 'unhandled', path: url.pathname, err: String(err), stack: (err as Error).stack }))
      return json({ error: 'Something went wrong' }, 500)
    }
  },
} satisfies ExportedHandler<Env>
