export const CALENDLY_URL = 'https://calendly.com/khushbusharmabb'
export const PHONE = '+91 70182 26776' // Khushbu's WhatsApp
export const whatsappLink = (text: string) => `https://wa.me/${PHONE.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
export const WHATSAPP_URL = whatsappLink('Hi, I have a question about YPM')
// All four forward to Khushbu's inbox (Cloudflare Email Routing); each says what the message is about.
export const SUPPORT_EMAIL = 'support@yourproductmanager.in' // course access, payments, refunds, certificates
export const CONTACT_EMAIL = 'contact@yourproductmanager.in' // coaching, mock interviews, partnerships
export const HELLO_EMAIL = 'hello@yourproductmanager.in' // anything else
// Crisp → Settings → Website Settings → Setup instructions.
export const CRISP_WEBSITE_ID = '2a70f7b3-d740-45b7-83f2-dbf2fab4c6b6'

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
