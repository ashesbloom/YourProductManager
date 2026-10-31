export const KINDLE_URL = 'https://amzn.in/d/08pIvt3V'

export const BOOK = {
  title: 'Building AI Products That Work',
  subtitle: 'The practical operating system for founders, PMs and engineers',
}

// Sample pages for the "Look inside" flip-book, in reading order (01, 02, …), cut from Khushbu's spreads.
export const BOOK_PAGES: string[] = Object.entries(
  import.meta.glob<string>('../assets/book-pages/*.{jpg,jpeg,png,webp,avif}', { eager: true, import: 'default' }),
)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([, src]) => src)
