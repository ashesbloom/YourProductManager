import { Suspense, lazy, useEffect, type ReactNode } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const Home = lazy(() => import('@/pages/Home'))
const Courses = lazy(() => import('@/pages/Courses'))
const CourseContent = lazy(() => import('@/pages/CourseContent'))
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
const NotFound = lazy(() => import('@/pages/NotFound'))

/**
 * Sits inside <Suspense> so its effect runs once the lazy page below it has
 * mounted — otherwise there would be no [data-reveal] elements to find.
 */
function RevealScope({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  // The router keeps scroll position across routes; a footer link would open the next page at its bottom.
  useEffect(() => {
    // Instant, not the page's smooth scroll: ScrollTrigger.refresh() below would cancel an animated one.
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  useScrollReveal(pathname)
  return <>{children}</>
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
              <Route path="/courses/:courseId" element={<CourseContent />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
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
