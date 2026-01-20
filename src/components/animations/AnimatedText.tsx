import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AnimatedTextProps {
  text: string
  className?: string
  delay?: number
  staggerDelay?: number
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span'
}

export function AnimatedText({
  text,
  className,
  delay = 0,
  staggerDelay = 0.03,
  as: Component = 'p',
}: AnimatedTextProps) {
  const words = text.split(' ')

  return (
    <Component className={cn('overflow-hidden', className)}>
      <motion.span
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: staggerDelay,
              delayChildren: delay,
            },
          },
        }}
        className="inline-block"
      >
        {words.map((word, i) => (
          <span key={i} className="inline-block overflow-hidden">
            <motion.span
              variants={{
                hidden: { y: '100%', opacity: 0 },
                visible: {
                  y: 0,
                  opacity: 1,
                  transition: {
                    duration: 0.5,
                    ease: [0.25, 0.4, 0.25, 1],
                  },
                },
              }}
              className="inline-block"
            >
              {word}
            </motion.span>
            {i < words.length - 1 && '\u00A0'}
          </span>
        ))}
      </motion.span>
    </Component>
  )
}
