import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface GlowCardProps {
  children: ReactNode
  className?: string
  glowColor?: string
}

export function GlowCard({
  children,
  className,
  glowColor = 'rgba(139, 92, 246, 0.3)',
}: GlowCardProps) {
  return (
    <motion.div
      className={cn(
        'relative group rounded-2xl bg-card border border-border p-6',
        'transition-all duration-300',
        className
      )}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      style={{
        boxShadow: '0 0 0 rgba(139, 92, 246, 0)',
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Glow effect on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
        style={{
          boxShadow: `0 0 30px ${glowColor}`,
        }}
      />
      
      {/* Gradient border on hover */}
      <div className="absolute inset-0 rounded-2xl border border-primary/0 group-hover:border-primary/50 transition-colors duration-300" />
      
      {children}
    </motion.div>
  )
}
