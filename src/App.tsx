import { Suspense, lazy, useEffect, type ReactNode } from 'react'
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { pageView } from '@/lib/analytics'

const Home = lazy(() => import('@/pages/Home'))
const Courses = lazy(() => import('@/pages/Courses'))
const Blog = lazy(() => import('@/pages/Blog'))
const Resources = lazy(() => import('@/pages/Resources'))
const Contact = lazy(() => import('@/pages/Contact'))
const About = lazy(() => import('@/pages/About'))
const Privacy = lazy(() => import('@/pages/Privacy'))
const Terms = lazy(() => import('@/pages/Terms'))
const Verify = lazy(() => import('@/pages/Verify'))
const Login = lazy(() => import('@/pages/Login'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Learn = lazy(() => import('@/pages/Learn'))
const RefundPolicy = lazy(() => import('@/pages/RefundPolicy'))
const DeliveryPolicy = lazy(() => import('@/pages/DeliveryPolicy'))
const Admin = lazy(() => import('@/pages/Admin'))
const Certificate = lazy(() => import('@/pages/Certificate'))
const NotFound = lazy(() => import('@/pages/NotFound'))

/**
 * Sits inside <Suspense> so its effect runs once the lazy page below it has
 * mounted — otherwise there would be no [data-reveal] elements to find.
 */
function RevealScope({ children }: { children: ReactNode }) {
  const { pathname, hash } = useLocation()
  // The router keeps scroll position across routes; a footer link would open the next page at its bottom.
  // A hash (the footer's /#book) lands on that section instead.
  useEffect(() => {
    // Instant, not the page's smooth scroll: ScrollTrigger.refresh() below would cancel an animated one.
    const target = hash && document.getElementById(hash.slice(1))
    if (target) target.scrollIntoView({ behavior: 'instant' })
    else window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])
  useEffect(() => pageView(pathname), [pathname])
  useScrollReveal(pathname)
  return <>{children}</>
}

// Both courses live on /courses now; old /courses/<id> links land on that course's column.
function CourseRedirect() {
  const { courseId } = useParams()
  return <Navigate to={`/courses#${courseId}`} replace />
}

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-primary" />
    </div>
  )
}

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Suspense fallback={<RouteFallback />}>
          <RevealScope>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:courseId" element={<CourseRedirect />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/certificate" element={<Certificate />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/learn/:courseId" element={<Learn />} />
              <Route path="/learn/:courseId/:lectureId" element={<Learn />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/delivery-policy" element={<DeliveryPolicy />} />
              {/* Home links to these; real pages arrive in Phase 2 / the UI overhaul. */}
              <Route path="/coaching" element={<Navigate to="/contact" replace />} />
              <Route path="/apply" element={<Navigate to="/courses" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RevealScope>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

export default App
