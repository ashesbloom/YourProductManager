export const KINDLE_URL = 'https://amzn.in/d/08pIvt3V'

export const BOOK = {
  title: 'Building AI Products That Work',
  subtitle: 'The practical operating system for founders, PMs and engineers',
}

// TODO(book pages): Khushbu's sample pages (sent on WhatsApp) aren't in the repo yet. Drop the page
// images into src/assets/book-pages/, named in reading order (01.jpg, 02.jpg, …), and the "Look inside"
// flip-book shows them. Until then it shows only the title page and a "keep reading on Kindle" page.
export const BOOK_PAGES: string[] = Object.entries(
  import.meta.glob<string>('../assets/book-pages/*.{jpg,jpeg,png,webp,avif}', { eager: true, import: 'default' }),
)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([, src]) => src)
