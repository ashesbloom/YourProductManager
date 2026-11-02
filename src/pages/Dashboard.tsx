import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Award, BadgeCheck, BookOpen, CheckCircle2, ChevronDown, CirclePlay, Download, LayoutDashboard, LogOut, Shield, User } from 'lucide-react'
import { COURSES, courseLectures, lookup } from '@/data/catalog'
import { api, ApiError } from '@/lib/api'
import { certDate, resumeLecture, useMe, useProgress, type Me } from '@/lib/me'
import { CertificateCard, LockedCertificate } from '@/components/CertificateCard'
import { BuyButton } from '@/components/CourseOfferCard'
import { SUPPORT_EMAIL } from '@/lib/links'
import { btnPrimary } from '@/components/ui'

const card = 'rounded-2xl border border-white/10 bg-[#0d0d14] p-5 md:p-6'
const h2 = "font-['Montserrat'] text-xl font-bold"

function CourseCard({ courseId }: { courseId: string }) {
  const { data: progress } = useProgress(courseId, true)
  const course = lookup(COURSES, courseId)
  if (!course) return null
  const lectures = courseLectures(courseId)
  const p = progress?.lectures ?? {}
  const done = lectures.filter((l) => p[l.id]?.completed).length
  const pct = Math.round((done * 100) / lectures.length)
  const next = resumeLecture(courseId, progress)

  return (
    <div className={card}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-['Montserrat'] text-lg font-bold">{course.title}</h3>
          <p className="mt-1 text-sm text-white/55">
            {done} of {lectures.length} lectures completed
          </p>
        </div>
        <span className="font-['Montserrat'] text-2xl font-extrabold text-accent">{pct}%</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label={`${course.title} progress`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-primary transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      <Link to={`/learn/${courseId}/${next.id}`} className={`${btnPrimary} mt-5 w-full`}>
        <span className="truncate">
          {pct === 100 ? 'Rewatch' : done ? 'Resume' : 'Start'}: {next.title}
        </span>
      </Link>

      <details className="group mt-5 border-t border-white/10 pt-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-white/75 hover:text-white [&::-webkit-details-marker]:hidden">
          All lectures
          <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
        </summary>
        <ol className="mt-3 max-h-96 space-y-1 overflow-y-auto pr-1">
          {lectures.map((l, i) => {
            const lp = p[l.id]
            return (
              <li key={l.id}>
                <Link to={`/learn/${courseId}/${l.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-white/75 hover:bg-white/5 hover:text-white">
                  {lp?.completed ? (
                    <CheckCircle2 size={16} className="shrink-0 text-accent" aria-label="Completed" />
                  ) : (
                    <CirclePlay size={16} className={`shrink-0 ${lp ? 'text-primary' : 'text-white/35'}`} aria-label={lp ? 'In progress' : 'Not started'} />
                  )}
                  <span className="w-6 shrink-0 text-xs text-white/35">{String(i + 1).padStart(2, '0')}</span>
                  <span className="min-w-0 flex-1 truncate">{l.title}</span>
                  <span className="shrink-0 text-xs text-white/40">
                    {lp?.completed ? 'Done' : lp?.pct ? `${lp.pct}%` : l.durationS ? '' : 'Soon'}
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      </details>
    </div>
  )
}

function CertificateSection({ me }: { me: Me }) {
  const cert = me.certificate
  const { data: progress } = useProgress('ai-product', me.enrollments.includes('ai-product'))
  const total = courseLectures('ai-product').length
  const done = courseLectures('ai-product').filter((l) => progress?.lectures[l.id]?.completed).length
  const name = me.user?.name ?? undefined

  return (
    <section id="certificate" className={`${card} scroll-mt-28`}>
      <h2 className={h2}>Certificate</h2>
      {cert ? (
        <>
          <p className="mt-2 flex items-center gap-2 text-sm text-green-400">
            <BadgeCheck size={16} /> Issued on {certDate(cert.completedAt)} · ID {cert.id}
          </p>
          {!name && <p className="mt-2 text-sm text-accent">Add your name under Profile so it appears on the certificate.</p>}
          <div className="mt-6 max-w-xl">
            {cert.pdf ? (
              <iframe src={`/api/certificate/${cert.id}/pdf#view=FitH&navpanes=0`} title="Your certificate" className="aspect-[1.414/1] w-full rounded-xl bg-white" />
            ) : (
              <CertificateCard unlocked name={name} completedOn={certDate(cert.completedAt)} certificateId={cert.id} programme={cert.title} />
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {cert.pdf ? (
              <a href={`/api/certificate/${cert.id}/pdf`} download={`YPM-certificate-${cert.id}.pdf`} className={btnPrimary}>
                <Download size={16} /> Download PDF
              </a>
            ) : (
              <Link to="/certificate" className={btnPrimary}>
                <Download size={16} /> Download PDF
              </Link>
            )}
            <Link to={`/verify?id=${cert.id}`} className="btn-secondary">
              Verify link
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            Unlocks when you complete all lectures in the Product Management Programme <strong className="text-accent">OR</strong> successfully
            complete the 1:1 Coaching Programme.
          </p>
          {me.enrollments.includes('ai-product') && (
            <p className="mt-2 text-sm text-white/45">
              {done} of {total} AI Product Management lectures completed.
            </p>
          )}
          <div className="mt-6 max-w-md">
            <LockedCertificate unlocked={false} />
          </div>
        </>
      )}
    </section>
  )
}

function ProfileSection({ me }: { me: Me }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  // The server refuses renames once a certificate carries the name.
  const locked = !!me.certificate && !!me.user?.name
  return (
    <section id="profile" className={`${card} scroll-mt-28`}>
      <h2 className={h2}>Profile</h2>
      <form
        className="mt-5 grid max-w-xl gap-4"
        onSubmit={async (e) => {
          e.preventDefault()
          const name = new FormData(e.currentTarget).get('name')
          setStatus('Saving…')
          try {
            const r = await api<{ name: string }>('/api/profile', { name })
            queryClient.setQueryData<Me>(['me'], (old) => old && { ...old, user: old.user && { ...old.user, name: r.name } })
            setStatus('Saved')
          } catch (err) {
            setStatus(err instanceof ApiError ? err.message : 'Could not save. Please try again.')
          }
        }}
      >
        <div>
          <label htmlFor="p-name" className="mb-2 block text-sm font-semibold text-white/75">
            Full name <span className="font-normal text-white/40">(printed on your certificate)</span>
          </label>
          <input
            id="p-name"
            name="name"
            defaultValue={me.user?.name ?? ''}
            required
            disabled={locked}
            minLength={2}
            maxLength={80}
            autoComplete="name"
            className="block h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
          />
          {locked && <p className="mt-2 text-xs text-white/45">Locked because your certificate has been issued. Write to {SUPPORT_EMAIL} to correct it.</p>}
        </div>
        <div>
          <span className="mb-2 block text-sm font-semibold text-white/75">Email</span>
          <p className="text-white/60">{me.user?.email}</p>
        </div>
        <div className={`flex items-center gap-4 ${locked ? 'hidden' : ''}`}>
          <button type="submit" className={btnPrimary}>
            Save
          </button>
          <span role="status" className="text-sm text-white/55">
            {status}
          </span>
        </div>
      </form>
    </section>
  )
}

export default function Dashboard() {
  const { data: me, isPending } = useMe()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  if (isPending) return <div className="min-h-[60vh] bg-black" />
  if (!me?.user) return <Navigate to="/login?next=/dashboard" replace />

  async function logout() {
    await api('/api/auth/logout', {})
    queryClient.setQueryData<Me>(['me'], { user: null, enrollments: [] })
    queryClient.removeQueries({ queryKey: ['progress'] })
    navigate('/')
  }

  const nav = [
    { href: '#courses', label: 'My courses', icon: BookOpen },
    { href: '#certificate', label: 'Certificate', icon: Award },
    { href: '#profile', label: 'Profile', icon: User },
  ]
  const navItem = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/5 hover:text-white'

  return (
    <div className="bg-black pb-24 pt-[calc(var(--header-h)+2rem)] text-white">
      <div className="container grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
        {/* Sidebar: a row of links on phones, a column beside the content from lg up. */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <p className="hidden items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-white/40 lg:flex">
            <LayoutDashboard size={14} /> Dashboard
          </p>
          <nav className="-mx-1 flex gap-1 overflow-x-auto lg:mx-0 lg:mt-3 lg:flex-col" aria-label="Dashboard">
            {nav.map(({ href, label, icon: Icon }) => (
              <a key={href} href={href} className={`${navItem} shrink-0`}>
                <Icon size={17} /> {label}
              </a>
            ))}
            {me.user.isAdmin && (
              <Link to="/admin" className={`${navItem} shrink-0`}>
                <Shield size={17} /> Admin
              </Link>
            )}
            <button type="button" onClick={logout} className={`${navItem} shrink-0 lg:mt-4`}>
              <LogOut size={17} /> Log out
            </button>
          </nav>
        </aside>

        <div className="min-w-0 space-y-8">
          <div>
            <p className="text-sm text-white/55">Welcome back</p>
            <h1 className="font-['Montserrat'] text-3xl font-extrabold">{me.user.name ?? me.user.email}</h1>
          </div>

          <section id="courses" className="scroll-mt-28">
            <h2 className={h2}>My courses</h2>
            {me.enrollments.length ? (
              <div className="mt-4 grid gap-6 xl:grid-cols-2">
                {me.enrollments.map((id) => (
                  <CourseCard key={id} courseId={id} />
                ))}
              </div>
            ) : (
              <div className={`${card} mt-4`}>
                <p className="text-white/70">You haven’t enrolled yet. One purchase unlocks AI Product Management and the Foundations course.</p>
                <div className="mt-5 flex flex-wrap items-start gap-3">
                  <div className="w-full sm:w-72">
                    <BuyButton />
                  </div>
                  <Link to="/courses" className="btn-secondary">
                    See all lectures
                  </Link>
                </div>
              </div>
            )}
          </section>

          <CertificateSection me={me} />
          <ProfileSection me={me} />
        </div>
      </div>
    </div>
  )
}
