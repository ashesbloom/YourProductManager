import { Link } from 'react-router-dom'
import { btnPrimary } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="bg-black px-4 pt-40 pb-32 text-center text-white">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">404</p>
      <h1 className="mt-3 text-3xl md:text-4xl font-bold">This page doesn't exist</h1>
      <p className="mt-4 text-white/60">The link may be broken, or the page may have moved.</p>
      <Link to="/" className={`${btnPrimary} mt-8`}>
        Back to home
      </Link>
    </div>
  )
}
