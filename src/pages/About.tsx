import { Link } from 'react-router-dom'
import {
  ArrowRight, BadgeCheck, BookOpen, Compass, Layers, MessagesSquare, PlayCircle,
  Scale, Sparkles, Target, Timer, TrendingUp, UserRound, Users,
} from 'lucide-react'

const STANDS_FOR = [
  { icon: Compass, text: 'Practical product thinking over theory-heavy explanations' },
  { icon: Layers, text: 'Consulting-grade structured problem solving' },
  { icon: UserRound, text: 'Founder-led learning shaped by real experience' },
  { icon: Sparkles, text: 'Clear instruction without unnecessary complexity' },
  { icon: BadgeCheck, text: 'Honest education — no inflated claims or unrealistic guarantees' },
]

const CAPABILITIES = [
  { icon: Scale, text: 'Strategic judgment' },
  { icon: Target, text: 'Structured problem-solving' },
  { icon: MessagesSquare, text: 'Stakeholder communication' },
  { icon: TrendingUp, text: 'Business-model awareness' },
  { icon: Compass, text: 'Decision-making under ambiguity' },
]

const LEARNING = [
  { icon: BookOpen, text: 'Lecture-based' },
  { icon: PlayCircle, text: 'Recorded and self-paced' },
  { icon: Users, text: 'Structured for independent learners' },
  { icon: Timer, text: 'Focused on long-term capability building' },
]

const HIGHLIGHTS = [
  { icon: Users, title: '200+ Coached', note: 'Students & professionals' },
  { icon: UserRound, title: 'Founder-Led', note: 'Real product experience' },
  { icon: PlayCircle, title: 'Self-Paced', note: 'Recorded lectures' },
]

// Drop the founder photo in /public and set its path here, e.g. '/khushbu.jpg'. Empty shows the placeholder.
const FOUNDER_PHOTO = ''

const eyebrow = 'text-primary text-sm font-semibold uppercase tracking-wider'
const h2 = 'mt-2 text-3xl md:text-4xl font-bold text-white tracking-tight'

