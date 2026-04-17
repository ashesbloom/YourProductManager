import { motion } from 'framer-motion'

const fadeIn = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

const posts = [
  {
    title: 'How to Think Like a Product Manager',
    description: 'A practical framework to break down problems, define outcomes, and ship with clarity.',
    meta: '5 min read',
  },
  {
    title: 'Breaking Into PM (Without a PM Title)',
    description: 'Portfolio, internal transfers, and real-world projects that show product thinking.',
    meta: '7 min read',
  },
  {
    title: 'AI Product Fundamentals',
    description: 'The basics: data, models, evaluation, and how to make tradeoffs in AI-first products.',
    meta: '6 min read',
  },
]

export default function Blog() {
  return (
    <div className="bg-black text-foreground min-h-screen">
      <section className="pt-28 pb-10">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.45 }}
          >
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">Blog</h1>
            <p className="mt-3 text-muted-foreground text-base md:text-lg max-w-2xl">
              Short, actionable notes on product thinking, career moves, and building in the AI era.
            </p>
          </motion.div>

          <motion.div
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            {posts.map((post) => (
              <div
                key={post.title}
                className="rounded-2xl border border-purple-500/45 bg-black p-5 transition-all duration-300 hover:-translate-y-1 hover:border-purple-400 hover:shadow-[0_18px_38px_-20px_rgba(168,85,247,0.75)]"
              >
                <div className="text-sm text-muted-foreground">{post.meta}</div>
                <div className="mt-2 font-bold text-foreground">{post.title}</div>
                <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {post.description}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  )
}
