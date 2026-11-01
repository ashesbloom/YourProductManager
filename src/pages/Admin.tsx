import { useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowUpRight } from 'lucide-react'
import { CERTIFICATE_PROGRAMME, formatINR } from '@/data/catalog'
import { api, upload } from '@/lib/api'
import { certDate, useMe } from '@/lib/me'
import { CertificateCard } from '@/components/CertificateCard'

type Stats = {
  totalStudents: number
  activeStudents: number
  newStudents: number
  completionRate: number
  averageProgress: number
  signups: { total: number; last30: number }
  revenue: { orders: number; paise: number }
  daily: Array<{ date: string; signups: number; enrollments: number; paise: number }>
  students: Array<{ id: number; name: string | null; email: string; enrolledAt: number; progress: number; lastWatchedAt: number | null; coachingDone: boolean }>
  certificates: IssuedCertificate[]
}
type IssuedCertificate = { id: string; email: string; name: string | null; title: string | null; issuedAt: number; coached: boolean; pdf: boolean }

const card = 'rounded-2xl border border-white/10 bg-[#0d0d14] p-5'
const day = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
const date = (ms: number) => new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className={card}>
      <p className="text-sm text-white/55">{label}</p>
      <p className="mt-2 font-['Montserrat'] text-3xl font-extrabold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-white/40">{note}</p>
    </div>
  )
}

