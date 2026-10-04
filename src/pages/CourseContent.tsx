import { Link, Navigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, CirclePlay, Lock, Star } from 'lucide-react'
import { COURSES, PRODUCTS, courseLectures, formatINR, lookup, type Lecture } from '@/data/catalog'

const fadeIn = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

// Page copy per course. Prices and lectures come from the catalog.
type CoursePage = {
  priceMeta: string
  enrollNote: string
  includedFree: Array<{ title: string; description: string }>
}

const FREE_NOTICE =
  'Free lectures are provided to help you understand the fundamentals and teaching\napproach before enrolling.'
const FORMAT = ['Lecture-based', 'Recorded and self-paced', 'For independent learners', 'Lifetime access']

const PAGES: Record<string, CoursePage> = {
  'ai-product': {
    priceMeta: '(incl. GST) • Launch Price',
    enrollNote: 'Founding price available for early learners only',
    includedFree: [
      { title: 'Interview Ready', description: '3 simulated 1:1 PM interviews (1hr each) + project review' },
      { title: 'Elite Presence', description: 'LinkedIn & resume optimization for AI PM hiring' },
    ],
  },
  foundations: {
    priceMeta: '(incl. GST) • Introductory Price',
    enrollNote: 'Founding price available for early learners only',
    includedFree: [
      { title: 'Interview Ready', description: '3 simulated 1:1 PM interviews (1hr each) + project review' },
      { title: 'Elite Presence', description: 'LinkedIn & resume optimization for PM hiring' },
    ],
  },
}

function LectureRow({ lecture }: { lecture: Lecture }) {
  const isFree = lecture.free

  return (
    <div
      className={
        isFree
          ? 'rounded-2xl border border-green-200/60 bg-green-50/60 px-5 py-4 flex items-center justify-between gap-4'
          : 'rounded-2xl border border-gray-200/70 bg-gray-50/40 px-5 py-4 flex items-center justify-between gap-4'
      }
    >
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={
            isFree
              ? 'w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0'
              : 'w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0'
          }
        >
          {isFree ? <CirclePlay size={18} className="text-green-600" /> : <Lock size={18} className="text-gray-400" />}
        </div>
        <div className="min-w-0">
          <div className={isFree ? 'font-bold text-[#0a0a0f] truncate' : 'font-bold text-gray-600 truncate'}>
            {lecture.title}
          </div>
          {isFree ? <div className="text-xs text-green-600 font-semibold">Free Preview</div> : null}
        </div>
      </div>

      {isFree ? (
        <button className="btn-purple-animated shrink-0 inline-flex items-center justify-center px-5 h-10 rounded-full text-primary-foreground font-bold">
          Watch Free
        </button>
      ) : (
        <div className="shrink-0 inline-flex items-center gap-2 px-4 h-9 rounded-full bg-white border border-gray-200 text-gray-500 text-xs font-semibold">
          Locked
        </div>
      )}
    </div>
  )
}

export default function CourseContent() {
  const { courseId } = useParams()
  const course = lookup(COURSES, courseId)
  const page = lookup(PAGES, courseId)
  if (!course || !page) return <Navigate to="/courses" replace />
  const product = PRODUCTS[course.id]
  const lectures = courseLectures(course.id)
  const lockedCount = lectures.filter((l) => !l.free).length

  return (
    <div className="bg-white">
      <section className="pt-28 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
            {/* Left: Course content */}
            <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ duration: 0.4 }}>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#7c3aed]">Course content</p>
              <h1 className="mt-2 text-3xl md:text-4xl font-black text-[#0a0a0f]">{course.title}</h1>

              <div className="mt-8 rounded-2xl border border-green-200/60 bg-green-50/60 px-6 py-5 text-green-700 font-semibold text-sm leading-relaxed">
                {FREE_NOTICE}
              </div>

              <div className="mt-8 space-y-4">
                {lectures.map((lecture) => (
                  <LectureRow key={lecture.id} lecture={lecture} />
                ))}
                {lockedCount > 0 ? (
                  <p className="pt-2 text-center text-sm text-gray-400">Enroll to unlock all {lectures.length} lectures</p>
                ) : null}
              </div>

              <div className="mt-10">
                <Link to="/courses" className="text-primary font-bold">
                  ← Back to Courses
                </Link>
              </div>
            </motion.div>

            {/* Right: Sidebar */}
            <motion.aside
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="space-y-6"
            >
              {/* Enroll card */}
              <div className="rounded-2xl border border-gray-200/70 bg-white shadow-[0_10px_30px_-20px_rgba(0,0,0,0.18)] p-6">
                <div className="font-black text-[#0a0a0f]">Enroll Now</div>

                <div className="mt-4">
                  <div className="text-gray-400 line-through font-semibold">{formatINR(product.oldPricePaise)}</div>
                  <div className="text-4xl font-black text-[#0a0a0f]">{formatINR(product.pricePaise)}</div>
                  <div className="mt-1 text-sm text-gray-500 font-medium">{page.priceMeta}</div>
                </div>

                <button className="btn-purple-animated mt-6 w-full h-12 rounded-xl text-primary-foreground font-bold hover:opacity-90 transition-opacity">
                  Enroll in Course
                </button>

                <div className="mt-5 text-center text-sm text-gray-400">{page.enrollNote}</div>
              </div>

              {/* Included free */}
              <div className="rounded-2xl bg-[#0a0a0f] border border-white/10 shadow-2xl p-6">
                <div className="text-white font-black">Included FREE</div>

                <div className="mt-5 space-y-5">
                  {page.includedFree.map((item) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <div className="mt-0.5 w-8 h-8 rounded-lg bg-[#FBBF24]/15 flex items-center justify-center shrink-0">
                        <Star size={16} className="text-[#FBBF24]" />
                      </div>
                      <div>
                        <div className="text-[#FBBF24] font-bold">{item.title}</div>
                        <div className="text-white/60 text-sm leading-relaxed">{item.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Course format */}
              <div className="rounded-2xl border border-gray-200/70 bg-white shadow-[0_10px_30px_-20px_rgba(0,0,0,0.18)] p-6">
                <div className="font-black text-[#0a0a0f]">Course Format</div>
                <div className="mt-5 space-y-3">
                  {FORMAT.map((line) => (
                    <div key={line} className="flex items-center gap-3 text-gray-600 font-semibold">
                      <CheckCircle2 size={18} className="text-green-600" />
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </section>
    </div>
  )
}
