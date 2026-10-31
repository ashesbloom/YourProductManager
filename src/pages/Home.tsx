import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ArrowUpRight, BadgeCheck, Brain, CheckCircle, Compass, Cpu, Download, Linkedin, Plus, Star,
  MessageCircle, TrendingUp, UserCheck,
} from 'lucide-react'
import { LockedCertificate } from '../components/CertificateCard'
import { Book3D } from '../components/Book3D'
import { KINDLE_URL } from '../data/book'
import { CourseOfferCard } from '../components/CourseOfferCard'
import { CALENDLY_URL, whatsappLink } from '../lib/links'
import { track } from '../lib/analytics'
import { PRODUCTS, formatINR } from '../data/catalog'

const PATHS = [
  {
    title: 'Self-paced course',
    meta: formatINR(PRODUCTS['ai-product'].pricePaise),
    body: 'AI Product Management, with the Foundations course included free.',
    cta: 'Explore the course',
    to: '/courses',
  },
  {
    title: '1:1 coaching',
    meta: 'Custom duration',
    body: 'Private sessions with Khushbu, shaped around your goals.',
    cta: 'Book a 1:1 call',
    href: CALENDLY_URL,
  },
  {
    title: 'Mock interviews',
    meta: 'Session-based',
    body: 'Practise PM interview loops and get detailed feedback.',
    cta: 'Book a mock interview',
    href: CALENDLY_URL,
  },
]

const PATH_COLUMNS = ['Self-Paced Course', '1:1 Coaching', 'Mock Interviews'] as const

const PATH_COMPARISON: Array<{ label: string; values: [string, string, string] }> = [
  {
    label: 'Format',
    values: [
      'Recorded, lecture-based learning',
      'Private, live strategy sessions',
      'Live 1:1 interview simulations',
    ],
  },
  {
    label: 'Interaction Level',
    values: ['Independent learning', 'Direct founder access', 'Real-time performance feedback'],
  },
  {
    label: 'Personalization',
    values: [
      'Structured curriculum',
      'Fully personalized engagement',
      'Aligned to your target role & domain',
    ],
  },
  {
    label: 'Focus Area',
    values: [
      'Product fundamentals & structured thinking',
      'Strategic clarity & decision-making depth',
      'Interview performance & answer structuring',
    ],
  },
  {
    label: 'Best For',
    values: [
      'Beginners & career transitioners',
      'Professionals seeking accelerated growth',
      'Candidates preparing for PM interviews',
    ],
  },
  { label: 'Duration', values: ['Self-paced', 'Custom engagement length', 'Session-based'] },
  {
    label: 'Feedback',
    values: ['Conceptual understanding', 'Direct strategic feedback', 'Detailed interview critique'],
  },
  {
    label: 'Outcome',
    values: [
      'Strong product foundation',
      'Elevated strategic judgment',
      'Improved confidence & structured responses',
    ],
  },
]

const WHY = [
  { icon: UserCheck, title: 'Interview ready', body: 'Mock PM interviews and a review of your own project.' },
  { icon: Star, title: 'LinkedIn and resume', body: 'A free profile and resume review for today’s hiring.' },
  { icon: Brain, title: 'Strategic judgment', body: 'Make sound calls under ambiguity, not checklist answers.' },
  { icon: Cpu, title: 'Systems thinking', body: 'Connect product, market and business model into one strategy.' },
  { icon: TrendingUp, title: 'Stakeholder mastery', body: 'Align teams and leadership behind your decisions.' },
  { icon: Compass, title: 'Career strategy call', body: 'A free 15-minute audit of your blind spots and next step.' },
]

// Either one earns the certificate; the list renders an OR between them.
const CERTIFICATE_CRITERIA = [
  'Complete all lectures in the Product Management Programme',
  'Successfully complete the 1:1 Coaching Programme',
]

const BOOK_HIGHLIGHTS = [
  ['Practical Product Thinking', 'From ideas and decisions to building useful AI products.'],
  ['Practical Frameworks', 'Practical ways to approach AI product decisions.'],
  ['For Founders, PMs & Engineers', 'Designed for people building and managing AI products.'],
] as const

