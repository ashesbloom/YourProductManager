import { useRef, useState, type ReactNode } from 'react'
import { Star, X } from 'lucide-react'
import { api, ApiError } from '@/lib/api'

const field =
  'block w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/35 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'
const label = 'mb-2 block text-sm font-semibold text-white/75'

/** A button that opens the "Write a review" form in a popup; the review is emailed to hello@. */
export function WriteReviewButton({ className, children }: { className: string; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | string>('idle')

  const open = () => {
    if (status === 'sent') setStatus('idle')
    dialog.current?.showModal()
  }

  return (
    <>
      <button type="button" onClick={open} className={className}>
        {children}
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="review-title"
        onClick={(e) => e.target === dialog.current && dialog.current.close()} // a click on the backdrop closes it
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-3xl border border-purple-400/30 bg-linear-to-br from-purple-950/80 via-[#0e0818] to-black p-0 text-white shadow-[0_30px_80px_-30px_rgba(124,58,237,0.8)] backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <h2 id="review-title" className="font-['Montserrat'] text-xl font-bold">
              {status === 'sent' ? 'Thank you!' : 'Write a review'}
            </h2>
            <button type="button" onClick={() => dialog.current?.close()} aria-label="Close" className="-m-2 rounded-lg p-2 text-white/60 hover:bg-white/5 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {status === 'sent' ? (
            <p className="mt-3 leading-relaxed text-white/65">Your review has reached Khushbu. Thanks for taking the time to share it.</p>
          ) : (
            <form
              className="mt-5 grid gap-4"
              onSubmit={async (e) => {
                e.preventDefault()
                if (!rating) return setStatus('Please choose a star rating.')
                const form = e.currentTarget
                setStatus('sending')
                try {
                  await api('/api/review', { ...Object.fromEntries(new FormData(form)), rating })
                  form.reset()
                  setRating(0)
                  setStatus('sent')
                } catch (err) {
                  setStatus(err instanceof ApiError ? err.message : 'Could not send. Please try again.')
                }
              }}
            >
              <div>
                <label htmlFor="rv-name" className={label}>Name</label>
                <input id="rv-name" name="name" required minLength={2} maxLength={80} autoComplete="name" className={`${field} h-12`} />
              </div>
              <div>
                <label htmlFor="rv-role" className={label}>Role or background</label>
                <input id="rv-role" name="role" required maxLength={80} placeholder="e.g. Fresher, non-tech or Product Analyst" className={`${field} h-12`} />
              </div>
              <fieldset>
                <legend className={label}>Rating</legend>
                <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <label key={n} className="cursor-pointer p-0.5" onMouseEnter={() => setHover(n)}>
                      <input type="radio" name="stars" value={n} checked={rating === n} onChange={() => setRating(n)} className="peer sr-only" />
                      <Star
                        size={28}
                        aria-label={`${n} star${n > 1 ? 's' : ''}`}
                        className={`rounded transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary ${n <= (hover || rating) ? 'fill-[#FBBF24] text-[#FBBF24]' : 'text-white/25'}`}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
              <div>
                <label htmlFor="rv-text" className={label}>Your review</label>
                <textarea id="rv-text" name="review" required minLength={10} maxLength={3000} rows={5} placeholder="What changed for you after learning with YPM?" className={`${field} py-3`} />
              </div>
              <div>
                <label htmlFor="rv-li" className={label}>
                  LinkedIn profile <span className="font-normal text-white/40">(optional)</span>
                </label>
                <input id="rv-li" name="linkedin" type="url" placeholder="https://www.linkedin.com/in/…" className={`${field} h-12`} />
              </div>
              {/* Honeypot: hidden from people, filled in by bots. */}
              <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
              <button type="submit" disabled={status === 'sending'} className="btn-primary h-12 justify-center disabled:opacity-60">
                {status === 'sending' ? 'Sending…' : 'Submit review'}
              </button>
              {status !== 'idle' && status !== 'sending' && (
                <p role="alert" className="text-sm text-red-300">
                  {status}
                </p>
              )}
            </form>
          )}
        </div>
      </dialog>
    </>
  )
}
