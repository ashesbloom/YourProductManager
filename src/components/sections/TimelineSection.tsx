import { Clock, BookOpen } from 'lucide-react'
import { FadeIn } from '@/components/animations/FadeIn'
import { GlowCard } from '@/components/animations/GlowCard'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const programs = [
  {
    title: 'AI PRODUCT MANAGEMENT',
    lectures: 50,
    hours: '25+',
  },
  {
    title: 'PRODUCT MANAGEMENT BASICS',
    lectures: 20,
    hours: '10+',
  },
]

export function TimelineSection() {
  return (
    <section className="py-20">
      <div className="container">
        <FadeIn className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Structured for Mastery: <span className="gradient-text">Program Timeline</span>
          </h2>
          <p className="text-muted-foreground">
            50+ Lectures meticulously designed for the AI-First Era.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-12">
          {programs.map((program, index) => (
            <FadeIn key={index} delay={index * 0.15}>
              <GlowCard className="text-center">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  {program.title}
                </h3>
                <div className="flex justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <BookOpen className="text-primary" size={18} />
                    <span className="text-foreground font-semibold">{program.lectures}</span>
                    <span className="text-muted-foreground text-sm">LECTURES</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="text-primary" size={18} />
                    <span className="text-foreground font-semibold">{program.hours}</span>
                    <span className="text-muted-foreground text-sm">TOTAL HOURS</span>
                  </div>
                </div>
              </GlowCard>
            </FadeIn>
          ))}
        </div>

        {/* CTAs */}
        <FadeIn className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/courses">
            <motion.button
              className="btn-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              APPLY NOW
            </motion.button>
          </Link>
          <div className="text-center">
            <span className="text-2xl font-bold gradient-text">₹31L+</span>
            <span className="text-muted-foreground text-sm ml-2">Average Salary</span>
          </div>
          <Link to="/coaching">
            <motion.button
              className="btn-secondary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              SCHEDULE 1:1 CALL
            </motion.button>
          </Link>
        </FadeIn>
      </div>
    </section>
  )
}
