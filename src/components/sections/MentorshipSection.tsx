import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { FadeIn } from '@/components/animations/FadeIn'

export function MentorshipSection() {
  return (
    <section className="py-20 md:py-32 bg-secondary/30">
      <div className="container">
        <FadeIn>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Elite 1:1 Mentorship with <span className="gradient-text">Khushbu Sharma</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Skip the generic advice. Get 7 days of intensive, personalized coaching 
              to solve your specific career bottlenecks.
            </p>
            <Link to="/coaching">
              <motion.button
                className="btn-primary inline-flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Explore 1:1 Coaching
                <ArrowRight size={18} />
              </motion.button>
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