export default function About() {
  return (
    <div className="bg-black text-white">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-32 pb-20 md:pt-40 md:pb-28">
        {/* Purple wash rising from the bottom-right, behind the portrait. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_85%,rgba(124,58,237,0.28),transparent_60%)]" />
        <div className="relative mx-auto grid max-w-6xl md:grid-cols-[1.15fr_1fr] items-center gap-x-12 gap-y-14">
          <div data-reveal>
            <span className="inline-block rounded-full bg-[#6d28d9] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
              About YPM
            </span>
            <h1 className="mt-6 text-4xl md:text-6xl font-extrabold leading-[1.08] tracking-tight">
              Structured Thinking.
              <br />
              Sound Judgment.
              <br />
              <span className="text-[#8b5cf6]">No Buzzwords.</span>
            </h1>
            <p className="mt-7 text-lg font-bold text-[#FBBF24]">
              Founded by Khushbu Sharma — 200+ professionals coached
            </p>
            <p className="mt-1 text-white/80">Product Management consultant &amp; practitioner</p>
            <p className="mt-6 max-w-lg leading-relaxed text-white/60">
              YPM (Your Product Manager) was built on a simple belief: exceptional product professionals
              are shaped by structured thinking, sound judgment, and real-world clarity — not by jargon or
              surface-level frameworks.
            </p>
          </div>

          <div data-reveal className="flex justify-center">
            <div className="relative aspect-square w-full max-w-[17rem] md:max-w-[22rem] overflow-hidden rounded-full border-2 border-[#8b5cf6]/70 bg-[radial-gradient(circle_at_50%_35%,#5b2a8c,#2a1145_70%)] shadow-[0_0_80px_-10px_rgba(139,92,246,0.65)]">
              {FOUNDER_PHOTO ? (
                <img src={FOUNDER_PHOTO} alt="Khushbu Sharma" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <UserRound size={84} strokeWidth={1.5} className="absolute left-1/2 top-[30%] -translate-x-1/2 text-white/80" />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent pt-16 pb-[16%] text-center">
                <div className="font-bold">Khushbu Sharma</div>
                <div className="mt-0.5 text-sm text-white/65">Founder, YPM</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights strip */}
      <section className="border-y border-white/10 bg-[#07070c] px-4 py-10">
        <ul className="mx-auto grid max-w-4xl grid-cols-3 gap-x-4 text-center">
          {HIGHLIGHTS.map(({ icon: Icon, title, note }) => (
            <li data-reveal key={title}>
              <Icon size={26} className="mx-auto text-[#8b5cf6]" />
              <div className="mt-3 text-sm md:text-base font-bold">{title}</div>
              <div className="mt-1 text-xs md:text-sm text-white/45">({note})</div>
            </li>
          ))}
        </ul>
      </section>

      {/* Story */}
      <section className="px-4 pt-20">
        <div data-reveal className="mx-auto max-w-3xl space-y-5 text-lg leading-relaxed text-white/70">
          <span className={eyebrow}>Our story</span>
          <p>
            Founded by <span className="font-semibold text-white">Khushbu Sharma</span>, Product Management
            consultant and practitioner, YPM is a founder-led learning platform focused on building strong
            product fundamentals and consulting-grade problem-solving skills. The mission is to make product
            thinking practical, accessible, and deeply structured for professionals navigating modern
            business and technology environments.
          </p>
          <p>
            Over the years, Khushbu has personally coached and guided 200+ students and working professionals
            across diverse domains. Through mock interviews, structured mentoring, and consulting-style
            discussions, she has helped individuals strengthen their decision-making ability, refine their
            communication, and develop confidence in high-stakes product conversations.
          </p>
          <p>
            YPM now brings this experience into structured, lecture-based programs in Product Management and
            Strategic Consulting — designed for learners who want clarity without confusion, depth without
            overwhelm, and long-term growth over shortcuts.
          </p>
        </div>
      </section>

      {/* What YPM stands for */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div data-reveal className="text-center">
            <span className={eyebrow}>Principles</span>
            <h2 className={h2}>What YPM Stands For</h2>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-5">
            {STANDS_FOR.map(({ icon: Icon, text }) => (
              <div
                data-reveal
                key={text}
                className="rounded-2xl border border-white/10 bg-[#07070c] p-6 transition-colors hover:border-purple-500/40"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-[#a855f7] to-[#7e22ce]">
                  <Icon size={20} className="text-white" />
                </span>
                <p className="mt-5 font-semibold leading-snug text-white/90">{text}</p>
              </div>
            ))}
          </div>
          <p data-reveal className="mx-auto mt-10 max-w-3xl text-center leading-relaxed text-white/60">
            YPM is not positioned as a traditional institute. It is an independent, founder-driven learning
            space built for individuals who want to think clearly, make responsible decisions, and grow
            steadily in product and strategy roles.
          </p>
        </div>
      </section>

      {/* Focus + Learning */}
      <section className="px-4 py-20">
        <div className="mx-auto grid max-w-6xl lg:grid-cols-2 gap-x-8 gap-y-8">
          <div data-reveal className="rounded-3xl border border-white/10 bg-[#07070c] p-8 md:p-10">
            <span className={eyebrow}>Focus</span>
            <h2 className={h2}>Product Management & Consulting</h2>
            <p className="mt-4 leading-relaxed text-white/65">
              Modern product roles demand more than execution. YPM programs are designed to strengthen
              these core capabilities:
            </p>
            <ul className="mt-6 flex flex-wrap gap-x-2 gap-y-2">
              {CAPABILITIES.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="inline-flex items-center gap-x-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-white/90"
                >
                  <Icon size={15} className="text-[#c084fc]" />
                  {text}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-white/55">
              Whether you are transitioning into Product Management, refining your strategic thinking, or
              preparing for consulting-style roles, the focus remains the same — building clarity in how you
              analyze, prioritize, and communicate decisions.
            </p>
          </div>

          <div data-reveal className="rounded-3xl border border-white/10 bg-[#07070c] p-8 md:p-10">
            <span className={eyebrow}>Format</span>
            <h2 className={h2}>Learning at YPM</h2>
            <p className="mt-4 leading-relaxed text-white/65">All YPM programs are:</p>
            <ul className="mt-6 space-y-3">
              {LEARNING.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-x-4 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                  <Icon size={18} className="shrink-0 text-[#FBBF24]" />
                  <span className="font-semibold text-white/85">{text}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-white/55">
              The objective is not short-term tricks, but durable thinking skills that remain valuable across
              industries, roles, and evolving markets.
            </p>
          </div>
        </div>
      </section>

      {/* Founder's note */}
      <section className="px-4 py-20">
        <div data-reveal className="mx-auto max-w-3xl rounded-3xl bg-linear-to-br from-purple-500/60 via-purple-500/10 to-[#FBBF24]/40 p-px">
          <article className="rounded-3xl bg-[#07070c] p-8 md:p-14">
            <span className={eyebrow}>Founder's Note</span>
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-white/75">
              <p>
                I started YPM with the belief that education in Product Management and strategy should feel
                structured, accessible, and intellectually honest.
              </p>
              <p>
                Over time, I noticed that many programs either overcomplicate learning with heavy jargon or
                oversimplify it with surface-level templates. Neither approach builds true clarity.
              </p>
              <p>
                In my experience coaching over 200 students and professionals, one pattern has remained
                consistent: <span className="text-white">people grow when they understand why a decision
                works — not just what to do next.</span>
              </p>
              <p>That philosophy guides everything at YPM.</p>
              <p>
                You do not need to be an expert before you begin. You do not need a technical background. You
                do not need to “know it all.” What you need is curiosity, discipline, and the willingness to
                think critically.
              </p>
              <p>
                YPM is not about shortcuts or quick wins. It is about building strong fundamentals,
                responsible judgment, and long-term strategic thinking — whether you are starting out or
                strengthening your existing product career.
              </p>
              <p>
                If you value clarity over hype and structured growth over noise, you are in the right place.
              </p>
            </div>
            <div className="mt-10 border-t border-white/10 pt-6">
              <div className="font-['Playfair_Display'] text-3xl italic text-[#FBBF24]">Khushbu Sharma</div>
              <div className="mt-1 text-sm text-white/50">Founder, YPM (Your Product Manager)</div>
            </div>
          </article>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pt-8 pb-24 text-center">
        <div data-reveal>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Start building clarity</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/60">
            Self-paced programs that start from the fundamentals.
          </p>
          <Link to="/courses" className="btn-primary mt-8 inline-flex">
            Explore Courses <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}
