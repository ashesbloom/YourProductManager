import { useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Lock } from 'lucide-react'
import template from '@/assets/certificate-template.webp'
import { CERTIFICATE_PROGRAMME } from '@/data/catalog'

type CertificateCardProps = {
  unlocked: boolean
  name?: string
  completedOn?: string
  certificateId?: string
  programme?: string | null
  /** Changes after a new signature upload, so the card re-fetches it. */
  signatureVersion?: number
}

// Khushbu's certificate design with its placeholder text removed; the live fields are laid over it.
// Positions are % of the 2000×1414 artwork, text sizes in cqw (1cqw = 1% of the card's width).
const INK = '#12243C'

function Field({ x, y, className = '', style, children }: { x: number; y: number; className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap ${className}`} style={{ left: `${x}%`, top: `${y}%`, ...style }}>
      {children}
    </div>
  )
}

export function CertificateCard({
  unlocked,
  name = 'Name',
  completedOn = 'DD/MM/YY',
  certificateId = 'YPM0000000',
  programme,
  signatureVersion,
}: CertificateCardProps) {
  const [noSignature, setNoSignature] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const reduceMotion = useReducedMotion()
  const interactive = unlocked && !reduceMotion
  const title = programme || CERTIFICATE_PROGRAMME

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
    // In print: one landscape page. Full width, capped at 262mm so its height fits A4 (190mm usable) and Letter.
    <div className="[perspective:1400px] print:mx-auto print:w-full print:max-w-[262mm]">
      <div
        ref={cardRef}
        onMouseMove={handleMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        className="group relative aspect-[2000/1414] w-full overflow-hidden rounded-[0.5cqw] shadow-[0_30px_70px_-25px_rgba(0,0,0,0.8)] [container-type:inline-size] transition-transform duration-300 ease-out print:shadow-none"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, color: INK }}
      >
        <img src={template} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none" />

        {/* Long names and programmes shrink to stay on the rule. */}
        <Field x={50} y={40.2} className="font-['Source_Serif_4'] font-semibold leading-none" style={{ fontSize: `${Math.min(5.4, 100 / name.length)}cqw` }}>
          {name}
        </Field>
        <Field x={50} y={53.8} className="font-bold" style={{ fontSize: `${Math.min(2.4, 82 / title.length)}cqw` }}>
          {title}
        </Field>
        <Field x={26.5} y={72.9} className="text-[1.45cqw] tabular-nums">
          {completedOn}
        </Field>
        {/* The uploaded signature (Admin → Certificates) sits on the rule; until there is one, her name in script. */}
        {noSignature ? (
          <Field x={49.7} y={72.5} className="font-['Playfair_Display'] text-[2.1cqw] italic">
            Khushbu
          </Field>
        ) : (
          <img
            src={`/api/signature${signatureVersion ? `?v=${signatureVersion}` : ''}`}
            alt="Signature"
            draggable={false}
            onError={() => setNoSignature(true)}
            className="absolute bottom-[24.4%] left-[49.7%] h-[6cqw] max-w-[17cqw] -translate-x-1/2 select-none object-contain object-bottom"
          />
        )}
        <Field x={75.75} y={72.9} className="text-[1.45cqw] tabular-nums">
          {certificateId}
        </Field>
        <Field x={75.4} y={81.6} className="text-center text-[0.95cqw] leading-snug text-[#4A5570]">
          Verify at yourproductmanager.in/verify
        </Field>

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