const faqs = [
  {
    q: 'Do I need prior experience or a technical background to enroll?',
    a: 'No. Our courses are designed for beginners, students, freshers, working professionals, and career switchers looking to enter or grow in Product Management. If you have a technical background, that’s an added advantage, especially in AI Product Management, but it is not mandatory. You don’t need an IIT/IIM degree or prior Product Management experience to get started. A willingness to learn and practise is what matters most.',
  },
  {
    q: 'Are the courses self-paced, and can I learn remotely?',
    a: 'Yes! You can access the course lectures online and learn at your own pace, making them suitable for students and working professionals. You can study from anywhere with an internet connection and revisit the learning materials according to the access terms of your purchase.',
  },
  {
    q: 'Will I receive a certificate after completing the course or 1:1 sessions?',
    a: 'Yes. Learners who complete the applicable requirements will receive a YPM certificate. This includes learners enrolled in our courses as well as those participating in our 1:1 sessions, subject to the relevant programme completion requirements. The certificate recognizes completion of the YPM learning programme and is not a university degree.',
  },
  {
    q: 'Does YPM provide interview preparation and career support?',
    a: 'Yes! Depending on the programme you choose, support may include mock interviews, resume and LinkedIn profile reviews, portfolio feedback, practical case studies, and personalized 1:1 sessions to help you prepare for Product Management opportunities.',
  },
  {
    q: 'How is 1:1 coaching different from the course?',
    a: 'The self-paced course provides structured foundational learning to help you understand Product Management concepts at your own pace. 1:1 coaching is more intensive and personalized, focusing on your specific challenges, goals, and growth areas. It involves direct feedback, strategic conversations, and deeper refinement tailored to your individual needs.',
  },
]

// Learner reviews as YPM posted them on LinkedIn; each card opens its post. `pull` is a sentence from `quote`.
const TESTIMONIALS = [
  {
    pull: 'Khushbu Sharma made the concepts very approachable.',
    quote:
      'Coming from a non-technical background, I initially felt that product management might be difficult for me. However, Khushbu Sharma made the concepts very approachable. Her teaching style focuses on understanding the fundamentals and building confidence step by step, which helped me see how my background could also fit into product roles.',
    name: 'Anshika',
    context: 'Fresher, non-tech background',
    href: 'https://lnkd.in/p/gf3dgMD3',
  },
  {
    pull: 'Her session helped me connect the dots between theory and real-world product thinking.',
    quote:
      'I had gone through many resources but still felt confused about how product management works in practice. Her session helped me connect the dots between theory and real-world product thinking. The clarity I gained made a big difference in how I approach product problems now.',
    name: 'YPM learner',
    context: '1:1 session',
    href: 'https://lnkd.in/p/gMAeDafV',
  },
]

const h2 = "font-['Montserrat'] text-3xl md:text-4xl font-bold tracking-tight text-white"

const field =
  'block h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/35 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'
const fieldLabel = 'mb-2 block text-sm font-semibold text-white/75'

// No backend: the enquiry opens WhatsApp with the message written, so it lands in Khushbu's chats.
function LeadForm() {
  return (
    <form
      className="rounded-2xl border border-white/10 bg-[#0b0b12] p-6 sm:p-8 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-1000"
      onSubmit={(e) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        const text = `Hi Khushbu, I'm ${f.get('name')}, currently ${f.get('role')}. I'd like help with: ${f.get('goal')}`
        track('whatsapp_click', { location: 'hero_form' })
        window.open(whatsappLink(text), '_blank', 'noopener')
      }}
    >
      <h2 className="font-['Montserrat'] text-2xl font-bold">Start your PM journey</h2>
      <p className="mt-2 leading-relaxed text-white/55">Tell Khushbu where you are and get personal guidance.</p>

      <div className="mt-7 space-y-5">
        <div>
          <label htmlFor="lead-name" className={fieldLabel}>Name</label>
          <input id="lead-name" name="name" className={field} placeholder="Your name" autoComplete="name" required maxLength={80} />
        </div>
        <div>
          <label htmlFor="lead-role" className={fieldLabel}>Current role</label>
          <input id="lead-role" name="role" className={field} placeholder="e.g. Software engineer, final-year student" autoComplete="organization-title" required maxLength={80} />
        </div>
        <div>
          <label htmlFor="lead-goal" className={fieldLabel}>I want help with</label>
          <input id="lead-goal" name="goal" className={field} placeholder="e.g. Switching into an AI PM role" required maxLength={200} />
        </div>
      </div>

      <button type="submit" className="btn-primary mt-7 h-12 w-full">
        <MessageCircle size={18} /> Continue on WhatsApp
      </button>
      <p className="mt-3 text-center text-xs text-white/40">Opens WhatsApp with your message ready to send.</p>
    </form>
  )
}

