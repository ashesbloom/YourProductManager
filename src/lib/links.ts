// TODO: replace with the live Calendly event and WhatsApp number.
export const CALENDLY_URL = 'https://calendly.com/REPLACE_ME/mock-interview'
export const WHATSAPP_URL =
  'https://wa.me/91XXXXXXXXXX?text=Hi%2C%20I%20have%20a%20question%20about%20YPM'
export const SUPPORT_EMAIL = 'support@yourpm.in'

/**
 * Same-site path to land on after login, else `fallback`. Resolving against a dummy origin catches
 * every trick (`//host`, `/\host`, `/<TAB>/host` — browsers strip tabs) instead of pattern-matching them.
 * Shared by the Worker (Google callback) and the login page.
 */
export function safeNext(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next || !next.startsWith('/')) return fallback
  try {
    const url = new URL(next, 'https://same.invalid')
    return url.origin === 'https://same.invalid' ? url.pathname + url.search + url.hash : fallback
  } catch {
    return fallback
  }
}
