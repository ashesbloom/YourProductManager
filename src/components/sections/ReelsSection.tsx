import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Play, Volume2, VolumeX } from 'lucide-react'

type ReelPerson = { name: string; from: string; to: string; duration: string }
type Reel = ReelPerson &
  ({ kind: 'youtube'; id: string } | { kind: 'file'; src: string })

// Placeholder alumni data — swap in the real reels and transformations, no code changes needed.
const REELS: Reel[] = [
  {
    kind: 'file',
    src: '/Untitled video.mp4',
    name: 'Arjun S.',
    from: 'Software Engineer',
    to: 'AI PM · Series B',
    duration: '4 months',
  },
  {
    kind: 'youtube',
    id: 'REPLACE_WITH_SHORTS_ID_1',
    name: 'Meera P.',
    from: 'Business Analyst',
    to: 'Product Manager · Swiggy',
    duration: '6 months',
  },
  {
    kind: 'youtube',
    id: 'REPLACE_WITH_SHORTS_ID_2',
    name: 'Karthik R.',
    from: 'Associate PM',
    to: 'Senior PM · Razorpay',
    duration: '5 months',
  },
  {
    kind: 'youtube',
    id: 'REPLACE_WITH_SHORTS_ID_3',
    name: 'Neha G.',
    from: 'Senior PM',
    to: 'Group PM · Flipkart',
    duration: '7 months',
  },
]

const N = REELS.length
// How many cards fan out on each side. Caps at 2, and never enough to make one
// card ambiguously both -k and +k on the ring.
const FLANKS = Math.min(2, Math.floor((N - 1) / 2))

// Shortest signed distance on a ring, so the fan is full and symmetric at every index.
const offsetOf = (i: number, active: number) => {
  const d = (i - active + N) % N
  return d > N / 2 ? d - N : d
}

const LAYOUT = [
  { x: '0%', scale: 1, opacity: 1, z: 30 },
  { x: '85%', scale: 0.9, opacity: 0.55, z: 20 },
  { x: '155%', scale: 0.82, opacity: 0.28, z: 10 },
] as const

function placement(offset: number) {
  const step = LAYOUT[Math.min(Math.abs(offset), LAYOUT.length - 1)]
  const sign = Math.sign(offset)
  return {
    x: sign === 0 ? '0%' : `${sign * parseFloat(step.x)}%`,
    scale: step.scale,
    opacity: Math.abs(offset) > FLANKS ? 0 : step.opacity,
    zIndex: step.z,
  }
}

function Placeholder({ reel }: { reel: Reel }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary shadow-[0_0_30px_-6px_rgba(168,85,247,0.8)]">
        {reel.name.charAt(0)}
      </span>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/15">
        <Play size={18} className="ml-0.5 text-white/80" fill="currentColor" strokeWidth={0} />
      </span>
      <div className="hidden sm:block">
        <div className="font-['Montserrat'] text-base font-black uppercase tracking-wide text-white/90">
          {reel.name}
        </div>
        <div className="mt-1 font-['Montserrat'] text-[11px] font-black uppercase tracking-wide text-[#FBBF24]/80">
          {reel.to}
        </div>
      </div>
    </div>
  )
}

