import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import cover from '@/assets/book-cover.avif'
import { BOOK, BOOK_PAGES, KINDLE_URL, type BookPage } from '@/data/book'

const NAVY = '#0f2a5c'
const NARROW = '(max-width: 639px)'

// Faces in reading order: a title page (the inside of the cover), the sample pages, then a Kindle
// page. Leaf 0 is the cover; leaf i (i ≥ 1) carries face 2i-1 on its front and face 2i on its back.
type Face = { node: ReactNode }
const FACES: Face[] = [
  { node: <TitlePage /> },
  ...BOOK_PAGES.map((p, i) => ({ node: <PageBody page={p} number={i + 1} /> })),
  { node: <KindlePage number={BOOK_PAGES.length + 1} /> },
]
const LEAVES = Array.from({ length: 1 + Math.ceil((FACES.length - 1) / 2) }, (_, i) =>
  i === 0 ? { front: 'cover' as const, back: 0 } : { front: 2 * i - 1, back: 2 * i < FACES.length ? 2 * i : -1 }
)
// How many leaves can be turned: the last spread keeps the final page on the right if it has no back.
const MAX_TURNED = LEAVES[LEAVES.length - 1].back === -1 ? LEAVES.length - 1 : LEAVES.length

// Each view is one stop of the prev/next controls. Wide screens show spreads; phones one page at a time.
type View = { turned: number; side: 'both' | 'left' | 'right' }
const SPREADS: View[] = Array.from({ length: MAX_TURNED + 1 }, (_, t) => ({ turned: t, side: 'both' }))
const SINGLES: View[] = [{ turned: 0, side: 'right' }]
for (let t = 1; t <= MAX_TURNED; t++) {
  SINGLES.push({ turned: t, side: 'left' })
  if (t < LEAVES.length) SINGLES.push({ turned: t, side: 'right' })
}

function Paper({ side, hidden, children }: { side: 'left' | 'right'; hidden: boolean; children: ReactNode }) {
  return (
    <div
      aria-hidden={hidden}
      className="absolute inset-0 flex flex-col overflow-hidden bg-[#f5f3ee] px-[9%] py-[11%] font-['Georgia',serif] text-[calc(var(--w)*0.049)] text-[#23252f] backface-hidden"
    >
      {children}
      {/* Gutter shadow on the spine side. */}
      <div
        className={`pointer-events-none absolute inset-y-0 w-[14%] from-black/20 to-transparent ${
          side === 'right' ? 'left-0 bg-linear-to-r' : 'right-0 bg-linear-to-l'
        }`}
      />
    </div>
  )
}

function TitlePage() {
  return (
    <div className="my-auto text-center">
      <p className="font-['Playfair_Display'] text-[1.45em] font-bold leading-tight">{BOOK.title}</p>
      <p className="mx-auto mt-[0.9em] max-w-[16em] text-[0.9em] italic leading-snug text-black/60">{BOOK.subtitle}</p>
      <p className="mt-[3em] text-[0.8em] uppercase tracking-[0.2em] text-black/55">Khushbu Sharma</p>
    </div>
  )
}

function Folio({ number }: { number: number }) {
  return <span className="mt-auto pt-4 text-center text-[0.75em] text-black/40">{number}</span>
}

function PageBody({ page, number }: { page: BookPage; number: number }) {
  return (
    <>
      {page.quote ? (
        <blockquote className="my-auto font-['Playfair_Display'] text-[1.35em] italic leading-snug">
          {page.body.map((line) => (
            <p key={line} className="mt-3 first:mt-0">{line}</p>
          ))}
        </blockquote>
      ) : (
        <>
          {page.heading && (
            <h4 className="font-['Playfair_Display'] text-[1.3em] font-bold leading-tight">{page.heading}</h4>
          )}
          {page.body.map((para) => (
            <p key={para} className="mt-[1em] leading-[1.65]">{para}</p>
          ))}
        </>
      )}
      <Folio number={number} />
    </>
  )
}

function KindlePage({ number }: { number: number }) {
  return (
    <>
      <div className="my-auto text-center">
        <h4 className="font-['Playfair_Display'] text-[1.3em] font-bold leading-tight">Keep reading</h4>
        <p className="mt-[0.8em] leading-[1.6]">The full book is on Kindle.</p>
        <a
          href={KINDLE_URL}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="mt-[1.4em] inline-flex items-center gap-x-1.5 rounded-full px-[1.2em] py-[0.6em] font-sans text-[0.95em] font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: NAVY }}
        >
          Read on Kindle
          <ArrowUpRight size={14} />
        </a>
      </div>
      <Folio number={number} />
    </>
  )
}

