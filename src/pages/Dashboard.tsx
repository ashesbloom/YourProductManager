import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { COURSES, courseLectures, lookup } from '@/data/catalog'
import { api } from '@/lib/api'
import { resumeLecture, useMe, useProgress, type Me } from '@/lib/me'
import { btnGhost, btnPrimary } from '@/components/ui'

function CourseCard({ courseId }: { courseId: string }) {
  const { data: progress } = useProgress(courseId, true)
  const course = lookup(COURSES, courseId)
  if (!course) return null
  const lectures = courseLectures(courseId)
  const done = lectures.filter((l) => progress?.lectures[l.id]?.completed).length
  const pct = lectures.length ? Math.round((done * 100) / lectures.length) : 0
  const next = resumeLecture(courseId, progress)

  return (
    <div className="rounded-2xl border border-white/10 bg-card p-6">
      <h2 className="text-xl font-semibold">{course.title}</h2>
      <p className="mt-1 text-sm text-white/60">
        {done} of {lectures.length} lectures completed
      </p>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-label={`${course.title} progress`}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      {pct === 100 ? <p className="mt-4 text-sm font-semibold text-accent">Course completed</p> : null}
      <Link to={`/learn/${courseId}/${next.id}`} className={`${btnPrimary} mt-6 w-full`}>
        <span className="truncate">
          {done ? 'Continue' : 'Start'}: {next.title}
        </span>
      </Link>
    </div>
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

  return (
    <div className="bg-black px-4 pt-32 pb-24 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-white/60">Welcome back</p>
            <h1 className="text-3xl font-bold">{me.user.name ?? me.user.email}</h1>
          </div>
          <button type="button" onClick={logout} className={btnGhost}>
            Log out
          </button>
        </div>

        {me.enrollments.length ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {me.enrollments.map((id) => (
              <CourseCard key={id} courseId={id} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-white/10 bg-card p-8 text-center">
            <p className="text-white/70">You haven't enrolled in a course yet.</p>
            <Link to="/courses" className={`${btnPrimary} mt-6`}>
              Browse courses
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
