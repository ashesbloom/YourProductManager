import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FadeIn } from '@/components/animations/FadeIn'
import { cn } from '@/lib/utils'

const faqs = [
  {
    question: 'Who is the AI-First PM course aimed at?',
    answer: 'The course is designed for aspiring Product Managers, career switchers from engineering or design backgrounds, and existing PMs looking to specialize in AI products. No prior PM experience is required, but basic tech literacy is helpful.',
  },
  {
    question: "I'm not an engineer. Do I need technical experience?",
    answer: 'No! While technical understanding helps, our course is designed to build your AI literacy from scratch. We focus on the PM perspective of AI—understanding capabilities, limitations, and how to work with engineering teams effectively.',
  },
  {
    question: 'What makes YPM different from generic bootcamps?',
    answer: 'Unlike generic bootcamps, we focus exclusively on AI-first product thinking. Our curriculum includes mock interviews, real case studies, and personalized feedback. Plus, you get lifetime access and direct mentorship opportunities.',
  },
  {
    question: 'Learning format & commitment?',
    answer: 'Self-paced video lectures with lifetime access. Most students complete the flagship course in 4-6 weeks with 5-7 hours per week commitment. All materials are available 24/7.',
  },
  {
    question: 'Life after the course?',
    answer: 'You\'ll receive a verified certificate, access to our alumni network, job board with curated PM opportunities, and ongoing community support. Many of our alumni have landed roles at top tech companies within 3-6 months.',
  },
]

function AccordionItem({ 
  question, 
  answer, 
  isOpen, 
  onClick 
}: { 
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void 
}) {
  return (
    <div className="border-b border-border">
      <button
        onClick={onClick}
        className="w-full py-5 flex items-center justify-between text-left group"
      >
        <span className="text-foreground font-medium pr-4 group-hover:text-primary transition-colors">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="text-muted-foreground" size={20} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-muted-foreground leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-20 md:py-32">
      <div className="container">
        <FadeIn className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === index}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              />
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.4} className="text-center mt-12">
          <Link to="/courses">
            <motion.button
              className="btn-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              SEE COURSES NOW
            </motion.button>
          </Link>
        </FadeIn>
      </div>
    </section>
  )
}
