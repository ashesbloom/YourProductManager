import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BadgeCheck, SearchX, ShieldCheck } from 'lucide-react'
import { CertificateCard } from '@/components/CertificateCard'

type Issued = { name: string; completedOn: string }

// ponytail: static list; swap for an API lookup once the LMS issues certificates.
// YPM0000000 is the sample shown on the home page — remove it once real IDs exist.
const ISSUED: Record<string, Issued> = {
  YPM0000000: { name: 'Sample Learner', completedOn: '02/03/26' },
}

const normalize = (raw: string) => raw.trim().toUpperCase().replace(/\s+/g, '')

export default function Verify() {
  const [params, setParams] = useSearchParams()
  const initial = normalize(params.get('id') ?? '')
  const [input, setInput] = useState(initial)
  const [checked, setChecked] = useState(initial)
  const record = checked ? ISSUED[checked] : undefined

  return (
    <div className="bg-black px-4 pt-32 pb-24 text-white">
      <div className="relative mx-auto max-w-3xl text-center">
        <div className="pointer-events-none absolute left-1/2 -top-10 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div data-reveal className="relative">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-[#a855f7] to-[#7e22ce] shadow-[0_0_40px_-8px_rgba(168,85,247,0.8)]">
            <ShieldCheck size={26} className="text-white" />
          </span>
          <span className="mt-6 block text-primary text-sm font-semibold uppercase tracking-wider">
            Certificate Verification
          </span>
          <h1 className="mt-3 font-['Montserrat'] text-3xl md:text-5xl font-black uppercase tracking-tight">
            Verify the authenticity of a <span className="text-[#FBBF24]">YPM Certificate</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-white/60">
            Enter the certificate ID printed at the bottom of the certificate.
          </p>
        </div>

        <form
          data-reveal
          className="relative mx-auto mt-10 flex max-w-xl flex-col sm:flex-row gap-x-3 gap-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const id = normalize(input)
            setChecked(id)
            setParams(id ? { id } : {}, { replace: true })
          }}
        >
          <label htmlFor="cert-id" className="sr-only">Certificate ID</label>
          <input
            id="cert-id"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="YPM0000000"
            autoComplete="off"
            spellCheck={false}
            required
            className="h-14 flex-1 rounded-xl border border-white/15 bg-white/5 px-5 font-['Montserrat'] text-lg font-bold uppercase tracking-[0.15em] text-white placeholder:text-white/25 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button type="submit" className="btn-primary h-14 justify-center whitespace-nowrap px-8">
            Verify
          </button>
        </form>
      </div>

      <div className="mx-auto mt-12 max-w-3xl" aria-live="polite">
        {checked && record && (
          <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/5 p-6 md:p-8">
            <div className="flex items-center gap-x-3 text-emerald-300">
              <BadgeCheck size={22} />
              <span className="font-bold">Verified — this certificate is authentic.</span>
            </div>
            <dl className="mt-5 grid sm:grid-cols-3 gap-x-6 gap-y-4 text-left">
              {[
                ['Issued to', record.name],
                ['Completed on', record.completedOn],
                ['Certificate ID', checked],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">{k}</dt>
                  <dd className="mt-1 font-semibold text-white/90">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-8">
              <CertificateCard unlocked name={record.name} completedOn={record.completedOn} certificateId={checked} />
            </div>
          </div>
        )}

        {checked && !record && (
          <div className="rounded-3xl border border-red-400/30 bg-red-400/5 p-6 text-center md:p-8">
            <SearchX size={26} className="mx-auto text-red-300" />
            <p className="mt-3 font-bold text-red-200">No certificate found for “{checked}”.</p>
            <p className="mt-2 text-sm text-white/55">
              Check the ID for typos. If it still doesn't match, contact us and we'll look into it.
            </p>
          </div>
        )}
      </div>

      <p className="mx-auto mt-12 max-w-xl text-center text-xs text-white/40">
        Verification confirms authenticity but does not imply employment guarantee.
      </p>
    </div>
  )
}
