// Pure helpers (Web Crypto only): used by Worker routes and runnable under `node --test`.

const enc = new TextEncoder()
const toHex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')

export async function sha256Hex(text: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', enc.encode(text)))
}

/** Constant-time check of a hex HMAC-SHA256 signature (Razorpay payment and webhook signatures). */
export async function hmacVerify(secret: string, message: string, sigHex: string): Promise<boolean> {
  if (!/^[0-9a-f]{64}$/.test(sigHex)) return false
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
  const sig = new Uint8Array(32)
  for (let i = 0; i < 32; i++) sig[i] = parseInt(sigHex.slice(i * 2, i * 2 + 2), 16)
  return crypto.subtle.verify('HMAC', key, sig, enc.encode(message))
}

export function randomToken(bytes = 32): string {
  const b = crypto.getRandomValues(new Uint8Array(bytes))
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export const randomCode = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0')

/** Same-site path to land on after login. Blocks `//host` and `/\host` open redirects. */
export const safeNext = (next: string | null | undefined, fallback = '/dashboard') =>
  next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : fallback

export const isEmail = (s: string) => s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

// Directory and file names are [a-z0-9_-] only, so `..` can never reach R2.
const MEDIA_RE = /^\/media\/([a-z0-9-]+)\/((?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.(m3u8|ts|m4s|mp4|jpg|vtt))$/

export function mediaKey(pathname: string): { lectureId: string; key: string; ext: string } | null {
  const m = MEDIA_RE.exec(pathname)
  return m ? { lectureId: m[1], key: `${m[1]}/${m[2]}`, ext: m[3] } : null
}

export const CONTENT_TYPES: Record<string, string> = {
  m3u8: 'application/vnd.apple.mpegurl',
  ts: 'video/mp2t',
  m4s: 'video/iso.segment',
  mp4: 'video/mp4',
  jpg: 'image/jpeg',
  vtt: 'text/vtt',
}
