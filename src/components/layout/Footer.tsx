import { Link } from 'react-router-dom'
import { ArrowUpRight, Linkedin, Mail, MessageCircle, Phone, Youtube, X } from 'lucide-react'
import { CALENDLY_URL, SUPPORT_EMAIL, WHATSAPP_URL } from '@/lib/links'

const columns = [
  {
    heading: 'Explore',
    links: [
      { href: '/courses', label: 'Courses' },
      { href: '/about', label: 'About' },
      { href: '/blog', label: 'Blog' },
      { href: '/resources', label: 'Resources' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms & Conditions' },
      { href: '/verify', label: 'Certificate Verification' },
    ],
  },
]

const socials = [
  { href: 'https://www.linkedin.com/', label: 'LinkedIn', icon: Linkedin },
  { href: 'https://www.youtube.com/', label: 'YouTube', icon: Youtube },
  { href: 'https://x.com/', label: 'X', icon: X },
]

const headingClass = 'text-xs font-semibold uppercase tracking-[0.18em] text-white/40'
const linkClass = 'text-sm text-white/65 transition-colors hover:text-white'

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background">
      <div className="container py-14">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[1.3fr_1fr_1fr_1.3fr]">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-flex items-center gap-3" aria-label="Your Product Manager home">
              <img src="/vite.svg" alt="" className="h-8 w-8" />
              <span className="font-['Montserrat'] text-sm font-black uppercase tracking-wide text-white/90">
                Your Product Manager
              </span>
            </Link>
            <div className="mt-6 flex items-center gap-x-3">
              {socials.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/60 transition-colors hover:border-primary/50 hover:text-white"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h4 className={headingClass}>{col.heading}</h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link to={link.href} className={linkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="col-span-2 md:col-span-1">
            <h4 className={headingClass}>Get in touch</h4>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href={CALENDLY_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-x-2 text-sm font-semibold text-[#c084fc] transition-colors hover:text-white"
                >
                  <Phone size={15} />
                  Schedule a 1:1 Call
                  <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </li>
              <li>
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-x-2 ${linkClass}`}>
                  <MessageCircle size={15} />
                  WhatsApp Support
                </a>
              </li>
              <li>
                <a href={`mailto:${SUPPORT_EMAIL}`} className={`inline-flex items-center gap-x-2 ${linkClass}`}>
                  <Mail size={15} />
                  {SUPPORT_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-white/40">
          © {new Date().getFullYear()} Your Product Manager. All Rights Reserved.
        </div>
      </div>
    </footer>
  )
}
