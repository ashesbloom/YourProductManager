import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, CheckCircle2, Lock, Play } from 'lucide-react'
import { COURSE_INCLUDED, COURSES, courseLectures, type Lecture } from '@/data/catalog'
import { BuyButton, PriceBlock } from '@/components/CourseOfferCard'
import { useCheckout } from '@/lib/checkout'
import { useMe, useProgress, type Progress } from '@/lib/me'

// Khushbu's two-column prototype: AI PM on the left, Foundations (free with it) on the right.
// Lock icons here are display only; the Worker refuses paid video to anyone without an enrollment.
const COLUMNS = [
  {
    id: 'ai-product',
    blurb: 'Build your skills in AI product strategy, discovery, development, metrics and responsible AI.',
    count: (n: number) => `${n} AI PM lectures`,
    banner: {
      title: 'Start with a free lecture',
      body: (n: number) => `Try the first lecture before purchasing. Lectures 2–${n} unlock after you purchase the AI Product Management course.`,
      tag: 'Lecture 1 · Free access',
    },
    lockedNote: 'Unlocks with course purchase',
  },
  {
    id: 'foundations',
    blurb: 'Strengthen your core product management knowledge, from product thinking and discovery to delivery and growth.',
    count: (n: number) => `${n} foundational lectures`,
    banner: {
      title: 'Included free with AI Product Management',
      body: (n: number) => `All ${n} foundational lectures unlock when you purchase the AI Product Management course. No additional payment is required.`,
      tag: '',
    },
    lockedNote: 'Unlocks after AI PM course purchase',
  },
] as const

const minutes = (s: number) => `${Math.round(s / 60)} min`

