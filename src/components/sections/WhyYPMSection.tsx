import { UserCheck, Star, Brain, Cpu, TrendingUp } from 'lucide-react'
import { FadeIn } from '@/components/animations/FadeIn'
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerContainer'
import { GlowCard } from '@/components/animations/GlowCard'

const features = [
  {
    icon: UserCheck,
    title: 'Interview Ready',
    description: 'Three simulated 1:1 PM interviews and a personal project review to conquer recruitment loops.',
    badge: null,
  },
  {
    icon: Star,
    title: 'Elite Presence',
    description: 'Professional LinkedIn and resume optimization tailored for AI Product Manager hiring standards.',
    badge: 'FREE',
  },
  {
    icon: Brain,
    title: 'Built for Judgment',
    description: 'Develop professional product intuition to navigate ambiguity rather than following rigid checklists.',
    badge: null,
  },
  {
    icon: Cpu,
    title: 'AI-First Strategy',
    description: 'Master a world where AI drives decision-making, not just features.',
    badge: null,
  },
  {
    icon: TrendingUp,
    title: 'Evidence Over Hype',
    description: 'Apply the specific mental models used by the top 1% of PMs—no buzzwords, just results.',
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
      </div>
    </section>
  )
}
