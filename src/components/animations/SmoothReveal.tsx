import { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import type { ReactNode } from 'react'

interface SmoothRevealProps {
  children: ReactNode
  className?: string
}

export function SmoothReveal({ children, className }: SmoothRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'start 0.6'],
  })

  const rawY = useTransform(scrollYProgress, [0, 1], [80, 0])
  const rawOpacity = useTransform(scrollYProgress, [0, 0.3, 1], [0, 0.3, 1])
  
  const y = useSpring(rawY, { stiffness: 100, damping: 30 })
  const opacity = useSpring(rawOpacity, { stiffness: 100, damping: 30 })

  return (
    <motion.div ref={ref} style={{ y, opacity }} className={className}>
      {children}
    </motion.div>
  )
}