/** One series, one axis: a bar per day, value on hover/focus, a table for exact numbers. */
function DailyBars({ title, data, format }: { title: string; data: Array<{ date: string; value: number }>; format: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const total = data.reduce((n, d) => n + d.value, 0)
  return (
    <figure className={card}>
      <figcaption className="flex items-baseline justify-between gap-4">
        <span className="font-semibold">{title}</span>
        <span className="text-sm text-white/55">
          {format(total)} in 30 days
        </span>
      </figcaption>
      <div className="mt-5 flex h-40 items-end gap-[2px] border-b border-white/15" role="img" aria-label={`${title}, last 30 days. Total ${format(total)}.`}>
        {data.map((d) => (
          <div key={d.date} tabIndex={0} className="group relative flex h-full flex-1 items-end outline-none">
            <div
              className="w-full rounded-t-[4px] bg-primary transition-opacity group-hover:opacity-80"
              style={{ height: d.value ? `${Math.max(3, (d.value / max) * 100)}%` : 0 }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-white/15 bg-black px-2 py-1 text-xs group-hover:block group-focus:block">
              {day(d.date)}: <strong>{format(d.value)}</strong>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-white/40">
        <span>{day(data[0].date)}</span>
        <span>{day(data[data.length - 1].date)}</span>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-white/55 hover:text-white">Show table</summary>
        <table className="mt-2 w-full text-left text-xs">
          <tbody>
            {data.filter((d) => d.value).map((d) => (
              <tr key={d.date} className="border-t border-white/5">
                <td className="py-1 text-white/55">{day(d.date)}</td>
                <td className="py-1 text-right tabular-nums">{format(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}

const input = 'h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'

/** Issue (or re-issue, to fix the name or programme), email and withdraw certificates. */
function Certificates({ list, setCoaching, refresh }: { list: IssuedCertificate[]; setCoaching: (email: string, done: boolean) => Promise<void>; refresh: () => void }) {
  const form = useRef<HTMLFormElement>(null)
  const [status, setStatus] = useState('')
  // What the certificate will look like, updated as the form is typed in.
  const [preview, setPreview] = useState({ name: '', title: '' })
  // Khushbu's own PDF, sent and downloaded instead of the site's design.
  const [pdf, setPdf] = useState<{ file: File; url: string } | null>(null)
  const choosePdf = (file?: File) => {
    if (pdf) URL.revokeObjectURL(pdf.url)
    setPdf(file ? { file, url: URL.createObjectURL(file) } : null)
  }
  const [signatureVersion, setSignatureVersion] = useState(0)
  const [hasSignature, setHasSignature] = useState(true)
  const syncPreview = () => {
    const f = form.current!
    setPreview({ name: (f.elements.namedItem('name') as HTMLInputElement).value, title: (f.elements.namedItem('title') as HTMLInputElement).value })
  }
  const act = async (pending: string, done: string, fn: () => Promise<unknown>) => {
    setStatus(pending)
    try {
      await fn()
      setStatus(done)
      refresh()
    } catch (err) {
      setStatus((err as Error).message)
    }
  }
  const edit = (c: IssuedCertificate) => {
    const f = form.current!
    ;(f.elements.namedItem('email') as HTMLInputElement).value = c.email
    ;(f.elements.namedItem('name') as HTMLInputElement).value = c.name ?? ''
    ;(f.elements.namedItem('title') as HTMLInputElement).value = c.title ?? ''
    ;(f.elements.namedItem('send') as HTMLInputElement).checked = false
    ;(f.elements.namedItem('pdf') as HTMLInputElement).value = ''
    choosePdf()
    setStatus(c.pdf ? 'This certificate uses your own PDF. Choose a new PDF to replace it, or leave it empty to keep it.' : '')
    syncPreview()
    f.scrollIntoView({ block: 'center' })
    ;(f.elements.namedItem('name') as HTMLInputElement).focus()
  }

  return (
    <section id="certificates" className={`${card} scroll-mt-28`}>
      <h2 className="font-['Montserrat'] text-xl font-bold">Certificates</h2>
      <p className="mt-1 text-sm text-white/55">
        Course students get theirs automatically, by email, after the last AI PM lecture. Issue one here for 1:1 coaching or anyone else, in the site’s design or as your own PDF. Use the same email again to fix a name or programme.
      </p>
      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
      <form
        ref={form}
        className="grid gap-3"
        onInput={syncPreview}
        onSubmit={(e) => {
          e.preventDefault()
          const f = e.currentTarget
          const data = new FormData(f)
          const email = String(data.get('email'))
          const send = data.get('send') === 'on'
          const file = pdf?.file
          act('Issuing…', `Certificate issued${send ? ' and emailed' : ''} to ${email}.`, async () => {
            // With a PDF, the email waits until the PDF is stored, so it goes out with the PDF attached.
            const { id } = await api<{ id: string }>('/api/admin/certificate', { email, name: data.get('name'), title: data.get('title'), send: send && !file })
            if (file) await upload(`/api/admin/certificate/${id}/pdf`, file)
            if (file && send) await api('/api/admin/certificate/email', { email })
            f.reset()
            choosePdf()
            setPreview({ name: '', title: '' })
          })
        }}
      >
        <label className="grid gap-1.5 text-sm">
          <span className="font-semibold text-white/75">Email</span>
          <input name="email" type="email" required placeholder="learner@email.com" className={input} />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-semibold text-white/75">Name on certificate</span>
          <input name="name" required minLength={2} maxLength={80} placeholder="Full name" className={input} />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-semibold text-white/75">
            Programme <span className="font-normal text-white/40">(optional)</span>
          </span>
          <input name="title" maxLength={80} placeholder={CERTIFICATE_PROGRAMME} className={input} />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-semibold text-white/75">
            Your own PDF <span className="font-normal text-white/40">(optional, sent instead of the design shown here)</span>
          </span>
          <input
            name="pdf"
            type="file"
            accept="application/pdf"
            onChange={(e) => choosePdf(e.target.files?.[0])}
            className="text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:font-semibold file:text-white hover:file:bg-white/15"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input name="send" type="checkbox" defaultChecked className="h-4 w-4 accent-[#8b5cf6]" />
          Email it to them now {pdf ? '(with your PDF attached)' : '(a link to view and download the PDF)'}
        </label>
        <button type="submit" className="btn-primary h-11 justify-center sm:justify-self-start">
          Issue certificate
        </button>
      </form>
      <figure>
        {pdf ? (
          <iframe src={`${pdf.url}#view=FitH&navpanes=0`} title="Your PDF" className="aspect-[1.414/1] w-full rounded-xl bg-white" />
        ) : (
          <CertificateCard key={signatureVersion} unlocked name={preview.name.trim() || 'Name'} programme={preview.title.trim() || null} completedOn={certDate(Date.now())} certificateId="YPM········" signatureVersion={signatureVersion} />
        )}
        <figcaption className="mt-2 text-xs text-white/40">
          {pdf ? 'Your PDF, as they will receive it.' : 'Preview. The ID is assigned when you issue it.'}
        </figcaption>
      </figure>
      </div>
      <p role="status" className="mt-3 min-h-5 text-sm text-accent">
        {status}
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="text-white/45">
            <tr>
              {['Name', 'Email', 'Programme', 'Certificate ID', 'Issued', ''].map((h) => (
                <th key={h} className="pb-3 pr-4 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-t border-white/5">
                <td className="py-3 pr-4">{c.name ?? '—'}</td>
                <td className="py-3 pr-4 text-white/70">{c.email}</td>
                <td className="py-3 pr-4 text-white/70">
                  {c.title ?? CERTIFICATE_PROGRAMME}
                  {c.pdf && <span className="ml-2 rounded-full border border-purple-400/40 bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-200">Your PDF</span>}
                </td>
                <td className="py-3 pr-4 tabular-nums">
                  <Link to={`/verify?id=${c.id}`} target="_blank" className="text-purple-300 hover:text-white">
                    {c.id}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-white/70">{date(c.issuedAt)}</td>
                <td className="whitespace-nowrap py-3 text-right">
                  <button type="button" onClick={() => act('Sending…', `Certificate emailed to ${c.email}.`, () => api('/api/admin/certificate/email', { email: c.email }))} className="rounded-lg px-2.5 py-1.5 font-semibold text-white/70 hover:bg-white/5 hover:text-white">
                    Email
                  </button>
                  <button type="button" onClick={() => edit(c)} className="rounded-lg px-2.5 py-1.5 font-semibold text-white/70 hover:bg-white/5 hover:text-white">
                    Edit
                  </button>
                  {c.pdf && (
                    <button
                      type="button"
                      onClick={() => act('Switching…', `${c.email} now gets the site’s design.`, () => upload(`/api/admin/certificate/${c.id}/pdf`))}
                      className="rounded-lg px-2.5 py-1.5 font-semibold text-white/70 hover:bg-white/5 hover:text-white"
                    >
                      Use site design
                    </button>
                  )}
                  {c.coached && (
                    <button
                      type="button"
                      onClick={() => confirm(`Withdraw ${c.email}’s certificate? Its ID will stop verifying.`) && act('Withdrawing…', `Certificate withdrawn for ${c.email}.`, () => setCoaching(c.email, false))}
                      className="rounded-lg px-2.5 py-1.5 font-semibold text-red-300/80 hover:bg-red-400/10 hover:text-red-200"
                    >
                      Withdraw
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!list.length && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-white/45">
                  No certificates issued yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-5 border-t border-white/10 pt-6">
        <div className="flex h-20 w-56 items-center justify-center rounded-xl bg-white p-2">
          {hasSignature ? (
            <img key={signatureVersion} src={`/api/signature?v=${signatureVersion}`} alt="Current signature" onError={() => setHasSignature(false)} className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="font-['Playfair_Display'] text-xl italic text-[#12243C]">Khushbu</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">Signature</h3>
          <p className="mt-1 text-sm text-white/55">
            Printed on every certificate in the site’s design. Use a PNG with a transparent background. {hasSignature ? '' : 'Until you upload one, her name is set in script.'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="btn-secondary h-10 cursor-pointer">
              Upload signature
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (file)
                    act('Uploading signature…', 'Signature updated on every certificate.', async () => {
                      await upload('/api/admin/signature', file)
                      setHasSignature(true)
                      setSignatureVersion(Date.now())
                    })
                }}
              />
            </label>
            {hasSignature && (
              <button
                type="button"
                onClick={() =>
                  act('Removing…', 'Signature removed.', async () => {
                    await upload('/api/admin/signature')
                    setHasSignature(false)
                    setSignatureVersion(Date.now())
                  })
                }
                className="text-sm font-semibold text-white/60 hover:text-white"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Admin() {
  const { data: me, isPending } = useMe()
  const queryClient = useQueryClient()
  const isAdmin = !!me?.user?.isAdmin
  const { data: s, error } = useQuery({ queryKey: ['admin'], queryFn: () => api<Stats>('/api/admin/stats'), enabled: isAdmin })

  if (isPending) return <div className="min-h-[60vh] bg-black" />
  if (!me?.user) return <Navigate to="/login?next=/admin" replace />
  const certOf = new Map(s?.certificates.map((c) => [c.email, c.id]))
  if (!isAdmin) return <Navigate to="/dashboard" replace />

  async function setCoaching(email: string, done: boolean) {
    await api('/api/admin/coaching', { email, done })
    queryClient.invalidateQueries({ queryKey: ['admin'] })
  }

  return (
    <div className="bg-black pb-24 pt-[calc(var(--header-h)+2rem)] text-white">
      <div className="container space-y-8">
        <h1 className="font-['Montserrat'] text-3xl font-extrabold">Admin dashboard</h1>
        {error ? <p className="text-red-300">Could not load stats: {String((error as Error).message)}</p> : null}
        {!s ? (
          !error && <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat label="Total students" value={String(s.totalStudents)} note="Paid, not refunded" />
              <Stat label="Active students" value={String(s.activeStudents)} note="Watched in the last 7 days" />
              <Stat label="New students" value={String(s.newStudents)} note="Enrolled in the last 30 days" />
              <Stat label="Course completion rate" value={`${s.completionRate}%`} note="Finished all AI PM lectures" />
              <Stat label="Average student progress" value={`${s.averageProgress}%`} note="Of AI PM lectures completed" />
              <Stat label="Signups" value={String(s.signups.total)} note={`${s.signups.last30} in the last 30 days`} />
              <Stat label="Revenue" value={formatINR(s.revenue.paise)} note={`${s.revenue.orders} paid orders, incl. GST`} />
              <a href="https://analytics.google.com/" target="_blank" rel="noreferrer" className={`${card} group transition-colors hover:border-primary/50`}>
                <p className="text-sm text-white/55">Traffic</p>
                <p className="mt-2 inline-flex items-center gap-1 font-['Montserrat'] text-xl font-extrabold">
                  Google Analytics <ArrowUpRight size={18} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </p>
                <p className="mt-1 text-xs text-white/40">Visitors and page views</p>
              </a>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <DailyBars title="Enrollments" data={s.daily.map((d) => ({ date: d.date, value: d.enrollments }))} format={String} />
              <DailyBars title="Revenue" data={s.daily.map((d) => ({ date: d.date, value: d.paise }))} format={formatINR} />
              <DailyBars title="Signups" data={s.daily.map((d) => ({ date: d.date, value: d.signups }))} format={String} />
            </div>

            <section className={card}>
              <h2 className="font-['Montserrat'] text-xl font-bold">Students</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[52rem] text-left text-sm">
                  <thead className="text-white/45">
                    <tr>
                      {['Name', 'Email', 'Course', 'Progress', 'Purchased', 'Last watched', 'Certificate', '1:1 coaching done'].map((h) => (
                        <th key={h} className="pb-3 pr-4 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.students.map((st) => (
                      <tr key={st.id} className="border-t border-white/5">
                        <td className="py-3 pr-4">{st.name ?? '—'}</td>
                        <td className="py-3 pr-4 text-white/70">{st.email}</td>
                        <td className="py-3 pr-4 text-white/70">AI PM + Foundations</td>
                        <td className="py-3 pr-4 tabular-nums">{st.progress}%</td>
                        <td className="py-3 pr-4 text-white/70">{date(st.enrolledAt)}</td>
                        <td className="py-3 pr-4 text-white/70">{st.lastWatchedAt ? date(st.lastWatchedAt) : '—'}</td>
                        <td className="py-3 pr-4 tabular-nums">
                          {certOf.get(st.email) ? (
                            <Link to={`/verify?id=${certOf.get(st.email)}`} target="_blank" className="text-purple-300 hover:text-white">
                              {certOf.get(st.email)}
                            </Link>
                          ) : (
                            <span className="text-white/40">Not yet</span>
                          )}
                        </td>
                        <td className="py-3">
                          <input
                            type="checkbox"
                            checked={st.coachingDone}
                            onChange={(e) => setCoaching(st.email, e.target.checked)}
                            aria-label={`1:1 coaching complete for ${st.email} (issues the certificate)`}
                            className="h-4 w-4 accent-[#8b5cf6]"
                          />
                        </td>
                      </tr>
                    ))}
                    {!s.students.length && (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-white/45">
                          No students yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs text-white/40">Ticking 1:1 coaching issues that learner’s certificate.</p>
            </section>

            <Certificates list={s.certificates} setCoaching={setCoaching} refresh={() => queryClient.invalidateQueries({ queryKey: ['admin'] })} />
          </>
        )}
      </div>
    </div>
  )
}
