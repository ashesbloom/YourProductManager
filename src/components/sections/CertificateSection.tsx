import { Award, CheckCircle } from 'lucide-react'
import { FadeIn } from '@/components/animations/FadeIn'

export function CertificateSection() {
  return (
    <section className="py-20 md:py-32 bg-secondary/20">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <FadeIn direction="right">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">
              Certificate
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">
              Industry-Aligned Course Completion Certificate
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Issued only after 100% course completion, including all lectures, 
              required evaluations, mock interviews, and successful review of 
              the final personal product case study.
            </p>
            <ul className="space-y-3">
              {[
                'Complete the 50 lectures',
                'Pass all evaluations',
                'Complete mock interviews',
                'Submit product case study',
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-foreground">
                  <CheckCircle className="text-primary" size={18} />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </FadeIn>

          {/* Certificate Preview */}
          <FadeIn direction="left" delay={0.2}>
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              
              {/* Certificate Card */}
              <div className="relative glass-card p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-gradient flex items-center justify-center">
                  <Award className="text-background" size={32} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Certificate of Completion
                </h3>
                <p className="text-primary font-medium mb-4">
                  Your Product Manager
                </p>
                <div className="border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground">
                    Complete the 50 lectures to unlock this credential
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
