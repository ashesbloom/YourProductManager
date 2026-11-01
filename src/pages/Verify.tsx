import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api, ApiError } from '@/lib/api'
import { certDate } from '@/lib/me'
import { BadgeCheck, Download, SearchX, ShieldCheck } from 'lucide-react'
import { CertificateCard } from '@/components/CertificateCard'

type Issued = { name: string; completedOn: string; title?: string | null }

// The sample shown on the home page; every real ID is checked with the server.
const SAMPLE: Record<string, Issued> = { YPM0000000: { name: 'Sample Learner', completedOn: '02/03/26' } }

const normalize = (raw: string) => raw.trim().toUpperCase().replace(/\s+/g, '')

export default function Verify() {
  const [params, setParams] = useSearchParams()
  const initial = normalize(params.get('id') ?? '')
  const [input, setInput] = useState(initial)
  const [checked, setChecked] = useState(initial)
  const { data: record, isFetching } = useQuery({
    queryKey: ['certificate', checked],
    enabled: !!checked,
    retry: false,
    queryFn: async (): Promise<Issued | null> => {
      if (SAMPLE[checked]) return SAMPLE[checked]
      try {
        const r = await api<{ name: string; title: string | null; completedAt: number }>(`/api/certificate/${encodeURIComponent(checked)}`)
        return { name: r.name, title: r.title, completedOn: certDate(r.completedAt) }
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null
        throw err
      }
    },
  })

  return (
    <div className="bg-black px-4 pt-32 pb-24 text-white print:bg-white print:p-0">
      <div className="relative mx-auto max-w-3xl text-center print:hidden">
        <div className="pointer-events-none absolute left-1/2 -top-10 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div data-reveal className="relative">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand shadow-[0_0_40px_-8px_rgba(124,58,237,0.8)]">
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
          <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/5 p-6 md:p-8 print:border-0 print:bg-transparent print:p-0">
            <div className="flex items-center gap-x-3 text-emerald-300 print:hidden">
              <BadgeCheck size={22} />
              <span className="font-bold">Verified — this certificate is authentic.</span>
            </div>
            <dl className="mt-5 grid sm:grid-cols-3 gap-x-6 gap-y-4 text-left print:hidden">
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
            <div className="mt-8 print:mt-0">
              <CertificateCard unlocked name={record.name} completedOn={record.completedOn} certificateId={checked} programme={record.title} />
            </div>
            {/* The browser's print dialog → Save as PDF; everything but the card is print:hidden. */}
            {!SAMPLE[checked] && (
              <div className="mt-6 flex flex-wrap items-center gap-4 print:hidden">
                <button type="button" onClick={() => window.print()} className="btn-primary">
                  <Download size={16} /> Download PDF
                </button>
                <span className="text-sm text-white/45">Choose “Save as PDF” and landscape in the print dialog.</span>
              </div>
            )}
          </div>
        )}

        {checked && record === null && !isFetching && (
          <div className="rounded-3xl border border-red-400/30 bg-red-400/5 p-6 text-center md:p-8 print:hidden">
            <SearchX size={26} className="mx-auto text-red-300" />
            <p className="mt-3 font-bold text-red-200">No certificate found for “{checked}”.</p>
            <p className="mt-2 text-sm text-white/55">
              Check the ID for typos. If it still doesn't match, contact us and we'll look into it.
            </p>
          </div>
        )}
      </div>

      <p className="mx-auto mt-12 max-w-xl text-center text-xs text-white/40 print:hidden">
        Verification confirms authenticity but does not imply employment guarantee.
      </p>
    </div>
  )
}
