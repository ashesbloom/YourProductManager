import { useState } from 'react'
import { motion } from 'framer-motion'
import { api, ApiError } from '@/lib/api'
import { ArrowUpRight, Calendar, Mail, MessageCircle, Send } from 'lucide-react'
import { CALENDLY_URL, CONTACT_EMAIL, PHONE, SUPPORT_EMAIL, WHATSAPP_URL } from '@/lib/links'

const CHANNELS = [
  {
    icon: Calendar,
    title: 'Schedule a 1:1 Call',
    body: 'Pick a time that works for you to talk through your goals.',
    cta: 'Book a slot',
    href: CALENDLY_URL,
    featured: true,
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    body: `${PHONE}. Quick questions about courses, coaching or mock interviews.`,
    cta: 'Start a chat',
    href: WHATSAPP_URL,
    featured: false,
  },
  {
    icon: Mail,
    title: 'Email',
    body: `${CONTACT_EMAIL} for coaching, mock interviews and partnerships. Already enrolled? ${SUPPORT_EMAIL} for access, payments and certificates. We reply within 24–48 hours.`,
    cta: 'Send an email',
    href: `mailto:${CONTACT_EMAIL}`,
    featured: false,
  },
]

const TOPICS = ['Courses', '1:1 Coaching', 'Mock Interview', 'Other']

const field =
  'block w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/35 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'
const label = 'mb-2 block text-sm font-semibold text-white/75'

export default function Contact() {
  const [status, setStatus] = useState('idle')
  return (
    <div className="bg-black text-white">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-32 pb-14">
        <div className="pointer-events-none absolute left-1/2 top-10 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <motion.div
          className="relative mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Contact</span>
          <h1 className="mt-4 font-['Montserrat'] text-4xl md:text-6xl font-black uppercase tracking-tight">
            Let’s talk about your <span className="text-[#FBBF24]">PM journey</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/65">
            Share your goals or questions. We’ll reply with the clearest next step — courses, mentorship, or
            mock interviews.
          </p>
        </motion.div>
      </section>

      {/* Channels */}
      <section className="pb-16">
        <div className="container grid md:grid-cols-3 gap-x-5 gap-y-5">
          {CHANNELS.map(({ icon: Icon, title, body, cta, href, featured }) => (
            <a
              data-reveal
              key={title}
              href={href}
              target={href.startsWith('mailto:') ? undefined : '_blank'}
              rel="noreferrer"
              className={`group flex flex-col rounded-3xl border p-7 transition-colors ${
                featured
                  ? 'border-brand/60 bg-brand/15 hover:border-brand'
                  : 'border-white/10 bg-[#07070c] hover:border-purple-500/40'
              }`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand">
                <Icon size={22} className="text-white" />
              </span>
              <h2 className="mt-6 text-xl font-bold">{title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-white/60">{body}</p>
              <span className="mt-6 inline-flex items-center gap-x-1.5 text-sm font-semibold text-[#FBBF24]">
                {cta}
                <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Form */}
      <section className="px-4 pb-24">
        <div data-reveal className="mx-auto max-w-3xl rounded-3xl border border-brand/40">
          <div className="rounded-3xl bg-[#07070c] p-7 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold">Send a message</h2>
            <p className="mt-2 text-white/60">
              Include your current role, target role, and what you want help with. We reply by email.
            </p>

            <form
              className="mt-8 grid sm:grid-cols-2 gap-x-4 gap-y-5"
              onSubmit={async (e) => {
                e.preventDefault()
                const form = e.currentTarget
                setStatus('sending')
                try {
                  await api('/api/contact', Object.fromEntries(new FormData(form)))
                  form.reset()
                  setStatus('sent')
                } catch (err) {
                  setStatus(err instanceof ApiError ? err.message : `Could not send. Please email ${CONTACT_EMAIL} directly.`)
                }
              }}
            >
              <div>
                <label htmlFor="c-name" className={label}>Name</label>
                <input id="c-name" name="name" className={`${field} h-12`} placeholder="Your name" autoComplete="name" required />
              </div>
              <div>
                <label htmlFor="c-email" className={label}>Email</label>
                <input id="c-email" name="email" type="email" className={`${field} h-12`} placeholder="you@domain.com" autoComplete="email" required />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="c-topic" className={label}>Topic</label>
                <select id="c-topic" name="topic" className={`${field} h-12 [&>option]:bg-[#07070c]`} defaultValue={TOPICS[0]}>
                  {TOPICS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="c-message" className={label}>Message</label>
                <textarea
                  id="c-message"
                  name="message"
                  className={`${field} min-h-36 py-3`}
                  placeholder="Tell us what you’re aiming for and what you need help with."
                  required
                />
              </div>
              <div className="sm:col-span-2">
                {/* Honeypot: hidden from people, filled in by bots. */}
                <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
                <button type="submit" disabled={status === 'sending'} className="btn-primary h-12 justify-center px-8 disabled:opacity-60">
                  <Send size={17} /> {status === 'sending' ? 'Sending…' : 'Send message'}
                </button>
                {status === 'sent' ? (
                  <p role="status" className="mt-4 text-sm font-semibold text-green-400">
                    Message sent. We’ll reply to your email within 24–48 hours.
                  </p>
                ) : status !== 'idle' && status !== 'sending' ? (
                  <p role="alert" className="mt-4 text-sm text-red-300">
                    {status}
                  </p>
                ) : null}
                <p className="mt-4 text-xs text-white/40">
                  Mock interviews are guidance-focused and don’t guarantee outcomes.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}
