import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  className?: string
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn('container', className)}>
      {children}
    </div>
  )
}
