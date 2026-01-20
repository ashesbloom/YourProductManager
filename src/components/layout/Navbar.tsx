import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ArrowUpRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/courses', label: 'Courses' },
  { href: '/contact', label: 'Contact Us' },
  { href: '/jobs', label: 'Job Boards' },
]

const moreLinks = [
  { href: '/blog', label: 'Blog' },
  { href: '/resources', label: 'Resources' },
  { href: '/login', label: 'Login' },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const location = useLocation()
  
  // Refs for click outside detection
  const moreDropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const mobileBtnRef = useRef<HTMLButtonElement>(null)
  
  // Ref for scroll tracking to avoid re-renders just for storing the value
  const lastScrollY = useRef(0)

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Determine if scrolled (bg style)
      setIsScrolled(currentScrollY > 20)

      // Determine visibility (hide on scroll down, show on scroll up)
      // Only hide if we've scrolled down and are not at the very top
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsHidden(true)
      } else {
        setIsHidden(false)
      }
      
      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Click outside effect
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close More dropdown
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false)
      }
      
      // Close Mobile menu (if click is outside menu AND outside button)
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current && 
        !mobileMenuRef.current.contains(event.target as Node) &&
        mobileBtnRef.current &&
        !mobileBtnRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobileMenuOpen, isMoreOpen])

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsMoreOpen(false)
  }, [location])

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pt-4 transition-transform duration-300",
          isHidden ? "-translate-y-full" : "translate-y-0"
        )}
      >
      {/* Pill-shaped navbar container */}
      <nav 
        className={cn(
          'navbar-pill',
          isScrolled && 'navbar-scrolled'
        )}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-accent-gradient flex items-center justify-center">
            <span className="text-background font-bold text-sm">YPM</span>
          </div>
          <span className="hidden sm:block font-semibold text-foreground text-sm">
            YourProductManager
          </span>
        </Link>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200',
                location.pathname === link.href
                  ? 'text-foreground bg-white/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}
            >
              {link.label}
            </Link>
          ))}
          
          {/* More dropdown */}
          <div className="relative" ref={moreDropdownRef}>
            <button
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 flex items-center gap-1',
                isMoreOpen
                  ? 'text-foreground bg-white/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}
            >
              More
              <ChevronDown 
                size={14} 
                className={cn('transition-transform duration-200', isMoreOpen && 'rotate-180')}
              />
            </button>
            
            <AnimatePresence>
              {isMoreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-2 w-48 py-2 navbar-dropdown rounded-2xl border border-white/10 shadow-xl overflow-hidden backdrop-blur-md"
                >
                  {moreLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right side: CTA + Mobile Menu */}
        <div className="flex items-center gap-3">
          {/* CTA Button - Desktop */}
          <Link 
            to="/coaching" 
            className="hidden md:flex items-center gap-2 pl-5 pr-1.5 py-1.5 bg-foreground text-background rounded-full font-medium text-sm hover:bg-foreground/90 transition-colors group"
          >
            <span>Schedule a meeting</span>
            <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center group-hover:bg-primary/80 transition-colors">
              <ArrowUpRight size={14} className="text-foreground" />
            </span>
          </Link>

          {/* Mobile Menu Button - OPTIMIZED */}
          <button
            ref={mobileBtnRef}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden mobile-menu-btn"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>
      </header>

      {/* Mobile Drawer - Right Side (outside header to avoid transform issues) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Overlay Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden drawer-overlay"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Drawer Panel */}
            <motion.div
              ref={mobileMenuRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="md:hidden mobile-drawer"
            >
              {/* Drawer Header */}
              <div className="drawer-header">
                <span className="text-sm font-semibold text-foreground">Menu</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="drawer-close-btn"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>
              
              {/* Navigation Links */}
              <div className="drawer-content">
                {[...navLinks, ...moreLinks].map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      'mobile-nav-link',
                      location.pathname === link.href && 'active'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              
              {/* CTA Button */}
              <div className="drawer-footer">
                <Link
                  to="/coaching"
                  className="mobile-cta-btn"
                >
                  <span>Schedule a meeting</span>
                  <span className="icon-wrapper">
                    <ArrowUpRight size={14} />
                  </span>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
