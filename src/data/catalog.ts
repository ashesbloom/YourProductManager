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
          L('ai-product-01', 'Introduction to AI Product Management', true, 1198),
          L('ai-product-02', 'AI & Machine Learning Fundamentals for PMs', false, 1096),
          L('ai-product-03', 'AI vs. Traditional Software Products', false, 1598),
          L('ai-product-04', 'The Central Role of Data in AI', false, 1344),
          L('ai-product-05', 'The AI/ML Project Lifecycle', false, 1344),
          L('ai-product-06', 'The Unique Role of the AI Product Manager', false, 1505),
          L('ai-product-07', 'Defining and Framing AI Problems', false, 1084),
          L('ai-product-08', 'Building Responsible & Ethical AI', false, 1161),
          L('ai-product-09', 'Evaluating AI Model Performance', false, 1521),
          L('ai-product-10', 'Roadmapping for AI Products', false, 1007),
          L('ai-product-11', 'The AI Minimum Viable Product (MVP)', false, 1106),
          L('ai-product-12', 'Human-in-the-Loop (HITL) Systems', false, 1215),
          L('ai-product-13', 'Measuring the Success of AI Products', false, 1464),
          L('ai-product-14', 'Explainable AI (XAI) for PMs', false, 1322),
          L('ai-product-15', 'Understanding and Mitigating AI Bias', false, 1227),
          L('ai-product-16', 'Prototyping and Experimentation Tools for AI', false, 1279),
          L('ai-product-17', 'Working with Data Scientists', false, 1312),
          L('ai-product-18', 'Working with ML Engineers (MLOps)', false, 1391),
          L('ai-product-19', 'AI Model Deployment Strategies', false, 1240),
          L('ai-product-20', 'AI Applications Across Industries', false, 1212),
          L('ai-product-21', 'Managing AI Project Risks', false, 1170),
          L('ai-product-22', 'Building User Trust in AI Systems', false, 977),
          L('ai-product-23', 'AI Team Collaboration Models', false, 1193),
          L('ai-product-24', 'Navigating AI Regulation & Compliance', false, 1189),
          L('ai-product-25', 'Data Privacy in the Age of AI', false, 1118),
          L('ai-product-26', 'Product Discovery for AI Opportunities', false, 768),
          L('ai-product-27', 'Why AI Products Fail', false, 767),
          L('ai-product-28', 'Scaling AI Products and Systems', false, 1265),
          L('ai-product-29', "The AI Product Manager's Toolkit", false, 936),
          L('ai-product-30', 'A Framework for Responsible AI', false, 907),
          L('ai-product-31', 'Common AI Use Cases for PMs', false, 954),
          L('ai-product-32', 'Designing and Running AI Experiments', false, 1077),
          L('ai-product-33', 'Understanding and Combating Model Drift', false, 777),
          L('ai-product-34', 'Human-AI Collaboration', false, 887),
          L('ai-product-35', 'The Strategy Behind Data Labeling', false, 920),
          L('ai-product-36', 'Understanding Edge AI', false, 722),
          L('ai-product-37', 'Common AI Roadmap Pitfalls', false, 846),
          L('ai-product-38', 'Ethical AI Case Studies: What PMs Can Learn', false, 989),
          L('ai-product-39', 'AI-Specific User Personas', false, 775),
          L('ai-product-40', 'Product Design for AI-Powered Features', false, 1013),
          L('ai-product-41', 'The Future of AI Product Management', false, 845),
          L('ai-product-42', 'Building Products with Generative AI', false, 1210),
          L('ai-product-43', "A PM's Guide to Building Trustworthy AI", false, 911),
          L('ai-product-44', 'Launching an AI Product', false, 1480),
          L('ai-product-45', 'Essential KPIs for AI Products', false, 828),
          L('ai-product-46', 'Structuring High-Performing AI Teams', false, 898),
          L('ai-product-47', 'Leveraging AI for Social Good', false, 897),
          L('ai-product-48', 'Cracking the AI Product Manager Interview', false, 1250),
          L('ai-product-49', "Top Challenges for Today's AI PMs", false, 804),
          L('ai-product-50', 'AI and the Future of Work', false, 597),
        ],
      },
    ],
  },
  foundations: {
    id: 'foundations',
    title: 'Product Management Foundations',
    modules: [
      {
        title: 'PM Basics',
        lectures: [
          L('foundations-01', 'Foundations of Strategic Product Management'),
          L('foundations-02', 'Market Intelligence & Discovery'),
          L('foundations-03', 'Strategic Vision & Goal Setting'),
          L('foundations-04', 'Problem Refinement & Validation'),
          L('foundations-05', 'Behavioral User Experience & Personas'),
          L('foundations-06', 'Prioritization & High-Stakes Decision Making'),
          L('foundations-07', 'The Lean MVP & Rapid Prototyping'),
          L('foundations-08', 'Requirements Engineering (PRDs & User Stories)'),
          L('foundations-09', 'Agile Excellence & Scrum'),
          L('foundations-10', 'Product Metrics & Data Analytics'),
          L('foundations-11', 'Design Thinking & Collaboration'),
          L('foundations-12', 'Go-To-Market (GTM) Strategy'),
          L('foundations-13', 'Stakeholder Influence & Communication'),
          L('foundations-14', 'Product Growth & Scaling'),
          L('foundations-15', 'The Future-Ready Product Manager & Career Accelerator'),
        ],
      },
    ],
  },
}

export const PRODUCTS: Record<string, Product> = {
  'ai-product': {
    id: 'ai-product',
    title: 'AI Product Management',
    pricePaise: 9_999 * 100,
    oldPricePaise: 25_000 * 100,
    priceLabel: 'Launch price',
    // The only product on sale. Foundations is not sold separately; it comes free with this.
    grants: ['ai-product', 'foundations'],
  },
}

/** What the AI Product Management purchase includes. Shown on the home course card and the courses page. */
// The programme printed on a certificate unless an admin issues one with its own.
export const CERTIFICATE_PROGRAMME = 'Product Management Training Program'

export const COURSE_INCLUDED: Array<{ strong?: string; text: string }> = [
  { strong: '3 AI product', text: 'case study assignments' },
  { strong: '2-hour free', text: 'mock interview session' },
  { text: 'Personal dashboard for each user' },
  { text: 'Resume review by a mentor' },
  { strong: '50% off', text: 'personalised sessions if you want' },
  { text: 'Certificate after course completion' },
  { text: 'First AI PM lecture free to preview' },
]

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
