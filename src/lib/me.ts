import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type Me = { user: { email: string; name: string | null } | null; enrollments: string[] }

export const useMe = () => useQuery({ queryKey: ['me'], queryFn: () => api<Me>('/api/me') })
