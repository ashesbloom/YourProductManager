import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'
import { FadeIn } from '@/components/animations/FadeIn'

const testimonials = [
  {
    quote: 'From software engineer to AI PM at a Series B startup in 4 months.',
    author: 'Arjun S.',
  },
  {
    quote: 'The mock interviews gave me the confidence I needed.',
    author: 'Meera P.',
  },
  {
    quote: 'Best investment in my career. Now leading a team of 5 PMs.',
    author: 'Karthik R.',
  },
  {
    quote: 'The frameworks here are what I use daily at work.',
    author: 'Sneha V.',
  },
  {
    quote: 'Doubled my salary within 8 months of completing the course.',
    author: 'Amit K.',
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-20 md:py-32 bg-secondary/20 overflow-hidden">
      <div className="container">
        <FadeIn className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            The Vision Enhancer in Action: <span className="gradient-text">Real Results.</span>
          </h2>
        </FadeIn>

        {/* Testimonial Cards - Horizontal Scroll */}
        <div className="relative">
          <motion.div 
            className="flex gap-6 pb-4"
            initial={{ x: 0 }}
            animate={{ x: [0, -100, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          >
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-80 glass-card p-6"
              >
                <Quote className="text-primary/30 mb-4" size={32} />
                <p className="text-foreground font-medium mb-4 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <p className="text-muted-foreground text-sm">
                  — {testimonial.author}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
