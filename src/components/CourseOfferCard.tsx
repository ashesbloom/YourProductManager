import { Link } from 'react-router-dom'
import { ArrowRight, Check, Play } from 'lucide-react'
import { COURSE_INCLUDED, COURSES, courseLectures, formatINR } from '@/data/catalog'
import { useCheckout } from '@/lib/checkout'

const FREE_LECTURE = courseLectures('ai-product').find((l) => l.free)!

/** Buys the course, or links to the dashboard once it's owned. */
export function BuyButton({ className = '' }: { className?: string }) {
  const { buy, busy, error, owned, ready } = useCheckout()
  const cls = `flex min-h-14 items-center justify-center gap-2 rounded-full bg-brand px-6 py-4 text-lg font-extrabold text-white shadow-xl shadow-purple-900/30 transition hover:bg-brand-hover disabled:opacity-60 ${className}`
  if (owned) {
    return (
      <Link to="/dashboard" className={cls}>
        Go to your dashboard <ArrowRight size={20} />
      </Link>
    )
  }
  return (
    <div>
      <button type="button" onClick={buy} disabled={busy || !ready} className={`${cls} w-full`}>
        {busy ? 'Opening checkout…' : 'Buy course'} {!busy && <ArrowRight size={20} />}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}

/** Price block: launch price, strike-through and saving. */
export function PriceBlock({ product }: { product: { pricePaise: number; oldPricePaise: number } }) {
  const save = Math.round((1 - product.pricePaise / product.oldPricePaise) * 100)
  return (
    <div className="rounded-xl border-2 border-accent/40 bg-accent/[0.06] p-4 text-center md:p-5">
      <p className="text-xs font-extrabold uppercase tracking-wider text-accent/80 md:text-sm">Founding launch price · Including GST</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <span className="text-xl text-white/40 line-through md:text-2xl">{formatINR(product.oldPricePaise)}</span>
        <span className="font-['Montserrat'] text-4xl font-extrabold text-accent md:text-5xl">{formatINR(product.pricePaise)}</span>
      </div>
      <span className="mt-3 inline-flex rounded-full bg-accent px-4 py-2 text-sm font-extrabold uppercase tracking-wide text-black md:text-base">
        Save {save}% · Limited-time offer
      </span>
    </div>
  )
}

/** The homepage course card (Khushbu's Appendix A). */
export function CourseOfferCard() {
  const { product } = useCheckout()
  const tile = 'block rounded-xl p-4 transition-colors'
  return (
    <div className="relative overflow-hidden rounded-2xl border border-purple-400/40 bg-linear-to-br from-black via-purple-950/30 to-black p-4 shadow-xl shadow-purple-900/20 md:p-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-md bg-accent px-3 py-2 text-xs font-extrabold uppercase tracking-wider text-black">★ Founding launch price</span>
        <span className="rounded-full border border-red-400/50 bg-red-500/10 px-3 py-2 text-xs font-bold uppercase text-red-300">Limited-time offer</span>
      </div>

      <div className="grid gap-x-8 gap-y-4 lg:grid-cols-[1fr_minmax(0,24rem)]">
        <div>
          <h3 className="mb-4 font-['Montserrat'] text-3xl font-extrabold leading-tight text-white md:text-4xl">{product.title}</h3>

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link to="/courses#ai-product" className={`${tile} border border-purple-400/40 bg-purple-500/10 hover:bg-purple-500/20`}>
              <p className="mb-1 text-2xl font-extrabold text-white md:text-3xl">{courseLectures('ai-product').length} Lectures</p>
              <p className="text-sm font-semibold text-purple-200 md:text-base">{COURSES['ai-product'].title}</p>
            </Link>
            <Link to="/courses#foundations" className={`${tile} border-2 border-accent/70 bg-accent/[0.08] hover:bg-accent/[0.14]`}>
              <p className="mb-1 text-2xl font-extrabold text-accent md:text-3xl">{courseLectures('foundations').length} Lectures FREE</p>
              <p className="text-sm font-semibold text-white md:text-base">Foundational Product Management</p>
            </Link>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3 md:p-4">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-purple-300">What's included</h4>
            <ul className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
              {COURSE_INCLUDED.map(({ strong, text }) => (
                <li key={text} className="flex items-start gap-2 text-sm text-white">
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

        <div className="flex flex-col justify-end gap-3">
          <PriceBlock product={product} />
          <BuyButton />
          <Link
            to={`/learn/ai-product/${FREE_LECTURE.id}`}
            className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-purple-400/50 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-500/10"
          >
            <Play size={15} fill="currentColor" /> Watch first lecture free
          </Link>
        </div>
      </div>
    </div>
  )
}
