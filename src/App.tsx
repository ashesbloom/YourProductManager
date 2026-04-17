import { Routes, Route } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import Home from '@/pages/Home'
import Courses from '@/pages/Courses'
import Jobs from '@/pages/Jobs'
import CourseContent from '@/pages/CourseContent'
import Blog from '@/pages/Blog'
import Resources from '@/pages/Resources'
import Contact from '@/pages/Contact'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:courseId" element={<CourseContent />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/resources" element={<Resources />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