function useNarrow() {
  const [narrow, setNarrow] = useState(() => window.matchMedia(NARROW).matches)
  useEffect(() => {
    const m = window.matchMedia(NARROW)
    const on = () => setNarrow(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return narrow
}

/**
 * The book in CSS 3D. Closed it stands angled and tilts with the mouse; open it lies flat and the
 * pages turn on the spine. `compact` is the small closed copy (About page): no opening, no controls.
 * Otherwise it opens once ~75% of it scrolls into view and closes again when scrolled back above.
 */
export function Book3D({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  const narrow = useNarrow()
  const views = narrow ? SINGLES : SPREADS
  const [index, setIndex] = useState(0)
  const view = views[Math.min(index, views.length - 1)]
  const open = view.turned > 0
  const stageRef = useRef<HTMLDivElement>(null)
  const tiltRef = useRef<HTMLDivElement>(null)
  const swipe = useRef<{ x: number; moved: boolean } | null>(null)

  const go = (step: number) => setIndex((i) => Math.max(0, Math.min(views.length - 1, Math.min(i, views.length - 1) + step)))

  useEffect(() => {
    if (compact) return
    const trigger = ScrollTrigger.create({
      trigger: stageRef.current,
      start: '75% bottom',
      onEnter: () => setIndex((i) => i || 1),
      onLeaveBack: () => setIndex(0),
    })
    return () => trigger.kill()
  }, [compact])

  // An open book lies still; the tilt is only for the closed one.
  useEffect(() => {
    if (open && tiltRef.current) tiltRef.current.style.transform = ''
  }, [open])

  // Where the spine sits, in page widths from the stage's left edge.
  const shift = narrow || compact ? (view.side === 'left' ? 1 : 0) : open ? 1 : 0.5
  const visible = (face: number) =>
    open &&
    ((view.side !== 'right' && face === LEAVES[view.turned - 1].back) ||
      (view.side !== 'left' && view.turned < LEAVES.length && face === LEAVES[view.turned].front))

  const pageNo = (face: number) => (face >= 1 ? face : null)
  const shown = [
    view.side !== 'right' ? pageNo(LEAVES[view.turned - 1]?.back ?? -1) : null,
    view.side !== 'left' && view.turned < LEAVES.length ? pageNo(LEAVES[view.turned].front as number) : null,
  ].filter((n): n is number => n !== null && n > 0)
  const total = FACES.length - 1

  return (
    <div
      className={`${
        compact
          ? '[--w:150px]'
          : '[--w:min(78vw,300px)] sm:[--w:280px] lg:[--w:min(300px,calc((100vw-2*var(--gutter)-4rem)*7/24))]'
      } [--h:calc(var(--w)*1.56)] [--t:calc(var(--w)*0.1)] ${className}`}
    >
      <div
        ref={stageRef}
        tabIndex={compact ? undefined : 0}
        role={compact ? 'img' : 'region'}
        aria-roledescription={compact ? undefined : 'book'}
        aria-label={compact ? `${BOOK.title} by Khushbu Sharma` : `${BOOK.title}: sample pages`}
        className={`relative mx-auto h-(--h) w-(--w) touch-pan-y select-none outline-none [perspective:1800px] focus-visible:ring-2 focus-visible:ring-primary/60 ${
          compact ? '' : 'sm:w-[calc(var(--w)*2)]'
        } ${!compact && !open ? 'cursor-pointer' : ''} ${open ? 'max-sm:overflow-hidden' : ''}`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); go(1) }
          if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
        }}
        onPointerMove={(e) => {
          const s = swipe.current
          if (s && Math.abs(e.clientX - s.x) > 8) s.moved = true
          if (open || e.pointerType !== 'mouse' || !tiltRef.current) return
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
          const r = e.currentTarget.getBoundingClientRect()
          const x = (e.clientX - r.left) / r.width - 0.5
          const y = (e.clientY - r.top) / r.height - 0.5
          tiltRef.current.style.transform = `rotateX(${(-y * 10).toFixed(2)}deg) rotateY(${(x * 16).toFixed(2)}deg)`
        }}
        onPointerLeave={() => {
          if (tiltRef.current) tiltRef.current.style.transform = ''
        }}
        onPointerDown={(e) => {
          if (!compact) swipe.current = { x: e.clientX, moved: false }
        }}
        onPointerUp={(e) => {
          const s = swipe.current
          if (s?.moved && Math.abs(e.clientX - s.x) > 40) go(e.clientX < s.x ? 1 : -1)
        }}
        onClick={(e) => {
          const s = swipe.current
          swipe.current = null
          if (compact || s?.moved) return
          if (!open) return go(1)
          // Like a real book: the left half goes back, the right half goes forward.
          const r = e.currentTarget.getBoundingClientRect()
          go(e.clientX < r.left + r.width / 2 ? -1 : 1)
        }}
      >
        {/* Floor shadow and a faint brand glow, outside the 3D context. */}
        <div className="pointer-events-none absolute -bottom-5 left-1/2 h-8 w-[70%] -translate-x-1/2 rounded-full bg-black/70 blur-2xl" />
        {!compact && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/20 blur-[90px]" />
        )}

        <div ref={tiltRef} className="absolute inset-0 transition-transform duration-500 ease-out transform-3d">
          <div
            className="absolute left-0 top-0 h-(--h) w-(--w) transition-transform duration-[900ms] ease-[cubic-bezier(.45,.05,.2,1)] transform-3d motion-reduce:transition-none"
            style={{ transform: `translateX(calc(var(--w) * ${shift})) rotateY(${open ? 0 : 28}deg)` }}
          >
            {/* Back board: the endpaper shows on the right once every leaf is turned. */}
            <div className="absolute inset-0 rounded-r-[3px]" style={{ background: NAVY, transform: 'translateZ(calc(var(--t) / -2))' }} />
            {/* Spine. Vertical text on the spans only: on the box, py-* (padding-block) would widen it. */}
            <div
              className="absolute top-0 flex h-full w-(--t) flex-col items-center justify-between py-[12%] [&>span]:[writing-mode:vertical-rl]"
              style={{ left: 'calc(var(--t) / -2)', background: NAVY, transform: 'rotateY(-90deg)' }}
            >
              <span className="font-['Playfair_Display'] text-[calc(var(--t)*0.3)] uppercase tracking-[0.08em] text-[#e2c58f]">
                {BOOK.title}
              </span>
              <span className="font-['Playfair_Display'] text-[calc(var(--t)*0.26)] uppercase tracking-[0.1em] text-[#e2c58f]">
                Khushbu Sharma
              </span>
            </div>
            {/* Page edges, right and top. */}
            <div
              className="absolute top-[2px] h-[calc(100%-4px)] w-(--t) bg-[repeating-linear-gradient(90deg,#efebe2_0_1px,#d4cfc4_1px_2px)]"
              style={{ left: 'calc(var(--w) - var(--t) / 2 - 2px)', transform: 'rotateY(90deg)' }}
            />
            <div
              className="absolute left-0 h-(--t) w-[calc(100%-3px)] bg-[repeating-linear-gradient(0deg,#efebe2_0_1px,#d4cfc4_1px_2px)]"
              style={{ top: 'calc(var(--t) / -2 + 2px)', transform: 'rotateX(90deg)' }}
            />

            {(compact ? LEAVES.slice(0, 1) : LEAVES).map((leaf, i) => {
              const turned = i < view.turned
              const z = turned ? i * 0.5 : -i * 0.5
              return (
                <div
                  key={i}
                  className="absolute inset-0 origin-left transition-transform duration-[900ms] ease-[cubic-bezier(.45,.05,.2,1)] transform-3d motion-reduce:transition-none"
                  style={{ transform: `translateZ(calc(var(--t) / 2 + ${z}px)) rotateY(${turned ? -180 : 0}deg)` }}
                >
                  {leaf.front === 'cover' ? (
                    <img
                      src={cover}
                      alt=""
                      draggable={false}
                      className="absolute inset-0 h-full w-full rounded-r-[3px] object-cover backface-hidden"
                    />
                  ) : (
                    <Paper side="right" hidden={!visible(leaf.front)}>{FACES[leaf.front]?.node}</Paper>
                  )}
                  <div
                    className="absolute inset-0 backface-hidden"
                    style={{ transform: 'rotateY(180deg)' }}
                  >
                    {leaf.back === -1 ? (
                      <div className="absolute inset-0" style={{ background: NAVY }} />
                    ) : (
                      <Paper side="left" hidden={!visible(leaf.back)}>{FACES[leaf.back]?.node}</Paper>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {!compact && (
        <div className="mt-10 flex items-center justify-center gap-x-3">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={!open}
            aria-label="Previous page"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/75 transition-colors hover:border-primary/60 hover:text-white disabled:pointer-events-none disabled:opacity-0"
          >
            <ChevronLeft size={20} />
          </button>
          <button type="button" onClick={() => setIndex(open ? 0 : 1)} className="btn-secondary min-w-[10.5rem]">
            {open ? 'Close book' : 'Look inside'}
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={!open || index >= views.length - 1}
            aria-label="Next page"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/75 transition-colors hover:border-primary/60 hover:text-white disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRight size={20} />
          </button>
          <span className="sr-only" aria-live="polite">
            {!open ? 'Book closed' : shown.length ? `Page ${shown.join(' and ')} of ${total}` : 'Title page'}
          </span>
        </div>
      )}
    </div>
  )
}
