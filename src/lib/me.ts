import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { courseLectures, type Lecture } from '@/data/catalog'
export type Me = {
  user: { email: string; name: string | null; isAdmin: boolean } | null
  enrollments: string[]
  certificate?: { id: string; title: string | null; completedAt: number; pdf: boolean } | null
}

/** DD/MM/YY, as printed on the certificate. */
export const certDate = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })

export const useMe = () => useQuery({ queryKey: ['me'], queryFn: () => api<Me>('/api/me') })
export type LectureProgress = { positionS: number; pct: number; completed: boolean; updatedAt: number }
export type Progress = { lectures: Record<string, LectureProgress> }

export const useProgress = (courseId: string, enabled: boolean) =>
  useQuery({ queryKey: ['progress', courseId], queryFn: () => api<Progress>(`/api/progress/${courseId}`), enabled })

/** The most recently watched unfinished lecture, else the first unfinished, else the first. */
export function resumeLecture(courseId: string, progress: Progress | undefined): Lecture {
  const lectures = courseLectures(courseId)
  const p = progress?.lectures ?? {}
  const unfinished = lectures.filter((l) => !p[l.id]?.completed)
  const recent = unfinished.filter((l) => p[l.id]).sort((a, b) => p[b.id].updatedAt - p[a.id].updatedAt)[0]
  return recent ?? unfinished[0] ?? lectures[0]
}