export default function Home() {
  const [certificateUnlocked, setCertificateUnlocked] = useState(false)
  const certificateRef = useRef<HTMLDivElement>(null)

  // The certificate scrolls in locked and unlocks once about 75% of it is on screen; scrolling back
  // above it locks it again. '65%' because the card is measured mid fade-in, 24px below its rest spot. Everything it drives (blur lift, criteria ticks, ID fade) is a CSS
  // transition on this flag, so ScrollTrigger only has to supply the moment.
  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: certificateRef.current,
      start: '65% bottom',
      onEnter: () => setCertificateUnlocked(true),
      onLeaveBack: () => setCertificateUnlocked(false),
    })
    return () => trigger.kill()
  }, [])

  return (
    <div className="overflow-x-hidden bg-black text-white">
      {/* ═══════════════ HERO ═══════════════ */}
      {/* Fills the first screen: copy on the left, the enquiry form on the right. The nav is fixed,
          so the top padding is its height. */}
      <section className="relative flex flex-col pt-[calc(var(--header-h)+2.5rem)] pb-16 lg:min-h-svh lg:pt-[var(--header-h)] lg:pb-0">
        <div className="container-wide grid flex-1 items-center gap-x-16 gap-y-12 lg:grid-cols-[1fr_minmax(0,26rem)]">
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700">
            <h1 className="font-['Montserrat'] text-[clamp(2.6rem,6vw,6.25rem)] font-extrabold leading-[1] tracking-[-0.025em]">
              Think like a Product Manager.
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-white/65 lg:text-xl">
              Courses, 1:1 coaching and mock interviews with Khushbu Sharma.
            </p>
            <div className="mt-10 flex flex-col gap-x-3 gap-y-3 sm:flex-row">
              <a href={CALENDLY_URL} target="_blank" rel="noreferrer" className="btn-primary">
                Book a free call
              </a>
              <Link to="/courses" className="btn-secondary">
                Explore courses
              </Link>
            </div>
            <p className="mt-8 text-sm text-white/55">
              <span className="font-semibold text-[#FBBF24]">200+</span> professionals coached
            </p>
          </div>

          <LeadForm />
        </div>
      </section>

      {/* ═══════════════ COURSES ═══════════════ */}
      <section id="courses" className="container scroll-mt-[var(--header-h)] pt-16 md:pt-24">
        <h2 data-reveal className={h2}>Courses</h2>
        <div data-reveal className="mt-10">
          <CourseOfferCard />
        </div>
      </section>

      {/* ═══════════════ THREE WAYS TO LEARN ═══════════════ */}
      <section className="container py-16 md:py-24">
        <h2 data-reveal className={h2}>Three ways to learn</h2>
        {/* Same thirds and hairlines as Why YPM below, so the columns line up. */}
        <div className="mt-10 grid border-l border-t border-white/10 md:grid-cols-3">
          {PATHS.map((p) => {
            const cta = (
              <span className="inline-flex items-center gap-x-1.5 font-semibold text-primary transition-colors group-hover:text-white">
                {p.cta}
                {p.href && <ArrowUpRight size={16} />}
              </span>
            )
            const cls =
              'group flex flex-col border-b border-r border-white/10 p-5 transition-colors hover:bg-white/[0.03] sm:p-7 md:p-8'
            const body = (
              <>
                <span className="text-sm text-white/45">{p.meta}</span>
                <h3 className="mt-2 font-['Montserrat'] text-xl font-bold">{p.title}</h3>
                <p className="mt-3 flex-1 leading-relaxed text-white/60">{p.body}</p>
                <div className="mt-8">{cta}</div>
              </>
            )
            return p.href ? (
              <a data-reveal key={p.title} href={p.href} target="_blank" rel="noreferrer" className={cls}>
                {body}
              </a>
            ) : (
              <Link data-reveal key={p.title} to={p.to!} className={cls}>
                {body}
              </Link>
            )
          })}
        </div>

        <details data-reveal className="group mt-8">
          <summary className="inline-flex cursor-pointer list-none items-center gap-x-2 text-sm font-semibold text-white/65 transition-colors hover:text-white [&::-webkit-details-marker]:hidden">
            <Plus size={16} className="text-primary transition-transform group-open:rotate-45" />
            Compare in detail
          </summary>

          {/* Four columns cannot fit a phone, so the table scrolls with its label column pinned. */}
          <div className="mt-6 overflow-x-auto border border-white/10">
            <table className="w-full min-w-[46rem] border-collapse text-left">
              <thead>
                <tr className="bg-white/[0.03]">
                  <th scope="col" className="sticky left-0 z-10 bg-[#0b0b10] px-6 py-5 text-sm font-semibold text-white/45">
                    Feature
                  </th>
                  {PATH_COLUMNS.map((path) => (
                    <th key={path} scope="col" className="px-6 py-5 font-['Montserrat'] text-sm font-bold text-white">
                      {path}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PATH_COMPARISON.map((row) => (
                  <tr key={row.label} className="border-t border-white/5">
                    <th scope="row" className="sticky left-0 z-10 bg-[#07070c] px-6 py-5 align-top text-sm font-semibold text-white/55">
                      {row.label}
                    </th>
                    {row.values.map((value, i) => (
                      <td key={i} className="px-6 py-5 align-top text-sm leading-relaxed text-white/65">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      {/* ═══════════════ WHY YPM ═══════════════ */}
      <section className="container pb-16 md:pb-24">
        <h2 data-reveal className={h2}>Why YPM</h2>
        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {WHY.map(({ icon: Icon, title, body }) => (
            <li
              data-reveal
              key={title}
              className="group relative overflow-hidden rounded-2xl border border-purple-400/30 bg-linear-to-br from-purple-950/70 via-[#140a26] to-black p-6 shadow-lg shadow-purple-950/40 transition-colors hover:border-purple-400/60 sm:p-7"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand/30 blur-3xl transition-opacity group-hover:opacity-100 md:opacity-70" />
              <span className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-purple-400/30 bg-purple-500/15">
                <Icon size={21} className="text-purple-200" />
              </span>
              <h3 className="relative mt-5 font-['Montserrat'] text-lg font-bold text-white">{title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-white/70">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ═══════════════ THE BOOK ═══════════════ */}
      {/* Khushbu's portfolio book card, in the site's fonts. The 3D book opens into the sample pages. */}
      <section id="book" className="container scroll-mt-[var(--header-h)] pb-16 md:pb-24">
        <div className="rounded-3xl border border-purple-400/30 bg-linear-to-br from-black via-purple-950/40 to-black p-6 shadow-2xl md:p-10">
          <div className="grid grid-cols-1 items-center gap-x-14 gap-y-12 lg:grid-cols-2">
            <Book3D className="py-6" />
            <div data-reveal>
              <h2 className="mb-4 font-['Montserrat'] text-4xl font-bold leading-tight text-white lg:text-5xl">
                Building AI Products That <span className="text-purple-300">Work</span>
              </h2>
              <p className="mb-6 text-lg text-white/65">The Practical Operating System for Founders, PMs, and Engineers</p>
              <p className="mb-7 leading-relaxed text-white/60">
                A practical guide to building AI products that work in the real world. The book brings together product
                thinking, practical frameworks, real-world considerations, and lessons for founders, product managers, and
                engineers building AI products.
              </p>
              <ul className="mb-8 space-y-4">
                {BOOK_HIGHLIGHTS.map(([title, body]) => (
                  <li key={title} className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-purple-400/30 bg-purple-500/15 text-purple-300">
                      ✦
                    </span>
                    <div>
                      <h3 className="font-semibold text-white">{title}</h3>
                      <p className="text-sm text-white/55">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <a href={KINDLE_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  Read on Kindle <ArrowUpRight size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ SUCCESS STORIES ═══════════════ */}
      <section className="container pt-16 pb-16 md:pt-24 md:pb-24">
        <h2 data-reveal className={h2}>Success stories</h2>
        <p data-reveal className="mt-3 max-w-2xl text-white/60">In their own words: learners on what changed after working with YPM.</p>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {TESTIMONIALS.map((t) => {
            const [before, after] = t.quote.split(t.pull)
            return (
              <figure
                data-reveal
                key={t.href}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-purple-400/25 bg-linear-to-br from-purple-950/60 via-[#0e0818] to-black p-7 shadow-[0_30px_80px_-45px_rgba(124,58,237,0.7)] transition-[border-color,translate] duration-300 hover:-translate-y-1 hover:border-purple-400/55 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-primary/70 md:p-9"
              >
                <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/25 blur-3xl transition-opacity duration-300 md:opacity-60 md:group-hover:opacity-100" />
                <span aria-hidden="true" className="relative h-10 font-['Playfair_Display'] text-7xl leading-none text-purple-400/70">
                  “
                </span>
                <blockquote className="relative mt-4 flex-1">
                  <p className="font-['Montserrat'] text-xl font-bold leading-snug text-white md:text-2xl">{t.pull}</p>
                  <p className="mt-5 leading-relaxed text-white/55">
                    “{before}
                    <span className="text-white/85">{t.pull}</span>
                    {after}”
                  </p>
                </blockquote>
                <figcaption className="relative mt-8 flex items-center gap-4 border-t border-white/10 pt-6">
                  <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-purple-400/30 bg-purple-500/15 font-['Montserrat'] font-bold text-purple-200">
                    {t.name.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-white">{t.name}</span>
                    <span className="block text-sm text-[#FBBF24]/85">{t.context}</span>
                  </span>
                  {/* The whole card is the link (stretched ::after); this label is its accessible name. */}
                  <a
                    href={t.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Read ${t.name}’s review on LinkedIn`}
                    className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-white/50 transition-colors after:absolute after:inset-[-100vmax] after:content-[''] group-hover:text-white focus-visible:outline-none focus-visible:text-white"
                  >
                    <Linkedin size={15} />
                    <span className="hidden sm:inline">LinkedIn</span>
                    <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </a>
                </figcaption>
              </figure>
            )
          })}
        </div>
      </section>

      {/* ═══════════════ CERTIFICATE ═══════════════ */}
      <section className="border-t border-white/10 py-16 md:py-24">
        <div className="container grid items-center gap-x-16 gap-y-14 lg:grid-cols-2">
          <div data-reveal>
            <h2 className={`${h2} mb-4`}>Industry-aligned completion certificate</h2>
            <p className="mb-10 text-white/60">
              Earned by completing either of the two programmes below.
            </p>

            <p className="mb-5 text-sm font-semibold text-white/45">What unlocks it</p>
            <ul className="space-y-3.5">
              {CERTIFICATE_CRITERIA.map((item, i) => (
                <li key={item}>
                  {i > 0 && (
                    <span className="mb-3.5 ml-8 inline-block rounded-full border border-[#FBBF24]/40 px-3 py-0.5 text-xs font-black tracking-widest text-[#FBBF24]">
                      OR
                    </span>
                  )}
                  <span className="flex items-center gap-x-3">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                        certificateUnlocked ? 'bg-brand text-white' : 'border border-white/20 text-transparent'
                      }`}
                      style={{ transitionDelay: certificateUnlocked ? `${i * 90}ms` : '0ms' }}
                    >
                      <CheckCircle size={13} strokeWidth={3} />
                    </span>
                    <span
                      className={`text-sm transition-colors duration-300 ${
                        certificateUnlocked ? 'text-white' : 'text-white/45'
                      }`}
                      style={{ transitionDelay: certificateUnlocked ? `${i * 90}ms` : '0ms' }}
                    >
                      {item}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            {/* Credential details only exist once the certificate is issued. */}
            <div
              className={`mt-10 transition-all duration-500 ${
                certificateUnlocked ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
              }`}
              aria-hidden={!certificateUnlocked}
            >
              <div className="flex items-baseline gap-x-3">
                <span className="text-sm font-semibold text-white/45">Certificate ID</span>
                <span className="font-['Montserrat'] text-sm font-black tracking-wider text-[#FBBF24]">
                  YPM0000000
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-3">
                <Link
                  to="/verify?id=YPM0000000"
                  tabIndex={certificateUnlocked ? 0 : -1}
                  className="inline-flex items-center gap-x-2 rounded-full border border-primary/40 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-primary hover:bg-primary/10"
                >
                  <BadgeCheck size={16} />
                  Verify this certificate
                </Link>

                {[
                  { label: 'Add to LinkedIn', icon: Linkedin },
                  { label: 'Download PDF', icon: Download },
                ].map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    type="button"
                    disabled
                    title="Available once your certificate is issued"
                    className="inline-flex cursor-not-allowed items-center gap-x-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/35"
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div ref={certificateRef} data-reveal>
            <LockedCertificate unlocked={certificateUnlocked} />
          </div>
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      {/* Heading in the first third; questions start on the same line as the second-column text above. */}
      <section className="container grid py-16 md:grid-cols-3 md:py-24">
        <h2 data-reveal className={h2}>Frequently asked questions</h2>
        <div className="mt-10 border-t border-white/10 md:col-span-2 md:mt-0 md:ml-8">
          {faqs.map((faq) => (
            <details key={faq.q} className="group border-b border-white/10">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-x-6 py-5 font-semibold text-white/90 transition-colors hover:text-white [&::-webkit-details-marker]:hidden">
                {faq.q}
                <Plus size={18} className="shrink-0 text-primary transition-transform group-open:rotate-45" />
              </summary>
              <p className="pb-6 pr-10 leading-relaxed text-white/60">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="container pb-28 pt-4">
        <div data-reveal className="border-t border-white/10 pt-16">
          <h2 className={h2}>Start with a free 15-minute call</h2>
          <div className="mt-8 flex flex-col gap-x-3 gap-y-3 sm:flex-row">
            <a href={CALENDLY_URL} target="_blank" rel="noreferrer" className="btn-primary">
              Book a free call
            </a>
            <Link to="/courses" className="btn-secondary">
              Explore courses
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
