import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import './PillNav.css'

type PillNavItem = {
  label: string
  href: string
  ariaLabel?: string
}

type PillNavProps = {
  logo: string
  logoAlt?: string
  items: PillNavItem[]
  activeHref: string
  className?: string
  ease?: string
  baseColor?: string
  pillColor?: string
  hoveredPillTextColor?: string
  pillTextColor?: string
  onMobileMenuClick?: () => void
}

function isExternalLink(href: string) {
  return (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('//') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#')
  )
}

function isRouterLink(href: string) {
  return Boolean(href) && !isExternalLink(href)
}

export default function PillNav({
  logo,
  logoAlt = 'Logo',
  items,
  activeHref,
  className = '',
  ease = 'power3.easeOut',
  baseColor = '#0a0a0f',
  pillColor = '#f8fafc',
  hoveredPillTextColor = '#f8fafc',
  pillTextColor,
  onMobileMenuClick,
}: PillNavProps) {
  const resolvedPillTextColor = pillTextColor ?? baseColor
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement | null>(null)
  const mobileMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const menu = mobileMenuRef.current
    if (menu) gsap.set(menu, { visibility: 'hidden', opacity: 0, scaleY: 1 })
  }, [])

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen
    setIsMobileMenuOpen(newState)

    const hamburger = hamburgerRef.current
    const menu = mobileMenuRef.current

    if (hamburger) {
      const lines = hamburger.querySelectorAll('.hamburger-line')
      if (newState) {
        gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.3, ease })
        gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.3, ease })
      } else {
        gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease })
        gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.3, ease })
      }
    }

    if (menu) {
      if (newState) {
        gsap.set(menu, { visibility: 'visible' })
        gsap.fromTo(
          menu,
          { opacity: 0, y: 10, scaleY: 1 },
          {
            opacity: 1,
            y: 0,
            scaleY: 1,
            duration: 0.3,
            ease,
            transformOrigin: 'top center',
          }
        )
      } else {
        gsap.to(menu, {
          opacity: 0,
          y: 10,
          scaleY: 1,
          duration: 0.2,
          ease,
          transformOrigin: 'top center',
          onComplete: () => {
            gsap.set(menu, { visibility: 'hidden' })
          },
        })
      }
    }

    onMobileMenuClick?.()
  }

  const cssVars = {
    '--base': baseColor,
    '--pill-bg': pillColor,
    '--hover-text': hoveredPillTextColor,
    '--pill-text': resolvedPillTextColor,
  } as CSSProperties

  return (
    <div className="pill-nav-container">
      <nav className={`pill-nav ${className}`} aria-label="Primary" style={cssVars}>
        <Link className="pill-logo" to="/" aria-label="Home">
          <img src={logo} alt={logoAlt} />
        </Link>

        <div className="pill-nav-items desktop-only">
          <ul className="pill-list" role="menubar">
            {items.map((item, i) => {
              const className = `pill${activeHref === item.href ? ' is-active' : ''}${item.href === '/login' ? ' pill-login' : ''}`
              const label = <span className="pill-label">{item.label}</span>
              return (
                <li key={item.href || `item-${i}`} role="none">
                  {isRouterLink(item.href) ? (
                    <Link role="menuitem" to={item.href} className={className} aria-label={item.ariaLabel || item.label}>
                      {label}
                    </Link>
                  ) : (
                    <a role="menuitem" href={item.href} className={className} aria-label={item.ariaLabel || item.label}>
                      {label}
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        <button
          className="mobile-menu-button mobile-only"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          ref={hamburgerRef}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      </nav>

      <div className="mobile-menu-popover mobile-only" ref={mobileMenuRef} style={cssVars}>
        <ul className="mobile-menu-list">
          {items.map((item, i) => (
            <li key={item.href || `mobile-item-${i}`}>
              {isRouterLink(item.href) ? (
                <Link
                  to={item.href}
                  className={`mobile-menu-link${activeHref === item.href ? ' is-active' : ''}`}
                  onClick={toggleMobileMenu}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  href={item.href}
                  className={`mobile-menu-link${activeHref === item.href ? ' is-active' : ''}`}
                  onClick={toggleMobileMenu}
                >
                  {item.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
