import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { FadeIn } from '@/components/animations/FadeIn'

export function StartJourneySection() {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container">
        <FadeIn>
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Start Your PM Journey
            </h3>
            <p className="text-muted-foreground mb-8">
              Get personalized guidance for your transition
            </p>

            {/* Email Form */}
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg bg-background border border-border 
                         text-foreground placeholder:text-muted-foreground
                         focus:outline-none focus:border-primary transition-colors"
              />
              <motion.button
                type="submit"
                className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Learning
                <ArrowRight size={18} />
              </motion.button>
            </form>

            <p className="text-xs text-muted-foreground mt-4">
              Join 500+ professionals who transformed their careers
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
