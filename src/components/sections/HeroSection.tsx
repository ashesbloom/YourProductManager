import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { AnimatedText } from '@/components/animations/AnimatedText'
import { FadeIn } from '@/components/animations/FadeIn'
import { CountUp } from '@/components/animations/CountUp'

const stats = [
  { value: 31, prefix: '₹', suffix: 'L+', label: 'Average Salary' },
  { value: 50, suffix: '+', label: 'Expert Lectures' },
  { value: 100, suffix: '%', label: 'Career Focused' },
]

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-hero-gradient" />
      
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
      
      <div className="container relative z-10 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <AnimatedText
              text="Think Like a Product Manager"
              as="h1"
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-2"
              delay={0.2}
            />
            <AnimatedText
              text="in an AI-First World."
              as="h1"
              className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text mb-6"
              delay={0.5}
            />
          </motion.div>

          {/* Subheadline */}
          <FadeIn delay={0.8} className="mb-10">
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Master the frameworks to build, scale, and lead AI products. 
              From <span className="text-foreground font-medium">'Your Product Manager'</span>—The Vision Enhancer for your career.
            </p>
          </FadeIn>

          {/* Stats */}
          <FadeIn delay={1} className="mb-10">
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-foreground">
                    <CountUp
                      end={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                      duration={2}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* CTAs */}
          <FadeIn delay={1.2}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/courses">
                <motion.button
                  className="btn-primary flex items-center gap-2 justify-center w-full sm:w-auto"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  COURSES
                  <ArrowRight size={18} />
                </motion.button>
              </Link>
              <Link to="/coaching">
                <motion.button
                  className="btn-secondary flex items-center gap-2 justify-center w-full sm:w-auto"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Schedule 1:1 Call
                </motion.button>
              </Link>
            </div>
          </FadeIn>

          {/* Social proof */}
          <FadeIn delay={1.4} className="mt-12">
            <p className="text-sm text-muted-foreground">
              Join <span className="text-primary font-medium">500+</span> professionals who transformed their careers
            </p>
          </FadeIn>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.5 }}
      >
        <motion.div
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="w-1 h-2 bg-muted-foreground/50 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  )
}