function LectureRow({ courseId, lecture, n, enrolled, progress }: { courseId: string; lecture: Lecture; n: number; enrolled: boolean; progress?: Progress }) {
  const open = enrolled || lecture.free
  const lp = progress?.lectures[lecture.id]
  const note = !open
    ? null
    : lp?.completed
      ? 'Completed'
      : lp?.pct
        ? `${lp.pct}% watched`
        : lecture.durationS
          ? lecture.free && !enrolled ? `Free preview · ${minutes(lecture.durationS)}` : minutes(lecture.durationS)
          : 'Video coming soon'
  const body = (
    <>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
          lp?.completed ? 'bg-accent/15 text-accent' : open ? 'bg-purple-500/20 text-purple-200' : 'bg-white/[0.06] text-white/45'
        }`}
      >
        {lp?.completed ? <CheckCircle2 size={16} aria-label="Completed" /> : String(n).padStart(2, '0')}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-semibold leading-snug ${open ? 'text-white' : 'text-white/60'}`}>{lecture.title}</span>
        <span className="mt-0.5 block text-xs text-white/45">{note ?? COLUMNS.find((c) => c.id === courseId)!.lockedNote}</span>
      </span>
      {open ? (
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold ${
            lecture.free && !enrolled ? 'bg-accent text-black' : 'border border-purple-400/40 text-white'
          }`}
        >
          <Play size={11} fill="currentColor" />
          {lecture.free && !enrolled ? 'Watch free' : lp?.completed ? 'Rewatch' : 'Watch'}
        </span>
      ) : (
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-bold text-white/55">
          <Lock size={11} /> Locked
        </span>
      )}
    </>
  )
  const cls = 'flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/40 p-3'
  return (
    <li>
      {open ? (
        <Link to={`/learn/${courseId}/${lecture.id}`} className={`${cls} transition-colors hover:border-purple-400/50 hover:bg-purple-500/[0.06]`}>
          {body}
        </Link>
      ) : (
        <div className={`${cls} opacity-80`}>{body}</div>
      )}
    </li>
  )
}

function CourseColumn({ column, enrolled }: { column: (typeof COLUMNS)[number]; enrolled: boolean }) {
  const course = COURSES[column.id]
  const lectures = courseLectures(column.id)
  const { data: progress } = useProgress(column.id, enrolled)
  const done = lectures.filter((l) => progress?.lectures[l.id]?.completed).length
  const pct = Math.round((done * 100) / lectures.length)
  const foundations = column.id === 'foundations'

  return (
    <section
      id={column.id}
      className={`min-w-0 scroll-mt-[calc(var(--header-h)+1rem)] rounded-2xl border bg-[#0d0d14] p-5 md:p-6 ${foundations ? 'border-purple-400/30' : 'border-white/10'}`}
    >
      <h2 className="font-['Montserrat'] text-2xl font-bold leading-tight">{course.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-white/55">{column.blurb}</p>
      <span className="mt-4 inline-block rounded-md border border-accent/40 bg-accent/10 px-2.5 py-1.5 text-xs font-bold text-accent">
        {column.count(lectures.length)}
      </span>

      {enrolled ? (
        <div className="mt-5 rounded-xl border border-purple-400/30 bg-purple-500/10 p-4">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-semibold">Your progress</span>
            <span className="text-white/60">
              {done} of {lectures.length} completed
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label={`${course.title} progress`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
      ) : (
        <div className={`mt-5 rounded-xl border p-4 ${foundations ? 'border-purple-400/30 bg-[#171020]' : 'border-purple-500/50 bg-linear-to-br from-[#29184a] to-[#171020]'}`}>
          <p className="flex items-center gap-2 text-sm font-bold text-purple-100">
            {foundations && <Lock size={14} />}
            {column.banner.title}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-purple-100/75">{column.banner.body(lectures.length)}</p>
          {column.banner.tag && (
            <span className="mt-3 inline-block rounded bg-accent px-2 py-1 text-[0.65rem] font-extrabold uppercase tracking-wide text-black">{column.banner.tag}</span>
          )}
        </div>
      )}

      <ol className="mt-5 grid gap-2">
        {lectures.map((l, i) => (
          <LectureRow key={l.id} courseId={column.id} lecture={l} n={i + 1} enrolled={enrolled} progress={progress} />
        ))}
      </ol>
    </section>
  )
}

export default function Courses() {
  const { data: me } = useMe()
  const { buy, owned, ready, product } = useCheckout()
  const [params, setParams] = useSearchParams()
  const autoBuy = useRef(false)

  // Back from login after pressing Buy (BUY_AFTER_LOGIN): reopen checkout once.
  useEffect(() => {
    if (params.get('buy') !== '1' || !ready || autoBuy.current) return
    autoBuy.current = true
    setParams({}, { replace: true })
    if (me?.user && !owned) buy()
  }, [params, ready, me, owned, buy, setParams])

  return (
    <div className="bg-black text-white">
      <section className="container pt-[calc(var(--header-h)+3rem)] pb-12">
        <div className="grid items-start gap-x-14 gap-y-10 lg:grid-cols-[1fr_minmax(0,25rem)]">
          <div>
            <h1 className="font-['Montserrat'] text-4xl font-extrabold leading-tight md:text-5xl">Explore your courses</h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/60">
              Two courses in one purchase: {courseLectures('ai-product').length} AI Product Management lectures, plus{' '}
              {courseLectures('foundations').length} Product Management Foundations lectures included free.
            </p>
            <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.025] p-4 md:p-5">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-purple-300">What's included</h2>
              <ul className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
                {COURSE_INCLUDED.map(({ strong, text }) => (
                  <li key={text} className="flex items-start gap-2 text-sm">
                    <Check size={16} strokeWidth={3} className="mt-0.5 shrink-0 text-purple-300" />
                    <span>
                      {strong && <strong>{strong} </strong>}
                      {text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-purple-400/40 bg-linear-to-br from-black via-purple-950/30 to-black p-4 md:p-6">
            {owned ? (
              <p className="text-center text-sm text-white/70">You own both courses. Pick up where you left off.</p>
            ) : (
              <PriceBlock product={product} />
            )}
            <BuyButton />
          </div>
        </div>
      </section>

      <div className="container grid items-start gap-6 pb-16 lg:grid-cols-2">
        {COLUMNS.map((c) => (
          <CourseColumn key={c.id} column={c} enrolled={!!me?.enrollments.includes(c.id)} />
        ))}
      </div>

      {!owned && (
        <section className="container pb-24 text-center">
          <h2 className="font-['Montserrat'] text-3xl font-bold">Ready to start learning?</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/60">
            Get {courseLectures('ai-product').length} AI Product Management lectures plus {courseLectures('foundations').length} Product
            Management Foundations lectures included free.
          </p>
          <div className="mx-auto mt-8 max-w-sm">
            <BuyButton />
          </div>
        </section>
      )}
    </div>
  )
}
