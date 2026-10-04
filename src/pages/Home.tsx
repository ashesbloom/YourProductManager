import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { 
  ArrowRight, UserCheck, Star, Brain, Cpu, TrendingUp, 
  Award, CheckCircle, Quote, Clock, User, Phone, Briefcase,
  ChevronLeft, ChevronRight, Shield, ChevronDown, Compass, MessageSquare,
  BadgeCheck, Linkedin, Download,
  Target, Mic2, Calendar
} from 'lucide-react'
import { CountUp } from '../components/animations/CountUp'
import { LockedCertificate } from '../components/CertificateCard'
import RotatingText from '../components/animations/RotatingText'
import { ReelsSection } from '../components/sections/ReelsSection'
import { JobTitlesSection } from '../components/sections/JobTitlesSection'
import countriesBadgeImage from '../assets/Group 3.png'
// @ts-ignore - JSX component without type declarations
import CurvedLoop from '../components/CurvedLoop'
import { CALENDLY_URL, WHATSAPP_URL } from '../lib/links'

const CAREER_GAP_OTHER_COUNTRIES: Array<{
  country: string
  target: string
  flag: string
  verb: string
  noun: string
}> = [
  { country: 'United States', target: '$120K+', flag: '🇺🇸', verb: 'Unlock', noun: 'Salaries' },
  { country: 'United Kingdom', target: '£60K+', flag: '🇬🇧', verb: 'Access', noun: 'Roles' },
  { country: 'Germany', target: '€70K+', flag: '🇩🇪', verb: 'Pivot to', noun: 'Opportunities' },
  { country: 'Canada', target: 'C$110K+', flag: '🇨🇦', verb: 'Bridge to', noun: 'Positions' },
  { country: 'Singapore', target: 'S$120K+', flag: '🇸🇬', verb: 'Unlock', noun: 'Salaries' },
  { country: 'Australia', target: 'A$140K+', flag: '🇦🇺', verb: 'Access', noun: 'Careers' },
  { country: 'United Arab Emirates (Dubai)', target: 'AED 300K+', flag: '🇦🇪', verb: 'Secure', noun: 'Roles' },
]

const features = [
  {
    icon: UserCheck,
    title: 'Interview Ready',
    description:
      'Three simulated 1:1 PM interviews and a personal project review to conquer recruitment loops including AI-native case studies.',
  },
  {
    icon: Star,
    title: 'Elite Presence',
    description:
      'FREE Professional LinkedIn and resume optimization to bridge the AI-talent gap and meet 2026 hiring standards.',
    badge: 'FREE',
  },
  {
    icon: Brain,
    title: 'Strategic Judgment',
    description:
      'Develop the professional clarity required to navigate high-stakes ambiguity. We move you beyond rigid checklists to the calibrated intuition used by the top 1% of product leaders.',
  },
  {
    icon: Cpu,
    title: 'Systems-First Thinking',
    description:
      'Master the mental models to connect product architecture, market dynamics, and sustainable business models into a single, cohesive strategy.',
  },
  {
    icon: TrendingUp,
    title: 'Global Influence & Stakeholder Mastery',
    description:
      'Master the art of high-level persuasion. Learn how to align cross-functional teams, manage complex executive boardrooms, and drive consensus for high-stakes product visions across global time zones.',
  },
  {
    icon: Compass,
    title: 'The "Strategy First" Discovery',
    description:
      'Accelerate your trajectory with a 15-minute "Career Strategy" audit. We’ll map out your current blind spots and define a clear path to your next high-stakes leadership role.',
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

const CERTIFICATE_CRITERIA = [
  'Complete 50 lectures',
  'Pass evaluations',
  'Mock interviews',
  'Case study',
]

const courses = [
  {
    badge: 'FLAGSHIP',
    title: 'AI PRODUCT MANAGEMENT',
    description: 'Master AI-first products.',
    lectures: 50,
    hours: '25+',
    isFeatured: true,
  },
  {
    badge: 'FOUNDATION',
    title: 'PM BASICS',
    description: 'Build PM fundamentals.',
    lectures: 20,
    hours: '10+',
    isFeatured: false,
  },
]


const testimonials = [
  { quote: 'From software engineer to AI PM at a Series B startup in 4 months.', author: 'Arjun S.' },
  { quote: 'The mock interviews gave me the confidence I needed.', author: 'Meera P.' },
  { quote: 'Best investment in my career. Now leading a team of 5 PMs.', author: 'Karthik R.' },
]


const mockInterviewFeatures = [
  {
    icon: Target,
    title: 'Structuring Answers',
    description: 'Learn to articulate your thoughts clearly and concisely'
  },
  {
    icon: Brain,
    title: 'Improving Clarity of Thought',
    description: 'Develop systematic thinking for complex PM problems'
  },
  {
    icon: UserCheck,
    title: 'Domain Alignment',
    description: 'Align responses with your specific domain (tech, non-tech, AI)'
  },
  {
    icon: Mic2,
    title: 'Product Communication',
    description: 'Master the art of communicating product decisions effectively'
  }
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
]

// Simple fade-in animation variant
const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
}

const CAREER_GAP_HERO = [
  { country: 'USA', target: '$120K+', flag: '🇺🇸', trend: 'up' },
  { country: 'UK', target: '$60K+', flag: '🇬🇧', trend: 'compass' },
  { country: 'Germany', target: '₹70K+', flag: '🇩🇪', trend: 'chart' },
  { country: 'Canada', target: 'C$110K+', flag: '🇨🇦', trend: 'up-right' },
  { country: 'Singapore', target: '$120K+', flag: '🇸🇬', trend: 'chart' },
  { country: 'Australia', target: 'A$140K+', flag: '🇦🇺', trend: 'wave' },
  { country: 'UAE', target: 'AED 300K+', flag: '🇦🇪', trend: 'line' },
]

const countryCardVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction === 1 ? 120 : -120,
    scale: 0.96,
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction === 1 ? -120 : 120,
    scale: 0.96,
  }),
}

