import { useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { Logo } from './Logo'

type CertificateCardProps = {
  unlocked: boolean
  name?: string
  completedOn?: string
  certificateId?: string
}

const GOLD = 'linear-gradient(135deg,#B8860B 0%,#E8CC72 45%,#C9A227 100%)'

/** Gold hairline used for the frame and the three footer rules. */
function GoldRule({ className = '' }: { className?: string }) {
  return <div className={className} style={{ background: GOLD }} />
}

export function CertificateCard({
  unlocked,
  name = 'Name',
  completedOn = 'DD/MM/YY',
  certificateId = 'YPM0000000',
}: CertificateCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const reduceMotion = useReducedMotion()
  const interactive = unlocked && !reduceMotion

  const handleMove = (e: React.MouseEvent) => {
    if (!interactive) return
    const r = cardRef.current?.getBoundingClientRect()
    if (!r) return
    setTilt({
      x: -((e.clientY - r.top) / r.height - 0.5) * 12,
      y: ((e.clientX - r.left) / r.width - 0.5) * 12,
    })
  }

  return (
    <div className="[perspective:1400px]">
      <div
        ref={cardRef}
        onMouseMove={handleMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        className="group relative aspect-[1.414/1] w-full overflow-hidden shadow-[0_30px_70px_-25px_rgba(0,0,0,0.8)] [container-type:inline-size] transition-transform duration-300 ease-out"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          background: 'linear-gradient(135deg,#EFF0F3 0%,#FDFDFE 38%,#F2F3F6 100%)',
          borderRadius: '0.5cqw',
        }}
      >
        {/* Paper sheen. Explicit rgba: styles.css neutralizes every `from-white/*` gradient. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(118deg,transparent 18%,rgba(255,255,255,0.85) 30%,transparent 42%,transparent 62%,rgba(255,255,255,0.6) 72%,transparent 84%)',
          }}
        />

        {/* Violet swoosh sweeping the bottom-left corner, with its gold edge. */}
        <div
          className="pointer-events-none absolute -bottom-[22cqw] -left-[26cqw] h-[44cqw] w-[44cqw]"
          style={{ background: GOLD, borderRadius: '50%' }}
        />
        <div
          className="pointer-events-none absolute -bottom-[23cqw] -left-[27.2cqw] h-[44cqw] w-[44cqw]"
          style={{
            background: 'linear-gradient(135deg,#7C3AED 0%,#6B21E8 55%,#5B16C9 100%)',
            borderRadius: '50%',
          }}
        />

        {/* Double gold frame. border-image draws a gradient hairline without a mask
            composite, which Tailwind's arbitrary `mask:` could not emit reliably. */}
        <div
          className="pointer-events-none absolute inset-[1.6cqw]"
          style={{ border: '0.22cqw solid transparent', borderImage: `${GOLD} 1` }}
        />
        <div
          className="pointer-events-none absolute inset-[2.9cqw]"
          style={{ border: '0.16cqw solid transparent', borderImage: `${GOLD} 1` }}
        />

        {/* ── Content ── */}
        <div className="absolute inset-[2.9cqw] flex flex-col px-[3.4cqw] py-[2.6cqw] text-[#1B2A4A]">
          {/* Masthead */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-end gap-[1.1cqw]">
                <Logo className="h-[3.6cqw] w-auto shrink-0 text-[#0B1020]" />
                <span className="pb-[0.3cqw] text-[1.35cqw] font-extrabold uppercase leading-[1.25] tracking-wide text-[#0B1020]">
                  Your
                  <br />
                  Product
                  <br />
                  Manager
                </span>
              </div>
              <div className="mt-[0.7cqw] text-[1.1cqw] font-bold uppercase tracking-[0.3em] text-[#6B21E8]">
                Learn | Apply | Grow
              </div>
            </div>

            {/* Gold medallion */}
            <div className="relative h-[9cqw] w-[9cqw] shrink-0">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(#C9A227 0deg,#F0D98A 12deg,#B8860B 24deg,#E8CC72 36deg,#C9A227 48deg,#F0D98A 60deg,#B8860B 72deg,#E8CC72 84deg,#C9A227 96deg,#F0D98A 108deg,#B8860B 120deg,#E8CC72 132deg,#C9A227 144deg,#F0D98A 156deg,#B8860B 168deg,#E8CC72 180deg,#C9A227 192deg,#F0D98A 204deg,#B8860B 216deg,#E8CC72 228deg,#C9A227 240deg,#F0D98A 252deg,#B8860B 264deg,#E8CC72 276deg,#C9A227 288deg,#F0D98A 300deg,#B8860B 312deg,#E8CC72 324deg,#C9A227 336deg,#F0D98A 348deg,#B8860B 360deg)`,
                }}
              />
              <div className="absolute inset-[0.5cqw] rounded-full bg-[#0B1020]" />
              <div
                className="absolute inset-[0.95cqw] rounded-full"
                style={{ background: 'radial-gradient(circle at 34% 28%,#F6E6AE 0%,#D9B544 48%,#A9780C 100%)' }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[#1B1405]">
                <Logo className="w-[4.6cqw]" />
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="mt-[3.2cqw] text-center">
            <h3 className="font-['Playfair_Display'] text-[5.4cqw] font-bold leading-none text-[#5B16C9]">
              Certificate of Completion
            </h3>

            <p className="mt-[2.4cqw] text-[1.25cqw] font-medium uppercase tracking-[0.34em]">
              This is to certify that
            </p>

            <p className="mt-[2.6cqw] font-['Playfair_Display'] text-[6cqw] font-medium leading-none">
              {name}
            </p>
            <GoldRule className="mx-auto mt-[1.3cqw] h-[0.22cqw] w-[56cqw]" />

            <p className="mt-[2cqw] text-[1.75cqw]">has successfully completed the</p>
            <p className="mt-[1.3cqw] text-[2.5cqw] font-bold">Product Management Training Program</p>
            <p className="mt-[1.3cqw] text-[1.75cqw]">at Your Product Manager (YPM).</p>
          </div>

          {/* Footer: date · signature · id */}
          <div className="mt-auto grid grid-cols-3 gap-[3cqw] pl-[14cqw] text-center">
            <div>
              <div className="text-[1.75cqw]">{completedOn}</div>
              <GoldRule className="mt-[0.6cqw] h-[0.16cqw] w-full" />
              <div className="mt-[0.9cqw] text-[1.1cqw] font-semibold uppercase tracking-[0.22em] text-[#4A5570]">
                Date of Completion
              </div>
            </div>

            <div>
              <div className="font-['Playfair_Display'] text-[1.9cqw] italic">Khushbu</div>
              <GoldRule className="mt-[0.6cqw] h-[0.16cqw] w-full" />
              <div className="mt-[0.9cqw] text-[1.2cqw] font-bold uppercase tracking-[0.16em]">
                Khushbu Sharma
              </div>
              <div className="mt-[0.35cqw] text-[1.15cqw] text-[#4A5570]">
                Founder, Your Product Manager (YPM)
              </div>
            </div>

            <div>
              <div className="text-[1.75cqw] tabular-nums">{certificateId}</div>
              <GoldRule className="mt-[0.6cqw] h-[0.16cqw] w-full" />
              <div className="mt-[0.9cqw] text-[1.1cqw] font-semibold uppercase tracking-[0.22em] text-[#4A5570]">
                Certificate ID
              </div>
              <div className="mt-[0.35cqw] text-[1.05cqw] leading-snug text-[#4A5570]">
                Certificate verification will be available through the official YPM website.
              </div>
            </div>
          </div>
        </div>

        {/* Gold glint sweeping across on hover, unlocked only. */}
        {interactive && (
          <div
            className="pointer-events-none absolute -inset-y-[20%] -left-[60%] w-[35%] -rotate-12 opacity-0 transition-all duration-700 ease-out group-hover:left-[115%] group-hover:opacity-100"
            style={{
              background:
                'linear-gradient(90deg,transparent,rgba(255,243,205,0.75),rgba(255,255,255,0.9),transparent)',
            }}
          />
        )}
      </div>
    </div>
  )
}

/** The certificate behind its lock. Blur lives on a wrapper so the card never remounts. */
export function LockedCertificate({ unlocked, ...rest }: CertificateCardProps) {
  return (
    <div className="relative">
      <div
        className={`transition-all duration-700 ease-out ${
          unlocked ? 'blur-0 scale-100' : 'blur-[6px] scale-[0.98]'
        }`}
        aria-hidden={!unlocked}
      >
        <CertificateCard unlocked={unlocked} {...rest} />
      </div>

      <div
        className={`pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35 transition-opacity duration-500 ${
          unlocked ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ borderRadius: '0.5rem' }}
      >
        <span className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm">
          <Lock size={30} strokeWidth={2.2} />
        </span>
      </div>

      {!unlocked && (
        <p className="sr-only">
          Your certificate is locked until you complete the course.
        </p>
      )}
    </div>
  )
}
