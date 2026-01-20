import { motion } from 'framer-motion'
import { FadeIn } from '@/components/animations/FadeIn'

const jobTitles = [
  'AI Product Manager',
  'Growth Product Manager',
  'Associate Product Manager (APM)',
  'Technical Product Manager',
  'Product Strategy Analyst',
]

export function JobTitlesSection() {
  return (
    <section className="py-20">
      <div className="container">
        <FadeIn className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Your Future <span className="gradient-text">Job Titles</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="flex flex-wrap justify-center gap-4">
            {jobTitles.map((title, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="px-6 py-3 rounded-full bg-card border border-border text-foreground font-medium
                         hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 cursor-default"
              >
                {title}
              </motion.div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
