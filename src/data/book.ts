export const KINDLE_URL = 'https://www.amazon.in/dp/B0HD2NGVQK'

export const BOOK = {
  title: 'Building AI Products That Work',
  subtitle: 'The practical operating system for founders, PMs and engineers',
}

export type BookPage = { heading?: string; body: string[]; quote?: boolean }

// Sample pages, in reading order. Currently built from the back-cover copy; swap in real pages
// from the manuscript here. A closing "keep reading on Kindle" page is added after the last one.
export const BOOK_PAGES: BookPage[] = [
  {
    quote: true,
    body: [
      'You don’t build reliable AI by chasing accuracy.',
      'You build it by designing for failure.',
    ],
  },
  {
    heading: 'Who it is for',
    body: [
      'Whether you are a founder validating your first AI use case, a product manager writing your first AI feature spec, or an engineer trying to understand why the model keeps getting it wrong in production — this book gives you the framework, the tools, and the Monday Morning Checklist to apply it tomorrow.',
    ],
  },
  {
    heading: 'What makes this different',
    body: [
      'Unlike most AI books focused on theory, this book focuses on real product decisions — what to build, what to avoid, and how to make AI useful in practice.',
    ],
  },
  {
    heading: 'About the author',
    body: [
      'Khushbu Sharma has worked across startups and digital products, focusing on building practical, scalable systems.',
      'Her work centers on bridging the gap between AI capability and real-world product execution, helping teams turn AI ideas into working products.',
    ],
  },
]
