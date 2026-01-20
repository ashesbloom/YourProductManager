import { FadeIn } from '@/components/animations/FadeIn'
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerContainer'

const alumni = [
  { name: 'Priya S.', role: 'Senior PM', company: 'Google', initial: 'P' },
  { name: 'Rahul K.', role: 'Product Lead', company: 'Microsoft', initial: 'R' },
  { name: 'Ananya M.', role: 'AI PM', company: 'Meta', initial: 'A' },
  { name: 'Vikram R.', role: 'Tech PM', company: 'Amazon', initial: 'V' },
  { name: 'Neha G.', role: 'Group PM', company: 'Flipkart', initial: 'N' },
]

export function AlumniSection() {
  return (
    <section className="py-20">
      <div className="container">
        <FadeIn className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Join our Alumni at <span className="gradient-text">Global Tech Leaders</span>
          </h2>
        </FadeIn>

        <StaggerContainer className="flex flex-wrap justify-center gap-6 md:gap-10">
          {alumni.map((person, index) => (
            <StaggerItem key={index}>
              <div className="flex flex-col items-center text-center group">
                {/* Avatar */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-xl md:text-2xl font-bold text-white">
                    {person.initial}
                  </span>
                </div>
                {/* Info */}
                <h4 className="font-semibold text-foreground text-sm">
                  {person.name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {person.role}
                </p>
                <p className="text-xs text-primary font-medium">
                  {person.company}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
