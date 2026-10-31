import { CALENDLY_URL } from './links'

// Google Analytics 4 → Admin → Data streams → Web → Measurement ID. Empty = analytics off.
export const GA_MEASUREMENT_ID = ''

type Gtag = (...args: unknown[]) => void
const gtag: Gtag = (...args) => (window as unknown as { gtag?: Gtag }).gtag?.(...args)

export const track = (event: string, params?: Record<string, unknown>) => gtag('event', event, params)

/** The SPA never reloads, so App sends each route change as a page view. */
export const pageView = (path: string) => track('page_view', { page_path: path, page_location: location.href, page_title: document.title })

export function initAnalytics() {
  if (!GA_MEASUREMENT_ID) return
  const w = window as unknown as { dataLayer: unknown[]; gtag: Gtag }
  w.dataLayer = w.dataLayer || []
  // gtag.js only reads real `arguments` objects off the dataLayer, not arrays.
  w.gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments)
  }
  w.gtag('js', new Date())
  w.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false })
  document.head.append(Object.assign(document.createElement('script'), { src: `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`, async: true }))

  // Every WhatsApp and Calendly link on the site, wherever it is, without tagging each one.
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest?.('a[href]') as HTMLAnchorElement | null
    if (!a) return
    if (a.href.startsWith('https://wa.me/')) track('whatsapp_click', { location: location.pathname })
    else if (a.href.startsWith(CALENDLY_URL.split('/').slice(0, 3).join('/'))) track('book_call_click', { location: location.pathname })
  })
}
