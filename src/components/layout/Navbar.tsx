import { Link, useLocation } from 'react-router-dom'
import PillNav from '@/components/PillNav'
import { useMe } from '@/lib/me'

// Resources lives in the footer; the header keeps room for the profile button.
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/courses', label: 'Courses' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
  { href: '/login', label: 'Login' },
]

export function Navbar() {
  const location = useLocation()
  const { data: me } = useMe()
  const user = me?.user
  // Logged-in visitors get their course dashboard in place of Login, and a profile button beside it.
  const items = user ? navLinks.map((l) => (l.href === '/login' ? { href: '/dashboard', label: 'My Courses' } : l)) : navLinks
  const initial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-none print:hidden">
      <PillNav
        items={items}
        mobileItems={user ? [...items, { href: '/dashboard#profile', label: 'My Profile' }] : items}
        trailing={
          user && (
            <Link
              to="/dashboard#profile"
              title="My profile"
              aria-label="My profile"
              className="ml-4 flex h-9 w-9 items-center justify-center rounded-full border border-purple-400/50 bg-purple-500/20 font-['Montserrat'] text-sm font-bold text-purple-100 transition-colors hover:border-purple-300 hover:bg-purple-500/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
            >
              {initial}
            </Link>
          )
        }
        activeHref={location.pathname}
        className="custom-nav"
        ease="power2.easeOut"
        baseColor="#09090f"
        pillColor="#14141c"
        hoveredPillTextColor="#ffffff"
        pillTextColor="#ffffff"
      />
      <div className="w-full flex justify-center pointer-events-none select-none">
        <div
          className="w-full"
          style={{
            height: '1px',
            background: 'rgba(139, 92, 246, 0.35)',
          }}
        />
      </div>
    </header>
  )
}
