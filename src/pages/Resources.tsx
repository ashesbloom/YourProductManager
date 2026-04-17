import { motion } from 'framer-motion'

const fadeIn = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

const resources = [
  {
    title: 'PM Resume Checklist',
    description: 'A quick checklist to make your resume read like a product story.',
    tag: 'Career',
  },
  {
    title: 'Product Case Study Template',
    description: 'A simple structure you can reuse for portfolio projects and interviews.',
    tag: 'Portfolio',
  },
  {
    title: 'AI Product Glossary',
    description: 'Common terms and definitions you’ll keep hearing in AI-first teams.',
    tag: 'AI',
  },
]

export default function Resources() {
  return (
    <div className="bg-background text-foreground">
      <section className="pt-28 pb-10">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.45 }}
          >
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">Resources</h1>
            <p className="mt-3 text-muted-foreground text-base md:text-lg max-w-2xl">
              Handy templates, checklists, and references you can use immediately.
            </p>
          </motion.div>

          <motion.div
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            {resources.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-purple-500/25 bg-[#07070c] shadow-[0_12px_30px_-18px_rgba(124,58,237,0.45)] p-5"
              >
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/25 text-xs font-semibold text-muted-foreground">
                  {item.tag}
                </div>
                <div className="mt-3 font-bold text-foreground">{item.title}</div>
                <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  )
}
