import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react'
import { COURSES, courseLectures, formatINR, PRODUCTS } from '@/data/catalog'

// One course on sale; the Foundations course comes free with it.
const product = PRODUCTS['ai-product']

function CourseCard() {
  const lectures = courseLectures(product.id)
  const freeCount = lectures.filter((l) => l.free).length

  return (
    <div data-reveal id={product.id} className="rounded-[2rem] overflow-hidden border border-white/10 bg-[#0a0a0f] shadow-2xl">
      <div className="grid grid-cols-1 md:grid-cols-[360px_1fr]">
        <div className="bg-brand flex flex-col items-center justify-center px-10 py-14">
          <Sparkles className="text-[#FBBF24]" size={54} />
          <div className="mt-6 text-[#FBBF24] font-black tracking-[0.25em] text-sm">FULL COURSE</div>
        </div>

        <div className="px-10 py-12 text-white">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#FBBF24]/15 text-[#FBBF24] text-xs font-black tracking-widest">
            FOUNDING PRICE
          </span>

          <h1 className="mt-6 text-4xl font-black leading-tight">AI PRODUCT MANAGEMENT</h1>

          <div className="mt-6 flex items-center gap-8 text-white/70">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-white/60" />
              <span>{lectures.length} Lectures</span>
            </div>
            <div className="text-green-400 font-semibold">
              {freeCount} Free {freeCount === 1 ? 'Lecture' : 'Lectures'}
            </div>
          </div>

          <div className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-[#FBBF24]/70">{product.priceLabel}</div>
          <div className="mt-2 flex items-end gap-4 flex-wrap">
            <span className="text-white/30 line-through text-xl font-semibold">{formatINR(product.oldPricePaise)}</span>
            <span className="text-[#FBBF24] text-4xl font-black">{formatINR(product.pricePaise)}</span>
            <span className="text-white/50 text-sm font-semibold">(incl. GST)</span>
          </div>

          <div className="mt-3 text-white/45 text-xs">{COURSES.foundations.title} included free</div>

          <div className="mt-10">
            <Link
              to={`/courses/${product.id}`}
              className="inline-flex items-center gap-4 px-10 py-4 rounded-full bg-brand text-white font-bold transition-colors hover:bg-brand-hover"
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
      <section className="pt-28 pb-20">
        <div className="container">
          <CourseCard />
        </div>
      </section>
    </div>
  )
}
