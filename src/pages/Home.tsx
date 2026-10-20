import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ArrowUpRight, BadgeCheck, Brain, CheckCircle, Compass, Cpu, Download, Linkedin, Plus, Star,
  MessageCircle, TrendingUp, UserCheck,
} from 'lucide-react'
import { LockedCertificate } from '../components/CertificateCard'
import { ReelsSection } from '../components/sections/ReelsSection'
import { Book3D } from '../components/Book3D'
import { BOOK, KINDLE_URL } from '../data/book'
import { CALENDLY_URL, whatsappLink } from '../lib/links'
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

const CERTIFICATE_CRITERIA = [
  'Complete 50 lectures',
  'Pass evaluations',
  'Mock interviews',
  'Case study',
]

const faqs = [
  {
    q: 'What makes YPM different from generic bootcamps?',
    a: 'YPM is founder-led and focused on long-term thinking rather than shortcuts. Unlike bootcamps that emphasize templates or rapid outcomes, YPM prioritizes judgment, clarity, and consulting-grade problem solving. There are no exaggerated promises or placement guarantees. The emphasis is on helping you understand why decisions work — not just what to say in interviews.'
  },
  {
    q: 'Who is this program designed for?',
    a: 'YPM is designed for professionals who want to build strong product judgment and structured thinking. Whether you are transitioning from engineering, consulting, operations, or starting fresh in product roles, the focus is on developing clarity in decision-making — not memorizing frameworks. This program is ideal for individuals who want to think strategically rather than operate tactically.'
  },
  {
    q: 'I’m not an engineer. Do I need technical experience?',
    a: 'No technical background is required. You do not need coding knowledge or prior product experience to begin. The programs are designed to build product fundamentals from the ground up, focusing on structured thinking, business understanding, and communication — skills that are transferable across domains.'
  },
  {
    q: 'What is the learning format and time commitment?',
    a: 'All courses are lecture-based and self-paced, allowing you to learn according to your schedule. The time commitment depends on your depth of engagement, but most learners allocate a few focused hours per week to build consistent progress. Private coaching and mock interviews are scheduled based on mutual availability.'
  },
  {
    q: 'Is this suitable for beginners?',
    a: 'Yes. The programs are structured to start with foundational product thinking before moving toward more advanced strategic concepts. Beginners can build clarity step by step, while experienced professionals can refine and deepen their thinking.'
  },
  {
    q: 'How is 1:1 coaching different from the course?',
    a: 'The self-paced course provides structured foundational learning. 1:1 coaching is more intensive and focused on your specific challenges, goals, and growth areas. It involves direct feedback, strategic conversations, and deeper refinement.'
  },
  {
    q: 'What happens after completing the course?',
    a: 'The goal of YPM is not short-term motivation but long-term capability. After completing the program, you should have stronger clarity in how you analyze problems, prioritize decisions, and communicate product strategy. Many learners continue refining their skills through mock interviews, coaching, or independent application in their roles.'
  },
  {
    q: 'How do I pay?',
    a: 'Prices are in ₹ and include GST. Pay securely with UPI, cards or netbanking via Razorpay.'
  },
]

const h2 = "font-['Montserrat'] text-3xl md:text-4xl font-bold tracking-tight text-white"

const LEAD_GOALS = ['Moving into product management', 'Growing as a PM', 'Moving into AI product management', 'Preparing for PM interviews']
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
        const text = `Hi Khushbu, I'm ${f.get('name')}, currently ${f.get('role')}. I'd like guidance on: ${f.get('goal')}.`
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
          <select id="lead-goal" name="goal" className={`${field} [&>option]:bg-[#07070c]`} defaultValue={LEAD_GOALS[0]}>
            {LEAD_GOALS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
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
              Think like a product manager.
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
        <ul className="mt-10 grid grid-cols-2 border-l border-t border-white/10 md:grid-cols-3">
          {WHY.map(({ icon: Icon, title, body }) => (
            <li data-reveal key={title} className="border-b border-r border-white/10 p-5 sm:p-7 md:p-8">
              <Icon size={22} className="text-primary" />
              <h3 className="mt-5 font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ═══════════════ THE BOOK ═══════════════ */}
      <section id="book" className="scroll-mt-[var(--header-h)] border-y border-white/10 bg-[#07070c] py-16 md:py-24">
        <div className="container grid items-center gap-x-16 gap-y-14 lg:grid-cols-[5fr_7fr]">
          <div data-reveal>
            <h2 className={`${h2} text-balance`}>{BOOK.title}</h2>
            <p className="mt-5 max-w-md leading-relaxed text-white/60">
              Shipping AI that holds up in production. For founders, product managers and engineers.
            </p>
            <p className="mt-6 text-white/55">
              By{' '}
              <Link to="/about" className="font-semibold text-white underline-offset-4 hover:underline">
                Khushbu Sharma
              </Link>
            </p>
            <a href={KINDLE_URL} target="_blank" rel="noreferrer" className="btn-primary mt-10">
              Read on Kindle
            </a>
          </div>
          <Book3D />
        </div>
      </section>

      {/* ═══════════════ SUCCESS STORIES ═══════════════ */}
      <div className="pt-16 md:pt-24">
        <ReelsSection />
      </div>

      {/* ═══════════════ CERTIFICATE ═══════════════ */}
      <section className="border-t border-white/10 py-16 md:py-24">
        <div className="container grid items-center gap-x-16 gap-y-14 lg:grid-cols-2">
          <div data-reveal>
            <h2 className={`${h2} mb-4`}>Industry-aligned completion certificate</h2>
            <p className="mb-10 text-white/60">
              Issued after 100% course completion, including all lectures, evaluations,
              mock interviews, and your final product case study.
            </p>

            <p className="mb-5 text-sm font-semibold text-white/45">What unlocks it</p>
            <ul className="space-y-3.5">
              {CERTIFICATE_CRITERIA.map((item, i) => (
                <li key={item} className="flex items-center gap-x-3">
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
