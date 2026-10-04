import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react'
import { courseLectures, formatINR, PRODUCTS } from '@/data/catalog'

type CourseCard = {
  id: string
  leftLabel: string
  leftIcon: 'book' | 'sparkle'
  theme: 'light' | 'dark'
  badge: string
  title: string
  note?: string
}

const courses: CourseCard[] = [
  {
    id: 'foundations',
    leftLabel: 'FOUNDATION COURSE',
    leftIcon: 'book',
    theme: 'light',
    badge: 'FOUNDING PRICE',
    title: 'PRODUCT MANAGEMENT\n(FOUNDATIONS)',
    note: 'Recorded lectures only, self-paced format',
  },
  {
    id: 'ai-product',
    leftLabel: 'FOUNDING PROGRAM',
    leftIcon: 'sparkle',
    theme: 'dark',
    badge: 'FOUNDING PRICE',
    title: 'AI PRODUCT MANAGEMENT',
    note: 'No live mentoring, no 1:1 support, no placement guarantees',
  },
]

function LeftIcon({ type, className }: { type: CourseCard['leftIcon']; className?: string }) {
  if (type === 'sparkle') return <Sparkles className={className} size={54} />
  return <BookOpen className={className} size={54} />
}

function CourseCardRow({ course }: { course: CourseCard }) {
  const isDark = course.theme === 'dark'
  const product = PRODUCTS[course.id]
  const lectures = courseLectures(course.id)
  const freeCount = lectures.filter((l) => l.free).length

  return (
    <div data-reveal
      id={course.id}
      className={
        isDark
          ? 'rounded-[2rem] overflow-hidden border border-white/10 bg-[#0a0a0f] shadow-2xl'
          : 'rounded-[2rem] overflow-hidden border border-purple-200/60 bg-white shadow-2xl'
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-[360px_1fr]">
        {/* Left panel */}
        <div
          className={
            isDark
              ? 'bg-linear-to-br from-purple-700/80 to-purple-900/30 flex flex-col items-center justify-center px-10 py-14'
              : 'bg-linear-to-br from-purple-600/15 to-purple-700/5 flex flex-col items-center justify-center px-10 py-14'
          }
        >
          <LeftIcon
            type={course.leftIcon}
            className={isDark ? 'text-[#FBBF24]' : 'text-[#7c3aed]'}
          />
          <div
            className={
              isDark
                ? 'mt-6 text-[#FBBF24] font-black tracking-[0.25em] text-sm'
                : 'mt-6 text-[#7c3aed] font-black tracking-[0.25em] text-sm'
            }
          >
            {course.leftLabel}
          </div>
        </div>

        {/* Right panel */}
        <div className={isDark ? 'px-10 py-12 text-white' : 'px-10 py-12 text-[#0a0a0f]'}>
          <div className="flex items-center justify-between gap-6">
            <span
              className={
                isDark
                  ? 'inline-flex items-center px-4 py-1.5 rounded-full bg-[#FBBF24]/15 text-[#FBBF24] text-xs font-black tracking-widest'
                  : 'inline-flex items-center px-4 py-1.5 rounded-full bg-purple-600/10 text-[#7c3aed] text-xs font-black tracking-widest'
              }
            >
              {course.badge}
            </span>
            {isDark ? (
              <span className="inline-flex items-center px-4 py-2 rounded-bl-2xl rounded-tr-2xl bg-[#7c3aed] text-white text-sm font-bold tracking-wider">
                ⭐ BEST VALUE
              </span>
            ) : null}
          </div>

          <h1 className={isDark ? 'mt-6 text-4xl font-black leading-tight' : 'mt-6 text-4xl font-black leading-tight'}>
            {course.title.split('\n').map((line, idx) => (
              <span key={idx} className="block">
                {line}
              </span>
            ))}
          </h1>

          <div className={isDark ? 'mt-6 flex items-center gap-8 text-white/70' : 'mt-6 flex items-center gap-8 text-gray-500'}>
            <div className="flex items-center gap-2">
              <BookOpen size={18} className={isDark ? 'text-white/60' : 'text-gray-500'} />
              <span>{lectures.length} Lectures</span>
            </div>
            <div className={isDark ? 'text-green-400 font-semibold' : 'text-green-600 font-semibold'}>
              {freeCount} Free {freeCount === 1 ? 'Lecture' : 'Lectures'}
            </div>
          </div>

          <div className={isDark ? 'mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-[#FBBF24]/70' : 'mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-[#7c3aed]'}>
            {product.priceLabel}
          </div>
          <div className="mt-2 flex items-end gap-4 flex-wrap">
            <span className={isDark ? 'text-white/30 line-through text-xl font-semibold' : 'text-gray-400 line-through text-xl font-semibold'}>
              {formatINR(product.oldPricePaise)}
            </span>
            <span className={isDark ? 'text-[#FBBF24] text-4xl font-black' : 'text-[#0a0a0f] text-4xl font-black'}>
              {formatINR(product.pricePaise)}
            </span>
            <span className={isDark ? 'text-white/50 text-sm font-semibold' : 'text-gray-400 text-sm font-semibold'}>
              (incl. GST)
            </span>
          </div>


          {course.note ? (
            <div className={isDark ? 'mt-3 text-white/45 text-xs' : 'mt-3 text-gray-400 text-xs'}>
              {course.note}
            </div>
          ) : null}

          <div className="mt-10">
            <Link
              to={`/courses/${course.id}`}
              className={
                isDark
                  ? 'btn-purple-animated inline-flex items-center gap-4 px-10 py-4 rounded-full text-white font-bold shadow-2xl shadow-purple-500/30 transition-all'
                  : 'inline-flex items-center gap-4 px-10 py-4 rounded-full bg-white text-[#7c3aed] font-bold border-2 border-[#7c3aed] hover:bg-[#7c3aed] hover:text-white transition-all'
              }
            >
              View Course
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Courses() {
  return (
    <div className="bg-black">
      <section className="pt-28 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-14">
            {courses.map((course) => (
              <CourseCardRow key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
