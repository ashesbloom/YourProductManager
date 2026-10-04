import type { ReactNode } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, CirclePlay, Lock } from 'lucide-react'
import { COURSES, courseLectures, lookup } from '@/data/catalog'
import { resumeLecture, useMe, useProgress, type Progress } from '@/lib/me'
import { VideoPlayer } from '@/components/VideoPlayer'
import { btnGhost, btnPrimary } from '@/components/ui'

function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-card p-6 text-center">
      {children}
    </div>
  )
}

export default function Learn() {
  const { courseId = '', lectureId } = useParams()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { data: me, isPending: mePending } = useMe()
  const enrolled = !!me?.enrollments.includes(courseId)
  const { data: progress, isPending: progressPending } = useProgress(courseId, enrolled)

  const course = lookup(COURSES, courseId)
  if (!course) return <Navigate to="/courses" replace />
  const lectures = courseLectures(courseId)
  // Wait for login state (and the saved position) before picking a lecture or a lock screen.
  const ready = !mePending && (!enrolled || !progressPending)

  if (!lectureId) {
    if (!ready) return <div className="min-h-[60vh] bg-black" />
    const target = enrolled ? resumeLecture(courseId, progress) : lectures[0]
    return <Navigate to={`/learn/${courseId}/${target.id}`} replace />
  }
  const lecture = lectures.find((l) => l.id === lectureId)
  if (!lecture) return <Navigate to={`/learn/${courseId}`} replace />

  const index = lectures.indexOf(lecture)
  const nextLecture = lectures[index + 1]
  const p = progress?.lectures
  const canWatch = lecture.free || enrolled

  function onProgress(r: { pct: number; completed: boolean }) {
    queryClient.setQueryData<Progress>(['progress', courseId], (old) => ({
      lectures: {
        ...old?.lectures,
        [lecture!.id]: { positionS: old?.lectures[lecture!.id]?.positionS ?? 0, updatedAt: Date.now(), ...r },
      },
    }))
  }

  return (
    <div className="bg-black px-4 pt-28 pb-24 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          {!ready ? (
            <div className="aspect-video w-full rounded-xl bg-white/5" />
          ) : !canWatch ? (
            <Panel>
              <Lock className="text-white/50" />
              <p className="max-w-sm text-white/70">This lecture is part of the full course.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link to={`/courses/${courseId}`} className={btnPrimary}>
                  Enroll to unlock
                </Link>
                {!me?.user ? (
                  <Link to={`/login?next=${encodeURIComponent(location.pathname)}`} className={btnGhost}>
                    Already enrolled? Log in
                  </Link>
                ) : null}
              </div>
            </Panel>
          ) : lecture.durationS === 0 ? (
            <Panel>
              <p className="text-white/70">Video coming soon.</p>
            </Panel>
          ) : (
            <VideoPlayer
              key={lecture.id}
              lectureId={lecture.id}
              durationS={lecture.durationS}
              startAt={p?.[lecture.id]?.positionS ?? 0}
              track={!!me?.user}
              watermark={me?.user?.email}
              onProgress={onProgress}
            />
          )}

          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-white/50">
                {course.title} · Lecture {index + 1} of {lectures.length}
              </p>
              <h1 className="mt-1 text-2xl font-bold">{lecture.title}</h1>
              {p?.[lecture.id]?.completed ? (
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                  <CheckCircle2 size={16} /> Completed
                </p>
              ) : null}
            </div>
            {nextLecture ? (
              <Link to={`/learn/${courseId}/${nextLecture.id}`} className={btnPrimary}>
                Next lecture
              </Link>
            ) : null}
          </div>
        </section>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">Course content</h2>
          <div className="mt-4 max-h-[70vh] space-y-6 overflow-y-auto pr-1">
            {course.modules.map((m) => (
              <div key={m.title}>
                <h3 className="text-sm font-semibold text-white/80">{m.title}</h3>
                <ol className="mt-2 space-y-1">
                  {m.lectures.map((l) => {
                    const lp = p?.[l.id]
                    const current = l.id === lecture.id
                    return (
                      <li key={l.id}>
                        <Link
                          to={`/learn/${courseId}/${l.id}`}
                          aria-current={current ? 'page' : undefined}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                            current ? 'bg-primary/15 text-white' : 'text-white/70 hover:bg-white/5'
                          }`}
                        >
                          {lp?.completed ? (
                            <CheckCircle2 size={16} className="shrink-0 text-accent" aria-label="Completed" />
                          ) : l.free || enrolled ? (
                            <CirclePlay size={16} className="shrink-0 text-white/50" />
                          ) : (
                            <Lock size={16} className="shrink-0 text-white/30" aria-label="Locked" />
                          )}
                          <span className="min-w-0 flex-1 truncate">{l.title}</span>
                          {!lp?.completed && lp?.pct ? <span className="text-xs text-white/40">{lp.pct}%</span> : null}
                          {l.free && !enrolled ? <span className="text-xs text-green-400">Free</span> : null}
                        </Link>
                      </li>
                    )
                  })}
                </ol>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