export function ReelsSection() {
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([])
  const frameRefs = useRef<Array<HTMLIFrameElement | null>>([])
  const [active, setActive] = useState(0)
  // YouTube slides only mount an iframe once centred, then stay mounted.
  const [mounted, setMounted] = useState<number[]>([])
  const [muted, setMuted] = useState(true)
  const reduceMotion = useReducedMotion()

  const go = (step: number) => setActive((a) => (a + step + N) % N)

  // Only the centred reel plays. Runs on index change only, so a manual pause stays paused.
  useEffect(() => {
    setMounted((prev) => (prev.includes(active) ? prev : [...prev, active]))

    videoRefs.current.forEach((video, i) => {
      if (!video) return
      if (i === active) void video.play().catch(() => {})
      else video.pause()
    })

    frameRefs.current.forEach((frame, i) => {
      frame?.contentWindow?.postMessage(
        JSON.stringify({
          event: 'command',
          func: i === active ? 'playVideo' : 'pauseVideo',
          args: [],
        }),
        '*'
      )
    })
  }, [active, mounted])

  return (
    <section className="pb-24 overflow-hidden [--reel-w:264px] md:[--reel-w:338px]">
      <h2 data-reveal className="container mb-12 font-['Montserrat'] text-3xl font-bold tracking-tight text-white md:text-4xl">
        Success stories
      </h2>

      <div
        className="relative mx-auto flex h-[calc(var(--reel-w)*16/9)] max-w-5xl items-center justify-center"
        role="region"
        aria-roledescription="carousel"
        aria-label="Video testimonials"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
          if (e.key === 'ArrowRight') { e.preventDefault(); go(1) }
        }}
      >
        {/* Purple glow behind the lit reel — same idiom as the page's background orbs. */}
        <div className="pointer-events-none absolute h-[26rem] w-[26rem] rounded-full bg-primary/20 blur-3xl" />

        <motion.div
          className="relative h-full w-[var(--reel-w)]"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.x < -50 || info.velocity.x < -300) go(1)
            else if (info.offset.x > 50 || info.velocity.x > 300) go(-1)
          }}
        >
          {REELS.map((reel, i) => {
            const offset = offsetOf(i, active)
            const isActive = offset === 0
            const key = reel.kind === 'file' ? reel.src : reel.id

            return (
              <motion.div
                key={key}
                className={`absolute inset-0 cursor-grab overflow-hidden rounded-2xl border bg-black active:cursor-grabbing ${
                  isActive
                    ? 'border-purple-500/45 shadow-[0_24px_70px_-20px_rgba(168,85,247,0.75)]'
                    : 'border-white/10'
                }`}
                animate={placement(offset)}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                aria-hidden={!isActive}
                onClick={() => !isActive && go(offset)}
              >
                {!mounted.includes(i) ? (
                  <Placeholder reel={reel} />
                ) : reel.kind === 'file' ? (
                  <video
                    ref={(el) => {
                      videoRefs.current[i] = el
                    }}
                    src={reel.src}
                    className="h-full w-full object-cover"
                    preload="none"
                    muted={muted}
                    loop
                    playsInline
                    onClick={(e) => {
                      const v = e.currentTarget
                      v.paused ? void v.play().catch(() => {}) : v.pause()
                    }}
                  />
                ) : (
                  <iframe
                    ref={(el) => {
                      frameRefs.current[i] = el
                    }}
                    src={`https://www.youtube.com/embed/${reel.id}?autoplay=1&mute=1&loop=1&playlist=${reel.id}&playsinline=1&enablejsapi=1&rel=0`}
                    title={`${reel.name} — testimonial`}
                    className="h-full w-full"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                )}

                {/* Specular sheen on the dimmed flanks only — it would veil the playing reel.
                    Written as an explicit gradient: styles.css neutralizes every `from-white/*`. */}
                {!isActive && (
                  <>
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),transparent_55%)]" />
                    <div className="pointer-events-none absolute -top-2 right-12 h-[120%] w-16 rotate-12 bg-white/10 blur-xl" />
                  </>
                )}

                {isActive && reel.kind === 'file' && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setMuted((m) => !m) }}
                    aria-label={muted ? 'Unmute testimonial' : 'Mute testimonial'}
                    className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white/85 backdrop-blur-sm transition-colors hover:bg-black/80 hover:text-white"
                  >
                    {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
                  </button>
                )}

                {isActive && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black via-black/88 to-transparent px-5 pb-5 pt-20">
                    <div className="font-['Montserrat'] text-lg font-black uppercase tracking-wide text-white">
                      {reel.name}
                    </div>
                    <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
                      {reel.from}
                    </div>
                    <div className="font-['Montserrat'] text-sm font-black uppercase tracking-wide text-[#FBBF24]">
                      ↓ {reel.to}
                    </div>
                    <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                      {reel.duration}
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </motion.div>

        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous testimonial"
          className="hidden sm:flex absolute left-[max(1rem,calc(50%-var(--reel-w)*1.42))] z-40 h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/60 text-foreground/70 backdrop-blur-sm transition-colors hover:border-primary/50 hover:text-foreground"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next testimonial"
          className="hidden sm:flex absolute right-[max(1rem,calc(50%-var(--reel-w)*1.42))] z-40 h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/60 text-foreground/70 backdrop-blur-sm transition-colors hover:border-primary/50 hover:text-foreground"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="mt-10 flex items-center justify-center gap-3">
        {REELS.map((reel, i) => (
          <button
            key={reel.kind === 'file' ? reel.src : reel.id}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Show ${reel.name}'s testimonial`}
            aria-current={i === active}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === active ? 'w-8 bg-primary' : 'w-2 bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
