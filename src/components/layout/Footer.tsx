import { Link } from 'react-router-dom'
import { Mail, Phone, Linkedin, Youtube, X, MessageCircle } from 'lucide-react'

const quickLinks = [
  { href: '/courses', label: 'Courses' },
  { href: '/coaching', label: '1:1 Coaching' },
  { href: '/jobs', label: 'Job Board' },
  { href: '/learnings', label: 'Learnings' },
  { href: '/#faq', label: 'FAQ' },
]

const legalLinks = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/verify', label: 'Certificate Verification' },
]

export function Footer() {
  return (
    <footer className="bg-background text-foreground border-t border-white/10">
      <div className="container py-3">
        <div className="overflow-x-auto">
          <div className="min-w-225 grid grid-cols-5 gap-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-start gap-4">
              <div className="w-8 h-8 bg-white rounded-sm shrink-0" aria-hidden="true" />
            </Link>
            <p className="mt-2 text-muted-foreground text-sm leading-snug max-w-xs">
              Your Product Manager — The
              <br />
              Vision Enhancer for ambitious
              <br />
              professionals.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base font-bold">Quick Links</h4>
            <ul className="mt-1 space-y-1">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <div className="flex items-center gap-3">
              <span className="text-base font-bold">Help</span>
            </div>
            <p className="mt-1 text-muted-foreground text-sm leading-snug max-w-xs">
              Have a question or need help
              <br />
              choosing the right course?
            </p>

            <a
              href="#"
              className="mt-1 inline-flex items-center justify-center gap-3 h-8 px-4 rounded-lg bg-green-600 text-white font-bold hover:bg-green-500 transition-colors w-full sm:w-auto"
            >
              <MessageCircle size={16} />
              WhatsApp Support
            </a>

            <a
              href="mailto:support@yourpm.in"
              className="mt-1 flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <Mail size={16} className="text-muted-foreground" />
              support@yourpm.in
            </a>
          </div>

          {/* Contact Us */}
          <div>
            <h4 className="text-base font-bold">Contact Us</h4>
            <Link
              to="/coaching"
              className="btn-purple-animated mt-1 inline-flex items-center justify-center gap-3 h-8 px-4 rounded-lg text-primary-foreground font-bold hover:opacity-90 transition-opacity w-full"
            >
              <Phone size={16} />
              Schedule a Call
            </Link>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-base font-bold">Legal</h4>
            <ul className="mt-1 space-y-1">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          </div>
        </div>

        <div className="mt-2 border-t border-white/10 pt-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div className="text-muted-foreground text-sm">
            © 2026 Your Product Manager. All Rights Reserved.
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://www.linkedin.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/15 transition-colors flex items-center justify-center"
            >
              <Linkedin size={15} />
            </a>
            <a
              href="https://www.youtube.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
              className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/15 transition-colors flex items-center justify-center"
            >
              <Youtube size={15} />
            </a>
            <a
              href="https://x.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="X"
              className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/15 transition-colors flex items-center justify-center"
            >
              <X size={15} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
