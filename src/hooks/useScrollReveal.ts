import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * One batched reveal for every `[data-reveal]` element on the current page.
 *
 * The hidden state is written here rather than in CSS on purpose: this effect runs
 * before paint, and if it never runs at all the content stays visible instead of
 * being stuck invisible behind a stylesheet rule.
 */
export function useScrollReveal(key: string) {
  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      mm.add(
        {
          motion: '(prefers-reduced-motion: no-preference)',
          reduce: '(prefers-reduced-motion: reduce)',
        },
        (c) => {
          if (c.conditions?.reduce) {
            gsap.set('[data-reveal]', { autoAlpha: 1, y: 0 })
            return
          }

          gsap.set('[data-reveal]', { autoAlpha: 0, y: 24 })

          ScrollTrigger.batch('[data-reveal]', {
            start: 'top 85%',
            once: true,
            onEnter: (batch) =>
              gsap.to(batch, {
                autoAlpha: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.08,
                ease: 'power2.out',
                overwrite: true,
              }),
          })
        }
      )
    })

    // New route means new DOM; refresh once the page has committed.
    ScrollTrigger.refresh()

    return () => ctx.revert()
  }, [key])
}
