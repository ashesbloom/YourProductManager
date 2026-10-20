import { useLocation } from 'react-router-dom'
import PillNav from '@/components/PillNav'
import { useMe } from '@/lib/me'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/courses', label: 'Courses' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/resources', label: 'Resources' },
  { href: '/contact', label: 'Contact' },
  { href: '/login', label: 'Login' },
]


export function Navbar() {
  const location = useLocation()
  const { data: me } = useMe()
  // Logged-in visitors get their course dashboard in place of Login.
  const items = me?.user ? navLinks.map((l) => (l.href === '/login' ? { href: '/dashboard', label: 'My Courses' } : l)) : navLinks

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-none">
      <PillNav
        items={items}
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
