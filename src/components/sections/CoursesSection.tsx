import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, ArrowRight } from 'lucide-react'
import { FadeIn } from '@/components/animations/FadeIn'
import { GlowCard } from '@/components/animations/GlowCard'

const courses = [
  {
    badge: 'FLAGSHIP COURSE',
    title: 'AI PRODUCT MANAGEMENT',
    description: 'Master the art of building AI-first products. Learn to make strategic decisions in the age of machine intelligence.',
    lectures: 50,
    featured: true,
  },
  {
    badge: 'FOUNDATION COURSE',
    title: 'PRODUCT MANAGEMENT BASICS',
    description: 'Build your PM fundamentals from scratch. Perfect for career switchers and aspiring product managers.',
    lectures: 20,
    featured: false,
  },
]

export function CoursesSection() {
  return (
    <section className="py-20 md:py-32 bg-secondary/20">
      <div className="container">
        {/* Section Header */}
        <FadeIn className="text-center mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">
            Recent Courses
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-2">
            Master the Craft
          </h2>
        </FadeIn>

        {/* Course Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {courses.map((course, index) => (
            <FadeIn key={index} delay={index * 0.15}>
              <GlowCard
                className={`h-full ${course.featured ? 'border-primary/30' : ''}`}
                glowColor={course.featured ? 'rgba(139, 92, 246, 0.4)' : 'rgba(139, 92, 246, 0.2)'}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BookOpen className="text-primary" size={20} />
                  </div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    {course.badge}
                  </span>
                </div>

                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                  {course.title}
                </h3>

                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  {course.description}
                </p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    <span className="text-foreground font-semibold">{course.lectures}</span> Lectures
                  </span>
                  <Link to="/courses">
                    <motion.button
                      className="flex items-center gap-2 text-primary font-medium text-sm hover:gap-3 transition-all"
                      whileHover={{ x: 2 }}
                    >
                      CLICK HERE
                      <ArrowRight size={16} />
                    </motion.button>
                  </Link>
                </div>
              </GlowCard>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