const TWEMOJI_SVG_BASE =
  'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/'

function twemojiSvgUrl(emoji: string) {
  const codePoints = Array.from(emoji)
    .map((char) => char.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join('-')

  return `${TWEMOJI_SVG_BASE}${codePoints}.svg`
}

function FlagIcon({
  emoji,
  alt,
  className = 'h-5 w-5',
}: {
  emoji: string
  alt: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span className={`emoji-font block leading-none ${className}`} aria-hidden>
        {emoji}
      </span>
    )
  }

  return (
    <img
      src={twemojiSvgUrl(emoji)}
      alt={alt}
      className={`block shrink-0 ${className}`}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
    />
  )
}

function AnimatedTarget({
  target,
  duration = 1.0,
  className,
}: {
  target: string
  duration?: number
  className?: string
}) {
  const parts = target.match(/^([^\d]*)(\d+)(.*)$/)

  if (!parts) {
    return <span className={className}>{target}</span>
  }

  const [, prefix, numberValue, suffix] = parts

  return (
    <CountUp
      end={Number(numberValue)}
      prefix={prefix}
      suffix={suffix}
      duration={duration}
      className={className}
    />
  )
}

// FAQ Item with animated chevron
function FAQItem({ faq, index }: { faq: { q: string; a: string }; index: number }) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <motion.div
      className="glass-card p-6 cursor-pointer"
      layout
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeIn}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="font-semibold text-foreground flex items-center justify-between">
        <span className="pr-4 leading-snug text-left">{faq.q}</span>
        <ChevronDown
          size={20} 
          className={`text-primary ml-2 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="text-muted-foreground mt-4 text-sm leading-relaxed whitespace-pre-line">
              {faq.a}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Home() {
  const rotatingCountryCards = CAREER_GAP_HERO.slice(2)
  const [certificateUnlocked, setCertificateUnlocked] = useState(false)
  const certificateSectionRef = useRef<HTMLElement>(null)

  // The certificate unlocks as the section comes into view rather than from a click.
  // Everything it drives (blur lift, criteria ticks, ID fade) is already a CSS
  // transition on this flag, so ScrollTrigger only has to supply the moment.
  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: certificateSectionRef.current,
      start: 'top 55%',
      once: true,
      onEnter: () => setCertificateUnlocked(true),
    })
    return () => trigger.kill()
  }, [])
  const [activeCountryCardIndex, setActiveCountryCardIndex] = useState(0)
  const [cardTransitionDirection, setCardTransitionDirection] = useState<1 | -1>(1)
  const [isManualControlActive, setIsManualControlActive] = useState(false)
  const [manualInteractionNonce, setManualInteractionNonce] = useState(0)

  const switchCountryCard = (direction: 1 | -1, isManual = false) => {
    if (isManual) {
      setIsManualControlActive(true)
      setManualInteractionNonce((prev) => prev + 1)
    }

    setCardTransitionDirection(direction)
    setActiveCountryCardIndex((prev) =>
      direction === 1
        ? (prev + 1) % rotatingCountryCards.length
        : prev === 0
          ? rotatingCountryCards.length - 1
          : prev - 1
    )
  }

  useEffect(() => {
    if (rotatingCountryCards.length <= 1 || isManualControlActive) return

    const intervalId = window.setInterval(() => {
      switchCountryCard(1)
    }, 4500)

    return () => window.clearInterval(intervalId)
  }, [rotatingCountryCards.length, isManualControlActive])

  useEffect(() => {
    if (!isManualControlActive) return

    const resumeTimerId = window.setTimeout(() => {
      setIsManualControlActive(false)
    }, 6000)

    return () => window.clearTimeout(resumeTimerId)
  }, [isManualControlActive, manualInteractionNonce])

  const activeCountryCard = rotatingCountryCards[activeCountryCardIndex]
  const getCountryCardAtOffset = (offset: number) =>
    rotatingCountryCards[
      (activeCountryCardIndex + offset + rotatingCountryCards.length * 4) %
        rotatingCountryCards.length
    ]

  const previousCountryCard = getCountryCardAtOffset(-1)
  const nextCountryCard = getCountryCardAtOffset(1)

  const goToPreviousCountryCard = () => {
    switchCountryCard(-1, true)
  }

  const goToNextCountryCard = () => {
    switchCountryCard(1, true)
  }

  return (
    <div className="relative overflow-x-hidden rounded-all-divs">
      {/* Background orbs - CSS only, no JS */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      {/* ═══════════════ HERO + LEAD CAPTURE ═══════════════ */}
      <section className="flex items-center pt-28 pb-16">
        <div className="container grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Left Column: Content */}
          <div className="text-left">
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-7xl font-bold text-foreground mb-12 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex flex-wrap items-end gap-x-3 gap-y-2">
                <span>Think Like a</span>
                <RotatingText
                  texts={['Product', 'Manager']}
                  mainClassName="overflow-hidden min-w-[8ch] text-pink-300"
                  staggerFrom="last"
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '-120%' }}
                  staggerDuration={0.02}
                  splitLevelClassName="overflow-hidden"
                  elementLevelClassName="rotating-gradient-text"
                  transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                  rotationInterval={2200}
                />
              </span>
            </motion.h1>

            <motion.p 
              className="text-lg md:text-xl text-muted-foreground mb-12 max-w-150 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Master the frameworks to build, scale, and lead AI products.<br />
              The <span className="text-foreground font-semibold">Vision Enhancer</span> for your career.
            </motion.p>

            <motion.div 
              className="mt-8 grid grid-cols-2 gap-4 max-w-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {CAREER_GAP_HERO.slice(0, 2).map((item) => (
                <div
                  key={item.country}
                  className="relative rounded-3xl border border-purple-500/45 bg-black px-6 py-5 min-h-35 overflow-hidden transition-all duration-300 hover:border-purple-400 hover:shadow-[0_12px_36px_-18px_rgba(168,85,247,0.75)]"
                >
                  <div className="relative flex flex-col gap-3">
                    <div className="flex items-center gap-3 text-white/90">
                      <FlagIcon emoji={item.flag} alt={item.country} className="w-6 h-6 rounded-full" />
                      <span className="font-['Montserrat'] font-bold text-base md:text-lg tracking-wide uppercase">
                        {item.country}
                      </span>
                    </div>

                    <div className="text-[clamp(1.9rem,3.2vw,2.5rem)] font-['Montserrat'] font-black text-[#FBBF24] leading-none uppercase">
                      <AnimatedTarget target={item.target} duration={1.0} />
                    </div>

                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold opacity-80">
                      Unlock high-value positions
                    </div>
                  </div>
                </div>
              ))}

              <div className="col-span-2 mt-2 relative mx-auto w-full max-w-85 overflow-visible">
                <div className="absolute top-0 left-[-58%] z-0 w-full aspect-square rounded-2xl border border-white/10 bg-black p-6 flex flex-col justify-center opacity-35 scale-90 overflow-hidden backdrop-blur-xl transition-all duration-300 hover:border-purple-400 hover:opacity-55 hover:shadow-[0_10px_32px_-16px_rgba(168,85,247,0.75)]">
                  <div className="absolute inset-0 bg-linear-to-br from-white/14 via-transparent to-transparent" />
                  <div className="absolute -top-2 right-12 h-[120%] w-14 rotate-12 bg-white/8 blur-xl" />
                  <div className="relative mx-auto h-3 w-40 rounded-full bg-white/12" />
                  <div className="relative mt-4 mx-auto h-2 w-28 rounded-full bg-[#FBBF24]/35" />
                  <div className="relative mt-2 mx-auto h-2 w-20 rounded-full bg-white/10" />
                </div>

                <div className="absolute top-0 left-[-38%] z-10 w-full aspect-square rounded-2xl border border-purple-500/45 bg-black p-6 flex flex-col justify-center opacity-55 scale-95 overflow-hidden backdrop-blur-xl transition-all duration-300 hover:border-purple-400 hover:opacity-80 hover:shadow-[0_12px_36px_-18px_rgba(168,85,247,0.75)]">
                  <div className="absolute inset-0 bg-linear-to-br from-white/16 via-transparent to-transparent" />
                  <div className="absolute -top-2 right-12 h-[120%] w-16 rotate-12 bg-white/10 blur-xl" />
                  <div className="relative text-center overflow-hidden">
                    <div className="text-[11px] uppercase tracking-[0.22em] font-['Montserrat'] font-bold text-white/85 truncate">
                      {previousCountryCard.country}
                    </div>
                    <div className="mt-2 text-2xl leading-none uppercase tracking-tight font-['Montserrat'] font-black text-[#FBBF24] truncate">
                      {previousCountryCard.target} openings
                    </div>
                    <div className="mt-2 text-[10px] text-muted-foreground/85 truncate">
                      Connect with {previousCountryCard.target} high-growth careers
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none absolute top-0 right-[-38%] z-10 w-full aspect-square rounded-2xl border border-purple-500/45 bg-black/45 p-6 flex flex-col justify-center opacity-55 scale-95 overflow-hidden backdrop-blur-xl">
                  <div className="absolute inset-0 bg-linear-to-bl from-white/16 via-transparent to-transparent" />
                  <div className="absolute -top-2 left-12 h-[120%] w-16 -rotate-12 bg-white/10 blur-xl" />
                  <div className="relative text-center overflow-hidden">
                    <div className="text-[11px] uppercase tracking-[0.22em] font-['Montserrat'] font-bold text-white/85 truncate">
                      {nextCountryCard.country}
                    </div>
                    <div className="mt-2 text-2xl leading-none uppercase tracking-tight font-['Montserrat'] font-black text-[#FBBF24] truncate">
                      {nextCountryCard.target} openings
                    </div>
                    <div className="mt-2 text-[10px] text-muted-foreground/85 truncate">
                      Connect with {nextCountryCard.target} high-growth careers
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none absolute top-0 right-[-58%] z-0 w-full aspect-square rounded-2xl border border-white/10 bg-black/30 p-6 flex flex-col justify-center opacity-35 scale-90 overflow-hidden backdrop-blur-xl">
                  <div className="absolute inset-0 bg-linear-to-bl from-white/14 via-transparent to-transparent" />
                  <div className="absolute -top-2 left-12 h-[120%] w-14 -rotate-12 bg-white/8 blur-xl" />
                  <div className="relative mx-auto h-3 w-40 rounded-full bg-white/12" />
                  <div className="relative mt-4 mx-auto h-2 w-28 rounded-full bg-[#FBBF24]/35" />
                  <div className="relative mt-2 mx-auto h-2 w-20 rounded-full bg-white/10" />
                </div>

                <button
                  type="button"
                  onClick={goToPreviousCountryCard}
                  aria-label="Previous country"
                  className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 z-40 h-12 w-12 rounded-full border border-white/15 bg-black text-white/80 hover:bg-[#121212] transition-colors shadow-[0_8px_20px_rgba(0,0,0,0.35)] flex items-center justify-center"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="relative z-30 w-full aspect-square">
                  <AnimatePresence mode="sync" initial={false}>
                    <motion.div
                      custom={cardTransitionDirection}
                      key={activeCountryCard.country}
                      className="absolute inset-0 rounded-2xl border border-purple-500/45 bg-black p-6 flex flex-col justify-center overflow-hidden transform-gpu"
                      variants={countryCardVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        duration: 0.46,
                        ease: [0.25, 0.8, 0.25, 1],
                        opacity: { duration: 0.32, ease: 'linear' },
                      }}
                      style={{ willChange: 'transform, opacity' }}
                    >
                    <div className="relative z-10 flex items-center justify-center gap-3">
                      <FlagIcon emoji={activeCountryCard.flag} alt={activeCountryCard.country} className="w-8 h-8" />
                      <span className="font-['Montserrat'] font-extrabold text-[clamp(1.35rem,2.4vw,1.8rem)] tracking-[0.05em] uppercase">
                        {activeCountryCard.country}
                      </span>
                    </div>

                    <div className="relative z-10 mt-5 text-center">
                      <div className="text-[clamp(1.55rem,3.2vw,2.15rem)] leading-none uppercase tracking-tight font-['Montserrat'] font-black text-[#FBBF24]">
                        {activeCountryCard.target} premium openings
                      </div>
                    </div>

                    <div className="relative z-10 mt-3 text-center text-[clamp(0.75rem,1.35vw,0.95rem)] text-white/85 font-medium">
                      Connect with {activeCountryCard.target} High-Growth Careers
                    </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={goToNextCountryCard}
                  aria-label="Next country"
                  className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 z-40 h-12 w-12 rounded-full border border-white/15 bg-black text-white/80 hover:bg-[#121212] transition-colors shadow-[0_8px_20px_rgba(0,0,0,0.35)] flex items-center justify-center"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Lead Capture Form */}
          <div className="w-full">
            <div data-reveal
              className="relative rounded-3xl border border-purple-500/45 bg-gradient-to-br from-[#18102a] via-[#0a0a14] to-[#1a1333] overflow-hidden shadow-2xl shadow-purple-900/40 ring-1 ring-purple-700/30 transition-all duration-300 hover:border-purple-400 hover:shadow-[0_20px_60px_-10px_rgba(139,92,246,0.55),0_2px_16px_0_rgba(0,0,0,0.25)] hover:ring-2 hover:ring-purple-400/40"
            >
              <div className="absolute inset-1 rounded-4xl border border-purple-500/20 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-br from-purple-700/10 via-black/0 to-purple-900/10 pointer-events-none" />
              <div className="absolute -top-8 right-12 h-[170%] w-16 rotate-12 bg-white/10 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-8 left-12 h-[120%] w-16 -rotate-12 bg-purple-500/10 blur-2xl pointer-events-none" />

              <div className="relative p-8 md:p-9">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <h3 className="text-2xl font-bold text-center mb-2 tracking-tight">
                  <span className="text-white font-['Montserrat'] font-extrabold uppercase tracking-wide">Start Your PM Journey</span>
                </h3>
                <p className="text-muted-foreground text-center text-[13px] mb-8 leading-relaxed opacity-80">
                  Get personalized guidance for your transition<br />into product management
                </p>
                
                <form className="space-y-3.5">
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                    <input
                      type="text"
                      placeholder="Your Name"
                      className="w-full bg-[#0a0a14] border border-white/5 rounded-xl py-4 pl-12 pr-4 text-sm focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground/30 font-medium"
                    />
                  </div>
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                    <input
                      type="tel"
                      placeholder="WhatsApp Number"
                      className="w-full bg-[#0a0a14] border border-white/5 rounded-xl py-4 pl-12 pr-4 text-sm focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground/30 font-medium"
                    />
                  </div>
                  <div className="relative">
                    <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                    <input
                      type="text"
                      placeholder="Current Role"
                      className="w-full bg-[#0a0a14] border border-white/5 rounded-xl py-4 pl-12 pr-4 text-sm focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground/30 font-medium"
                    />
                  </div>

                  <motion.button 
                    type="submit" 
                    className="w-full py-4 mt-3 rounded-xl bg-[#5b21b6] text-white font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-[#6d28d9] transition-all shadow-lg shadow-purple-900/20"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    Start Learning
                    <ChevronRight size={18} />
                  </motion.button>
                </form>

                <div className="mt-8 flex items-center justify-center gap-6 pt-6 border-t border-white/3">
                  <div className="flex items-center gap-2 text-[10px] text-white font-bold uppercase tracking-widest opacity-80">
                    <Shield size={12} />
                    <span>100% SECURE</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white font-bold uppercase tracking-widest opacity-80">
                    <UserCheck size={12} />
                    <span>500+ ENROLLED</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="relative rounded-3xl border border-purple-500/45 bg-black px-6 py-6 flex flex-col items-center justify-center text-center overflow-hidden transition-all duration-300 hover:border-purple-400 hover:shadow-[0_12px_36px_-18px_rgba(168,85,247,0.75)]">

                <div className="relative z-10">
                  <div className="text-3xl font-['Montserrat'] font-black text-[#FBBF24] tracking-tight leading-none">
                    <CountUp end={300} suffix="+" duration={1.0} />
                  </div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-widest mt-1.5 font-semibold opacity-80">Product Leaders</div>
                </div>
                <div className="relative z-10 mt-4 opacity-55 transition-opacity">
                  <Award size={26} className="text-[#8b5cf6]" />
                </div>
              </div>
              <div
                className="relative rounded-3xl border border-purple-500/45 bg-black px-6 py-6 overflow-hidden flex flex-col justify-center transition-all duration-300 hover:border-purple-400 hover:shadow-[0_12px_36px_-18px_rgba(168,85,247,0.75)]"
              >
                <div className="relative z-10 h-32 flex items-center justify-center">
                  <div className="countries-orbit-center">
                    <img
                      src={countriesBadgeImage}
                      alt="7+ Countries"
                      className="countries-orbit-image"
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                  </div>

                  <div className="countries-orbit-ring" aria-hidden="true">
                    {CAREER_GAP_OTHER_COUNTRIES.map((c, index) => {
                      const angle = (360 / CAREER_GAP_OTHER_COUNTRIES.length) * index
                      const radius = 66
                      const radians = ((angle - 90) * Math.PI) / 180
                      const x = Math.cos(radians) * radius
                      const y = Math.sin(radians) * radius

                      return (
                        <div
                          key={c.country}
                          className="countries-orbit-item"
                          style={{
                            left: `calc(50% + ${x}px)`,
                            top: `calc(50% + ${y}px)`,
                            transform: 'translate(-50%, -50%)',
                          }}
                          title={c.country}
                        >
                          <span className="countries-orbit-upright h-8 w-8 rounded-full border border-[#FBBF24]/90 flex items-center justify-center bg-black/80">
                            <FlagIcon emoji={c.flag} alt={`${c.country} flag`} className="h-5 w-5 rounded-full" />
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ CURVED LOOP MARQUEE ═══════════════ */}
      <section className="w-full">
        <CurvedLoop 
          marqueeText="AI Product Management ✦ Career Growth ✦ Expert Mentorship ✦ Real Projects ✦ Interview Ready ✦ "
          speed={1.5}
          curveAmount={150}
          direction="left"
          interactive
          className="curved-loop-text"
        />
      </section>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section className="container py-24 overflow-hidden">
        <div data-reveal
          className="text-center mb-16 px-4"
        >
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight wrap-break-word">
            Why Your Product Manager?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
          {features.map((feature, i) => (
            <div data-reveal
              key={i}
              className="glass-card p-8 relative border border-white/5 hover:border-primary/20 transition-all group overflow-hidden"
            >
              {feature.badge && (
                <span className="absolute top-4 right-4 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-primary/20">
                  {feature.badge}
                </span>
              )}
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300 shadow-xl shadow-primary/5">
                <feature.icon size={28} />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-foreground mb-3 leading-tight whitespace-normal wrap-break-word overflow-hidden">
                {feature.title}
              </h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed whitespace-normal wrap-break-word">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex justify-center pb-8">
          <Link 
            to="/coaching" 
            className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold uppercase tracking-widest bg-linear-to-r from-[#a855f7] via-[#9333ea] to-[#7e22ce] bg-[#a855f7]! text-white rounded-2xl shadow-[0_0_50px_-10px_rgba(139,92,246,0.6)] hover:shadow-[0_0_65px_-5px_rgba(139,92,246,0.8)] transition-all duration-300 transform hover:-translate-y-2 active:scale-95 border-none"
          >
            Schedule free 15 minute call
          </Link>
        </div>
      </section>

      <JobTitlesSection />

      {/* ═══════════════ SUCCESS STORIES (TESTIMONIALS) ═══════════════ */}
      <section className="container py-24 overflow-hidden border-t border-white/5">
        <div data-reveal
          className="text-center mb-16 px-4"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Testimonials</span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mt-2 tracking-tight">
            Success Stories
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Results that speak louder than promises.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
          {testimonials.map((testimonial, i) => (
            <div data-reveal
              key={i}
              className="glass-card p-10 relative border border-white/5 hover:border-primary/20 transition-all group flex flex-col justify-between"
            >
              <div className="absolute top-6 right-6 text-primary/20 group-hover:text-primary/40 transition-colors">
                <Quote size={40} />
              </div>
              <p className="text-lg text-foreground/90 italic leading-relaxed mb-8 relative z-10">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-3 mt-auto">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  {testimonial.author.charAt(0)}
                </div>
                <div className="font-bold text-foreground">
                  {testimonial.author}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ TESTIMONIAL REELS ═══════════════ */}
      <ReelsSection />


      {/* ═══════════════ MOCK INTERVIEWS SECTION ═══════════════ */}
      <section className="bg-black py-24 px-4 overflow-hidden border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div data-reveal
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              Mock Interviews
            </h2>
            <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed font-medium">
              Personalized sessions designed to help you reframe your answers and product 
              thinking according to your personal domain, background, and experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 mb-20">
            {mockInterviewFeatures.map((item, i) => (
              <div data-reveal
                key={i}
                className="bg-white rounded-[2rem] p-10 border border-gray-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col items-center text-center transition-all hover:translate-y-[-5px] hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)]"
              >
                <div className="h-16 w-16 rounded-2xl bg-[#7c3aed] flex items-center justify-center mb-8 text-white shadow-lg shadow-purple-500/20">
                  <item.icon size={32} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold text-[#0a0a0f] mb-4 leading-tight">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed px-2">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center">
            <div data-reveal
              className="text-center max-w-3xl"
            >
              <p className="text-white/50 text-sm font-semibold tracking-wide">Results so far</p>
              <h3 className="text-3xl md:text-4xl font-bold text-white mt-3 tracking-tight">
                <CountUp end={120} start={0} suffix="+" /> Dreams Achieved
              </h3>
              <p className="text-base text-gray-300 leading-relaxed mt-5 font-medium">
                Join a community of students and professionals who have successfully navigated
                elite recruitment loops. We use data from every past session to give you the most
                relevant, up-to-date practice.
              </p>
            </div>

            <div className="flex flex-col-reverse items-stretch gap-5 mt-12 mx-auto max-w-md sm:flex-row sm:items-center sm:justify-center sm:max-w-none">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 px-9 py-5 rounded-[2rem] border-2 border-white/20 text-white text-lg font-bold whitespace-nowrap hover:border-[#7c3aed] hover:bg-[#7c3aed]/10 transition-all"
              >
                <MessageSquare size={22} />
                Raise a Query
              </a>

              <a
                href={CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="relative inline-flex items-center justify-center gap-3 px-9 py-5 rounded-[2rem] border-2 border-transparent bg-[#7c3aed] text-white text-lg font-bold whitespace-nowrap shadow-2xl shadow-purple-500/30 hover:bg-[#6d28d9] transition-all"
              >
                <span className="absolute -top-3 right-5 rounded-full bg-[#FBBF24] px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[#0a0a0f] shadow-lg">
                  Limited slots
                </span>
                <Calendar size={22} />
                Book a Mock Interview
              </a>
            </div>

            <p className="text-center text-gray-400 text-[13px] max-w-2xl leading-relaxed mt-10 font-medium">
              Mock interviews are guidance-focused and tailored to individual backgrounds.<br />
              They are designed to improve confidence and clarity, not to guarantee job outcomes.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ PROGRAMS + 1:1 MENTORSHIP ═══════════════ */}
      <section className="container py-24 border-t border-white/5">
        <div data-reveal
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">
            Master PM Skills
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Start with a recorded program at your own pace, or work directly with Khushbu one-to-one.
          </p>
        </div>

        {/* ─────── Path one: recorded programs ─────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {courses.map((course, i) => (
            <div data-reveal
              key={i}
              className={`glass-card relative overflow-hidden p-8 ${
                course.isFeatured ? 'ring-1 ring-primary/25' : ''
              }`}
            >
              <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold">
                {course.badge}
              </span>
              <h3 className="text-2xl font-bold text-foreground mt-4 mb-2">{course.title}</h3>
              <p className="text-muted-foreground mb-6">{course.description}</p>
              <div className="flex items-center gap-5 text-sm text-muted-foreground mb-6">
                <span className="flex items-center gap-2">
                  <Clock size={16} />
                  {course.lectures} Lectures
                </span>
                <span className="text-white/40">{course.hours} hours total</span>
              </div>
              <Link to="/courses" className="btn-primary w-full text-center">
                Explore Course
              </Link>

              {course.isFeatured && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[94%] h-1 bg-primary shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center px-4">
          <Link to="/apply">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-12 py-5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white font-black uppercase tracking-widest shadow-[0_0_40px_-10px_rgba(139,92,246,0.5)] hover:shadow-[0_0_50px_-5px_rgba(139,92,246,0.7)] transition-all border-none"
            >
              Apply Now
            </motion.button>
          </Link>
        </div>

        {/* The fork between the two ways of learning, made explicit. */}
        <div className="mt-16 flex items-center gap-5 max-w-4xl mx-auto px-4">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35">or</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        {/* ─────── Path two: 1:1 with Khushbu ─────── */}
        <div data-reveal
          className="mt-16 max-w-4xl mx-auto rounded-[2.5rem] bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 p-10 md:p-14 text-center"
        >
          <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Elite 1:1 Mentorship with Khushbu Sharma
          </h3>

          <p className="mt-5 text-base md:text-lg text-white/85 max-w-2xl mx-auto leading-relaxed font-medium">
            Skip the generic advice. Get customised, personalized coaching to solve your
            specific career bottlenecks.
          </p>

          <p className="mt-8 text-white font-semibold text-lg md:text-xl">
            ₹1,300/hour or ₹15,000 for 7 days (2 hours/day)
          </p>

          <div className="mt-10 flex justify-center">
            <Link to="/coaching">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-3 px-8 md:px-12 py-5 md:py-6 bg-white text-[#0a0a0f] rounded-[2.5rem] text-lg md:text-xl font-bold whitespace-nowrap shadow-2xl shadow-black/20 hover:bg-white/90 transition-all"
              >
                Schedule 1:1 Call
                <ArrowRight size={22} />
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ PATH COMPARISON ═══════════════ */}
      <section className="container py-24 border-t border-white/5">
        <div data-reveal
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">
            Choose the Right Path for Your Growth
          </h2>
        </div>

        <div data-reveal
          className="max-w-6xl mx-auto overflow-hidden rounded-2xl border border-purple-500/25 bg-black"
        >
          {/* Four columns cannot fit a phone, so the table scrolls with its label column pinned. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse text-left">
              <thead>
                <tr className="bg-white/[0.03]">
                  <th
                    scope="col"
                    className="sticky left-0 z-10 bg-[#070709] px-6 py-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40"
                  >
                    Feature
                  </th>
                  {PATH_COLUMNS.map((path) => (
                    <th
                      key={path}
                      scope="col"
                      className="px-6 py-5 font-['Montserrat'] text-sm font-black uppercase tracking-wide text-white"
                    >
                      {path}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {PATH_COMPARISON.map((row) => (
                  <tr key={row.label} className="border-t border-white/5">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-[#070709] px-6 py-5 align-top text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55"
                    >
                      {row.label}
                    </th>
                    {row.values.map((value, i) => (
                      <td
                        key={i}
                        className="px-6 py-5 align-top text-sm leading-relaxed text-muted-foreground"
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-white/35 sm:hidden">
          Swipe the table to compare all three →
        </p>
      </section>

      {/* ═══════════════ CERTIFICATE ═══════════════ */}
      <section ref={certificateSectionRef} className="container py-24 border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-16 items-center max-w-6xl mx-auto">
          <div data-reveal
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Industry-Aligned Completion Certificate
            </h2>
            <p className="text-muted-foreground mb-10">
              Issued after 100% course completion, including all lectures, evaluations,
              mock interviews, and your final product case study.
            </p>

            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40 mb-5">
              What unlocks it
            </p>
            <ul className="space-y-3.5">
              {CERTIFICATE_CRITERIA.map((item, i) => (
                <li key={item} className="flex items-center gap-3">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                      certificateUnlocked
                        ? 'bg-primary text-white'
                        : 'border border-white/20 text-transparent'
                    }`}
                    style={{ transitionDelay: certificateUnlocked ? `${i * 90}ms` : '0ms' }}
                  >
                    <CheckCircle size={13} strokeWidth={3} />
                  </span>
                  <span
                    className={`text-sm transition-colors duration-300 ${
                      certificateUnlocked ? 'text-foreground' : 'text-white/45'
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
                certificateUnlocked
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-2 pointer-events-none'
              }`}
              aria-hidden={!certificateUnlocked}
            >
              <div className="flex items-baseline gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                  Certificate ID
                </span>
                <span className="font-['Montserrat'] text-sm font-black tracking-wider text-[#FBBF24]">
                  YPM0000000
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  to="/verify?id=YPM0000000"
                  tabIndex={certificateUnlocked ? 0 : -1}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary/10"
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
                    className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/35"
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div data-reveal>
            <LockedCertificate unlocked={certificateUnlocked} />
          </div>
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section className="container py-24 max-w-3xl mx-auto">
        <div data-reveal
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">FAQ</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <FAQItem key={i} faq={faq} index={i} />
          ))}
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="container py-24 text-center">
        <div data-reveal
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Transform Your Career?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of successful PMs who started their journey with us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/courses" className="btn-primary">
              Get Started <ArrowRight size={18} />
            </Link>
            <Link to="/coaching" className="btn-secondary">
              Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
