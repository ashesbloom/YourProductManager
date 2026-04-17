import { motion } from 'framer-motion'
import { Mail, MessageSquare, User } from 'lucide-react'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function Contact() {
  return (
    <div className="bg-black text-white">
      {/* Hero */}
      <section className="pt-28 pb-14 px-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm font-semibold">
              <MessageSquare size={16} className="text-primary" />
              Contact Us
            </span>

            <h1 className="mt-6 text-4xl md:text-6xl font-black tracking-tight">
              Let’s talk about your
              <span className="bg-clip-text text-transparent bg-linear-to-r from-purple-400 via-indigo-400 to-purple-400">
                {' '}PM journey
              </span>
            </h1>

            <p className="mt-4 text-white/70 text-base md:text-lg max-w-3xl mx-auto">
              Share your goals or questions. We’ll reply with the clearest next step — courses, mentorship, or mock interviews.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left: Info */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="rounded-3xl bg-[#07070c] border border-purple-500/30 shadow-[0_16px_35px_-20px_rgba(124,58,237,0.45)] p-8 md:p-10"
          >
            <h2 className="text-2xl md:text-3xl font-black">What should you send?</h2>
            <p className="mt-3 text-white/70 leading-relaxed">
              A short note is enough. Include your current role, target role, and what you want help with.
            </p>

            <div className="mt-10 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-primary/20 flex items-center justify-center border border-purple-500/30 shrink-0">
                  <Mail size={18} className="text-primary" />
                </div>
                <div>
                  <div className="font-bold">Email</div>
                  <div className="text-white/70 text-sm">We respond within 24–48 hours.</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-primary/20 flex items-center justify-center border border-purple-500/30 shrink-0">
                  <User size={18} className="text-primary" />
                </div>
                <div>
                  <div className="font-bold">Best for</div>
                  <div className="text-white/70 text-sm">Course guidance, mentorship fit, and mock interview scheduling.</div>
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-2xl bg-[#050508] border border-purple-500/25 p-5">
              <div className="text-sm text-white/70 leading-relaxed">
                Note: Mock interviews are guidance-focused and don’t guarantee outcomes.
              </div>
            </div>
          </motion.div>

          {/* Right: Form */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-3xl bg-linear-to-r from-purple-600 via-indigo-600 to-purple-600 p-px"
          >
            <div className="rounded-3xl bg-[#050508] p-8 md:p-10 border border-purple-500/30">
              <h2 className="text-2xl md:text-3xl font-black">Send a message</h2>
              <p className="mt-3 text-white/70">
                Fill this out and we’ll get back to you.
              </p>

              <form
                className="mt-8 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                }}
              >
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">Name</label>
                  <input
                    type="text"
                    className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Your name"
                    autoComplete="name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="you@domain.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">Message</label>
                  <textarea
                    className="w-full min-h-32 p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Tell us what you’re aiming for and what you need help with."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-white text-[#0a0a0f] font-black hover:bg-white/90 transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
