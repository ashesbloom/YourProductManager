import { useRef, useEffect, useState } from 'react'
import { useInView } from 'framer-motion'

interface CountUpProps {
  end: number
  start?: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

export function CountUp({
  end,
  start = 1,
  duration = 2.4,
  prefix = '',
  suffix = '',
  className,
}: CountUpProps) {
  const [count, setCount] = useState(start)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (isInView && !hasAnimated.current) {
      hasAnimated.current = true
      const difference = end - start

      if (difference === 0) {
        setCount(end)
        return
      }

      const totalSteps = Math.abs(difference)
      const targetTicks = Math.max(45, Math.floor(duration * 35))
      const stepSize = Math.max(1, Math.ceil(totalSteps / targetTicks))
      const step = difference > 0 ? stepSize : -stepSize
      const totalTicks = Math.ceil(totalSteps / stepSize)
      const intervalMs = Math.max(16, (duration * 1000) / totalTicks)
      let current = start

      const timer = window.setInterval(() => {
        current += step

        if ((difference > 0 && current >= end) || (difference < 0 && current <= end)) {
          current = end
        }

        setCount(current)

        if (current === end) {
          window.clearInterval(timer)
        }
      }, intervalMs)

      return () => {
        window.clearInterval(timer)
      }
    }
  }, [isInView, start, end, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}
