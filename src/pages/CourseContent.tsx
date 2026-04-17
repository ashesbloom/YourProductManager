import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, CirclePlay, Lock, Star } from 'lucide-react'

const fadeIn = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

type Lecture = {
  title: string
  status: 'free' | 'locked'
}

type CourseContentData = {
  id: string
  title: string
  oldPrice?: string
  price: string
  priceMeta: string
  enrollNote: string
  freeNotice: string
  freeCtaLabel: string
  lockedCountLabel: string
  lectures: Lecture[]
  includedFree: Array<{ title: string; description: string }>
  format: string[]
}

const COURSES: Record<string, CourseContentData> = {
  'ai-product': {
    id: 'ai-product',
    title: 'AI Product Management',
    oldPrice: '₹35,000',
    price: '₹7,999/-',
    priceMeta: '(incl. GST) • Founding Price',
    enrollNote: 'Founding price available for early learners only',
    freeNotice:
      'Free lectures are provided to help you understand the fundamentals and teaching\napproach before enrolling.',
    freeCtaLabel: 'Watch Free',
    lockedCountLabel: '+ 40 more lectures',
    lectures: [
      { title: 'Introduction to AI Product Management', status: 'free' },
      { title: 'What is an AI Product?', status: 'free' },
      { title: 'The AI Product Lifecycle', status: 'free' },
      { title: 'Understanding Machine Learning Basics', status: 'locked' },
      { title: 'AI Product Strategy Framework', status: 'locked' },
      { title: 'Identifying AI Opportunities', status: 'locked' },
      { title: 'Building AI Roadmaps', status: 'locked' },
      { title: 'Working with Data Teams', status: 'locked' },
      { title: 'AI Ethics and Responsibility', status: 'locked' },
      { title: 'AI Product Metrics', status: 'locked' },
    ],
    includedFree: [
      {
        title: 'Interview Ready',
        description: '3 simulated 1:1 PM interviews (1hr each) + project review',
      },
      {
        title: 'Elite Presence',
        description: 'LinkedIn & resume optimization for AI PM hiring',
      },
    ],
    format: ['Lecture-based', 'Recorded and self-paced', 'For independent learners', 'Lifetime access'],
  },
  foundations: {
    id: 'foundations',
    title: 'Product Management (Foundations)',
    oldPrice: '₹9,000',
    price: '₹2,300/-',
    priceMeta: '(incl. GST) • Founding Price',
    enrollNote: 'Founding price available for early learners only',
    freeNotice:
      'Free lectures are provided to help you understand the fundamentals and teaching\napproach before enrolling.',
    freeCtaLabel: 'Watch Free',
    lockedCountLabel: '+ 12 more lectures',
    lectures: [
      { title: 'What is Product Management?', status: 'free' },
      { title: 'Core PM Responsibilities', status: 'free' },
      { title: 'Problem vs Solution Thinking', status: 'free' },
      { title: 'User Research Fundamentals', status: 'locked' },
      { title: 'Prioritization Basics', status: 'locked' },
      { title: 'Writing Clear PRDs', status: 'locked' },
      { title: 'Stakeholder Communication', status: 'locked' },
    ],
    includedFree: [
      {
        title: 'Interview Ready',
        description: '3 simulated 1:1 PM interviews (1hr each) + project review',
      },
      {
        title: 'Elite Presence',
        description: 'LinkedIn & resume optimization for PM hiring',
      },
    ],
    format: ['Lecture-based', 'Recorded and self-paced', 'For independent learners', 'Lifetime access'],
  },
}

function LectureRow({ lecture, freeCtaLabel }: { lecture: Lecture; freeCtaLabel: string }) {
  const isFree = lecture.status === 'free'

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
          {isFree ? (
            <CirclePlay size={18} className="text-green-600" />
          ) : (
            <Lock size={18} className="text-gray-400" />
          )}
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
          {freeCtaLabel}
        </button>
      ) : (
        <div className="shrink-0 inline-flex items-center gap-2 px-4 h-9 rounded-full bg-white border border-gray-200 text-gray-500 text-xs font-semibold">
          <span className="text-[#FBBF24]">🔒</span>
          Locked
        </div>
      )}
    </div>
  )
}

export default function CourseContent() {
  const { courseId } = useParams()
  const course = (courseId && COURSES[courseId]) || COURSES['ai-product']

  return (
    <div className="bg-white">
      <section className="pt-28 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
            {/* Left: Course content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-3xl md:text-4xl font-black text-[#0a0a0f]">Course Content</h1>

              <div className="mt-8 rounded-2xl border border-green-200/60 bg-green-50/60 px-6 py-5 text-green-700 font-semibold text-sm leading-relaxed">
                {course.freeNotice}
              </div>

              <div className="mt-8 space-y-4">
                {course.lectures.map((lecture) => (
                  <LectureRow key={lecture.title} lecture={lecture} freeCtaLabel={course.freeCtaLabel} />
                ))}

                <div className="mt-6 rounded-2xl border border-gray-200/70 bg-white px-6 py-10 text-center">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Lock size={22} className="text-gray-400" />
                    </div>
                  </div>
                  <div className="mt-4 text-xl font-semibold text-gray-600">{course.lockedCountLabel}</div>
                  <div className="mt-2 text-sm text-gray-400">Enroll to access all locked lectures</div>
                </div>
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
                  {course.oldPrice ? (
                    <div className="text-gray-400 line-through font-semibold">{course.oldPrice}</div>
                  ) : null}
                  <div className="text-4xl font-black text-[#0a0a0f]">{course.price}</div>
                  <div className="mt-1 text-sm text-gray-500 font-medium">{course.priceMeta}</div>
                </div>

                <button className="btn-purple-animated mt-6 w-full h-12 rounded-xl text-primary-foreground font-bold hover:opacity-90 transition-opacity">
                  Enroll in Course
                </button>

                <div className="mt-5 text-center text-sm text-gray-400">{course.enrollNote}</div>
              </div>

              {/* Included free */}
              <div className="rounded-2xl bg-[#0a0a0f] border border-white/10 shadow-2xl p-6">
                <div className="text-white font-black">Included FREE</div>

                <div className="mt-5 space-y-5">
                  {course.includedFree.map((item) => (
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
                  {course.format.map((line) => (
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
