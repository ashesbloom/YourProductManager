import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CheckCircle2, CirclePlay, Lock, Star } from 'lucide-react'
import { COURSES, PRODUCTS, courseLectures, formatINR, lookup, type Lecture } from '@/data/catalog'
import { api, ApiError, loadScript } from '@/lib/api'
import { useMe } from '@/lib/me'

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

function LectureRow({ courseId, lecture }: { courseId: string; lecture: Lecture }) {
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
        <Link
          to={`/learn/${courseId}/${lecture.id}`}
          className="btn-purple-animated shrink-0 inline-flex items-center justify-center px-5 h-10 rounded-full text-primary-foreground font-bold"
        >
          Watch Free
        </Link>
      ) : (
        <div className="shrink-0 inline-flex items-center gap-2 px-4 h-9 rounded-full bg-white border border-gray-200 text-gray-500 text-xs font-semibold">
          Locked
        </div>
      )}
    </div>
  )
}

type CheckoutOrder = { orderId: string; amount: number; keyId: string; name: string; prefill: { email: string; name: string } }
type RazorpayResult = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
type RazorpayCheckout = { open: () => void; on: (event: 'payment.failed', cb: () => void) => void }
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout
  }
}

const ENROLL_CLASS =
  'btn-purple-animated mt-6 inline-flex w-full h-12 items-center justify-center rounded-xl text-primary-foreground font-bold hover:opacity-90 transition-opacity disabled:opacity-60'

function EnrollButton({ courseId }: { courseId: string }) {
  const { data: me, isPending } = useMe()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (me?.enrollments.includes(courseId)) {
    return (
      <Link to={`/learn/${courseId}`} className={ENROLL_CLASS}>
        Go to course
      </Link>
    )
  }

  async function enroll() {
    if (!me?.user) {
      navigate(`/login?next=${encodeURIComponent(`/courses/${courseId}`)}`)
      return
    }
    setBusy(true)
    setError('')
    try {
      const [order] = await Promise.all([
        api<CheckoutOrder>('/api/checkout', { productId: courseId }),
        loadScript('https://checkout.razorpay.com/v1/checkout.js'),
      ])
      if (!window.Razorpay) throw new Error('Checkout unavailable')
      const checkout = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: 'INR',
        name: 'Your Product Manager',
        description: order.name,
        prefill: order.prefill,
        theme: { color: '#8b5cf6' },
        handler: async (result: RazorpayResult) => {
          try {
            const { status } = await api<{ status: string }>('/api/checkout/verify', result)
            if (status !== 'paid') throw new Error(status)
            await queryClient.invalidateQueries({ queryKey: ['me'] })
            navigate(`/learn/${courseId}`)
          } catch {
            setError('Payment received, but access is still being set up. Refresh in a minute; if it persists, contact support with your payment ID.')
            setBusy(false)
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      })
      checkout.on('payment.failed', () => setError('The payment did not go through. Please try again or use another method.'))
      checkout.open()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start checkout. Please try again.')
      setBusy(false)
    }
  }

  return (
    <>
      <button type="button" onClick={enroll} disabled={busy || isPending} className={ENROLL_CLASS}>
        {busy ? 'Opening checkout…' : 'Enroll in Course'}
      </button>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </>
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
                  <LectureRow key={lecture.id} courseId={course.id} lecture={lecture} />
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

                <EnrollButton courseId={course.id} />

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
