import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import type { ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  blur?: boolean
  scale?: boolean
  rotate?: boolean
}

export function ScrollReveal({
  children,
  className,
  blur = true,
  scale = true,
  rotate = false,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.5, 1])
  const y = useTransform(scrollYProgress, [0, 1], [60, 0])
  const blurValue = useTransform(scrollYProgress, [0, 1], [8, 0])
  const scaleValue = useTransform(scrollYProgress, [0, 1], [0.9, 1])
  const rotateValue = useTransform(scrollYProgress, [0, 1], [3, 0])

  return (
    <motion.div
      ref={ref}
      style={{
        opacity,
        y,
        scale: scale ? scaleValue : 1,
        rotate: rotate ? rotateValue : 0,
        filter: blur ? blurValue.get() > 0 ? `blur(${blurValue.get()}px)` : 'none' : 'none',
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
