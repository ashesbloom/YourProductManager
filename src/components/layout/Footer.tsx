import { Link } from 'react-router-dom'
import { MessageCircle, Phone, Mail } from 'lucide-react'

const quickLinks = [
  { href: '/courses', label: 'Courses' },
  { href: '/coaching', label: '1:1 Coaching' },
  { href: '/jobs', label: 'Job Board' },
  { href: '/#faq', label: 'FAQ' },
]

const legalLinks = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/verify', label: 'Certificate Verification' },
]

export function Footer() {
  return (
    <footer className="bg-secondary/50 border-t border-border">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent-gradient flex items-center justify-center">
                <span className="text-background font-bold text-lg">YPM</span>
              </div>
              <span className="font-semibold text-foreground">
                Your Product Manager
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              The Vision Enhancer for ambitious professionals. Master the frameworks
              to build, scale, and lead AI products.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
                >
                  <MessageCircle size={16} className="text-primary" />
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
                >
                  <Phone size={16} className="text-primary" />
                  Schedule a Call
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@yourpm.com"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
                >
                  <Mail size={16} className="text-primary" />
                  Email Us
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
