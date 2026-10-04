// What YPM sells. Imported by the SPA *and* the Worker, so this file must stay import-free.
// The Worker prices every order from here; amounts sent by the browser are never trusted.

export type Lecture = { id: string; title: string; free: boolean; durationS: number }
export type Module = { title: string; lectures: Lecture[] }
export type Course = { id: string; title: string; modules: Module[] }
export type Product = {
  id: string
  title: string
  pricePaise: number // final price, GST-inclusive
  oldPricePaise: number
  priceLabel: string
  grants: string[] // course ids unlocked by buying this
}

/** % of a lecture's 10-second buckets that must actually be played to count it complete. */
export const COMPLETE_PCT = 85

// durationS 0 = video not uploaded yet: listed on the course page, player shows "coming soon".
// scripts/encode.sh prints a ready-to-paste L(...) line with the real duration.
// Lecture ids are permanent (R2 keys and progress rows use them): never renumber after upload.
const L = (id: string, title: string, free = false, durationS = 0): Lecture => ({ id, title, free, durationS })

export const COURSES: Record<string, Course> = {
  'ai-product': {
    id: 'ai-product',
    title: 'AI Product Management',
    modules: [
      {
        title: 'AI Product Management',
        lectures: [
          L('ai-product-01', 'Introduction to AI Product Management', true),
          L('ai-product-02', 'What is an AI Product?', true),
          L('ai-product-03', 'The AI Product Lifecycle', true),
          L('ai-product-04', 'Understanding Machine Learning Basics'),
          L('ai-product-05', 'AI Product Strategy Framework'),
          L('ai-product-06', 'Identifying AI Opportunities'),
          L('ai-product-07', 'Building AI Roadmaps'),
          L('ai-product-08', 'Working with Data Teams'),
          L('ai-product-09', 'AI Ethics and Responsibility'),
          L('ai-product-10', 'AI Product Metrics'),
        ],
      },
    ],
  },
  foundations: {
    id: 'foundations',
    title: 'Product Management (Foundations)',
    modules: [
      {
        title: 'Product Management Foundations',
        lectures: [
          L("foundations-01", "What is Product Management?", true, 120),
          L('foundations-02', 'Core PM Responsibilities', true),
          L('foundations-03', 'Problem vs Solution Thinking', true),
          L("foundations-04", "User Research Fundamentals", false, 120),
          L('foundations-05', 'Prioritization Basics'),
          L('foundations-06', 'Writing Clear PRDs'),
          L('foundations-07', 'Stakeholder Communication'),
        ],
      },
    ],
  },
}

export const PRODUCTS: Record<string, Product> = {
  'ai-product': {
    id: 'ai-product',
    title: 'AI Product Management',
    pricePaise: 11_999 * 100,
    oldPricePaise: 29_999 * 100,
    priceLabel: 'Launch price',
    // The AI programme includes the Foundations lectures free.
    grants: ['ai-product', 'foundations'],
  },
  foundations: {
    id: 'foundations',
    title: 'Product Management (Foundations)',
    pricePaise: 2_999 * 100,
    oldPricePaise: 6_999 * 100,
    priceLabel: 'Introductory price',
    grants: ['foundations'],
  },
}

export const LECTURES: Record<string, Lecture & { courseId: string }> = Object.fromEntries(
  Object.values(COURSES).flatMap((c) =>
    c.modules.flatMap((m) => m.lectures.map((l) => [l.id, { ...l, courseId: c.id }] as const)),
  ),
)

/** Map lookup for untrusted keys: a plain `PRODUCTS['__proto__']` would be truthy. */
export function lookup<T>(map: Record<string, T>, key: unknown): T | undefined {
  return typeof key === 'string' && Object.hasOwn(map, key) ? map[key] : undefined
}

export const courseLectures = (courseId: string): Lecture[] =>
  lookup(COURSES, courseId)?.modules.flatMap((m) => m.lectures) ?? []

export const formatINR = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`
