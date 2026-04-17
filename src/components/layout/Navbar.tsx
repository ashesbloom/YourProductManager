import { useLocation } from 'react-router-dom'
import PillNav from '@/components/PillNav'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/courses', label: 'Courses' },
  { href: '/contact', label: 'Contact' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/blog', label: 'Blog' },
  { href: '/resources', label: 'Resources' },
  { href: '/login', label: 'Login' },
]


export function Navbar() {
  const location = useLocation()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-none">
      <PillNav
        logo="/vite.svg"
        logoAlt="YPM Logo"
        items={navLinks}
        activeHref={location.pathname}
        className="custom-nav"
        ease="power2.easeOut"
        baseColor="#09090f"
        pillColor="#fde7ff"
        hoveredPillTextColor="#ffffff"
        pillTextColor="#3a0f53"
        initialLoadAnimation={false}
      />
      <div className="w-full flex justify-center pointer-events-none select-none">
        <div
          className="w-full"
          style={{
            height: '5px',
            marginTop: '-2px',
            borderRadius: '3px',
            opacity: 0.7,
            boxShadow: '0 1px 8px 0 #a78bfa44',
            background:
              'linear-gradient(90deg, rgba(167,139,250,0) 0%, #a78bfa 10%, #f472b6 50%, #a78bfa 90%, rgba(167,139,250,0) 100%)',
          }}
        />
      </div>
    </header>
  )
}
