import { UserCheck, Star, Brain, Cpu, TrendingUp, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FadeIn } from '@/components/animations/FadeIn'
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerContainer'
import { GlowCard } from '@/components/animations/GlowCard'

const features = [
  {
    icon: UserCheck,
    title: 'Interview Ready',
    description:
      'Three simulated 1:1 PM interviews and a personal project review to conquer recruitment loops including AI-native case studies.',
    badge: null,
  },
  {
    icon: Star,
    title: 'Elite Presence',
    description:
      'FREE Professional LinkedIn and resume optimization to bridge the AI-talent gap and meet 2026 hiring standards.',
    badge: 'FREE',
  },
  {
    icon: Brain,
    title: 'Strategic Judgment',
    description:
      'Develop the professional clarity required to navigate high-stakes ambiguity. We move you beyond rigid checklists to the calibrated intuition used by the top 1% of product leaders.',
    badge: null,
  },
  {
    icon: Cpu,
    title: 'Systems-First Thinking',
    description:
      'Master the mental models to connect product architecture, market dynamics, and sustainable business models into a single, cohesive strategy.',
    badge: null,
  },
  {
    icon: TrendingUp,
    title: 'Global Influence & Stakeholder Mastery',
    description:
      'Master the art of high-level persuasion. Learn how to align cross-functional teams, manage complex executive boardrooms, and drive consensus for high-stakes product visions across global time zones.',
    badge: null,
  },
  {
    icon: Compass,
    title: 'The "Strategy First" Discovery',
    description:
      'Accelerate your trajectory with a 15-minute "Career Strategy" audit. We’ll map out your current blind spots and define a clear path to your next high-stakes leadership role.',
    badge: null,
  },
]

export function WhyYPMSection() {
  return (
    <section className="py-20 md:py-32">
      <div className="container">
        {/* Section Header */}
        <FadeIn className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Why <span className="gradient-text">Your Product Manager</span>?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to transform into a world-class Product Manager
          </p>
        </FadeIn>

        {/* Feature Cards */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <StaggerItem key={index}>
              <GlowCard className="h-full">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <feature.icon size={24} />
                  </div>
                  {feature.badge && (
                    <span className="ml-auto px-2 py-1 text-xs font-semibold bg-accent text-accent-foreground rounded">
                      {feature.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </GlowCard>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <div className="mt-12 flex justify-center">
          <Link to="/coaching" className="btn-primary btn-small text-center">
            Schedule free 15 minute call
          </Link>
        </div>
      </div>
    </section>
  )
}
