import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { 
  ArrowRight, UserCheck, Star, Brain, Cpu, TrendingUp, 
  Award, CheckCircle, Quote, Clock, User, Phone, Briefcase,
  ChevronRight, Shield, ChevronDown
} from 'lucide-react'
import { CountUp } from '../components/animations/CountUp'
import { VideoPreviewSection } from '../components/sections/VideoPreviewSection'
import CurvedLoop from '../components/CurvedLoop'

// Data
const stats = [
  { value: 31, prefix: '₹', suffix: 'L+', label: 'Average Salary' },
  { value: 50, prefix: '', suffix: '+', label: 'Expert Lectures' },
  { value: 100, prefix: '', suffix: '%', label: 'Career Focused' },
]

const features = [
  { icon: UserCheck, title: 'Interview Ready', description: 'Three simulated 1:1 PM interviews and a personal project review.' },
  { icon: Star, title: 'Elite Presence', description: 'Professional LinkedIn and resume optimization.', badge: 'FREE' },
  { icon: Brain, title: 'Built for Judgment', description: 'Develop product intuition to navigate ambiguity.' },
  { icon: Cpu, title: 'AI-First Strategy', description: 'Master AI-driven decision-making.' },
  { icon: TrendingUp, title: 'Evidence Over Hype', description: 'Mental models used by the top 1% of PMs.' },
]

const courses = [
  { badge: 'FLAGSHIP', title: 'AI PRODUCT MANAGEMENT', description: 'Master AI-first products.', lectures: 50 },
  { badge: 'FOUNDATION', title: 'PM BASICS', description: 'Build PM fundamentals.', lectures: 20 },
]

const alumni = [
  { name: 'Priya S.', role: 'Senior PM', company: 'Google', initial: 'P' },
  { name: 'Rahul K.', role: 'Product Lead', company: 'Microsoft', initial: 'R' },
  { name: 'Ananya M.', role: 'AI PM', company: 'Meta', initial: 'A' },
  { name: 'Vikram R.', role: 'Tech PM', company: 'Amazon', initial: 'V' },
  { name: 'Neha G.', role: 'Group PM', company: 'Flipkart', initial: 'N' },
]

const testimonials = [
  { quote: 'From software engineer to AI PM at a Series B startup in 4 months.', author: 'Arjun S.' },
  { quote: 'The mock interviews gave me the confidence I needed.', author: 'Meera P.' },
  { quote: 'Best investment in my career. Now leading a team of 5 PMs.', author: 'Karthik R.' },
]

const faqs = [
  { q: 'Who is this course for?', a: 'Aspiring PMs, career switchers, and existing PMs looking to specialize in AI products.' },
  { q: 'Do I need technical experience?', a: 'No! We build your AI literacy from scratch with a PM perspective.' },
  { q: 'What makes YPM different?', a: 'We focus exclusively on AI-first product thinking with mock interviews and real case studies.' },
  { q: 'Learning format?', a: 'Self-paced video lectures. Most complete in 4-6 weeks with 5-7 hours per week.' },
]

// Simple fade-in animation variant
const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
}

// FAQ Item with animated chevron
function FAQItem({ faq, index }: { faq: { q: string; a: string }; index: number }) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <motion.div
      className="glass-card p-6 cursor-pointer"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeIn}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="font-semibold text-foreground flex items-center justify-between">
        {faq.q}
        <ChevronDown 
          size={20} 
          className={`text-primary ml-2 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="text-muted-foreground mt-4 text-sm">{faq.a}</p>
      </motion.div>
    </motion.div>
  )
}

export default function Home() {
  return (
    <div className="relative overflow-x-hidden">
      {/* Background orbs - CSS only, no JS */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      {/* ═══════════════ HERO + LEAD CAPTURE ═══════════════ */}
      <section className="flex items-center pt-28 pb-16">
        <div className="container grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Content */}
          <div className="text-left">
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Think Like a Product Manager
            </motion.h1>
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              in an AI-First World.
            </motion.h1>

            <motion.p 
              className="text-lg md:text-xl text-muted-foreground mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Master the frameworks to build, scale, and lead AI products. 
              The <span className="text-foreground font-medium">Vision Enhancer</span> for your career.
            </motion.p>

            <motion.div 
              className="flex flex-wrap gap-8 md:gap-16 mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {stats.map((stat, i) => (
                <div key={i}>
                  <div className="text-3xl md:text-4xl font-bold text-foreground">
                    <CountUp 
                      end={stat.value} 
                      prefix={stat.prefix} 
                      suffix={stat.suffix}
                      duration={1.5}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Link to="/courses" className="btn-primary">
                COURSES <ArrowRight size={18} />
              </Link>
              <Link to="/coaching" className="btn-secondary">
                Schedule 1:1 Call
              </Link>
            </motion.div>
          </div>

          {/* Right Column: Lead Capture Form */}
          <div className="w-full max-w-md mx-auto lg:ml-auto">
            <motion.div
              className="lead-capture-card-enhanced"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeIn}
              transition={{ duration: 0.6 }}
            >
              {/* Decorative elements */}
              <div className="lead-card-glow" />
              <div className="lead-card-grid" />
              
              <h3 className="lead-title">
                Start Your PM Journey
              </h3>
              <p className="lead-subtitle">
                Get personalized guidance for your transition into product management
              </p>
              
              <form className="lead-form">
                {/* Name Input */}
                <div className="input-group">
                  <div className="input-icon">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="form-input-enhanced"
                  />
                </div>

                {/* WhatsApp Input */}
                <div className="input-group">
                  <div className="input-icon">
                    <Phone size={18} />
                  </div>
                  <input
                    type="tel"
                    placeholder="WhatsApp Number"
                    className="form-input-enhanced"
                  />
                </div>

                {/* Current Role Input */}
                <div className="input-group">
                  <div className="input-icon">
                    <Briefcase size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Current Role"
                    className="form-input-enhanced"
                  />
                </div>

                <motion.button 
                  type="submit" 
                  className="btn-primary-enhanced lead-submit-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Start Learning</span>
                  <ChevronRight size={18} className="btn-arrow" />
                </motion.button>
              </form>

              {/* Trust indicators */}
              <div className="lead-trust-section">
                <div className="lead-trust-items">
                  <div className="lead-trust-item">
                    <Shield size={14} />
                    <span>100% Secure</span>
                  </div>
                  <div className="lead-trust-item">
                    <CheckCircle size={14} className="trust-check" />
                    <span>500+ Enrolled</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ CURVED LOOP MARQUEE ═══════════════ */}
      <section className="w-full">
        <CurvedLoop 
          marqueeText="AI Product Management ✦ Career Growth ✦ Expert Mentorship ✦ Real Projects ✦ Interview Ready ✦ "
          speed={1.5}
          curveAmount={150}
          direction="left"
          interactive
          className="curved-loop-text"
        />
      </section>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section className="container py-24">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
          transition={{ duration: 0.5 }}
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Why Choose Us</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
            Your Complete PM Toolkit
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              className="glass-card p-6 relative"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeIn}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              {feature.badge && (
                <span className="absolute top-4 right-4 text-xs bg-accent text-background px-2 py-1 rounded font-semibold">
                  {feature.badge}
                </span>
              )}
              <feature.icon className="text-primary mb-4" size={32} />
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════ VIDEO PREVIEW ═══════════════ */}
      <VideoPreviewSection />

      {/* ═══════════════ COURSES ═══════════════ */}
      <section className="container py-24">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
          transition={{ duration: 0.5 }}
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Programs</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
            Master PM Skills
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {courses.map((course, i) => (
            <motion.div
              key={i}
              className="glass-card p-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeIn}
              transition={{ duration: 0.4, delay: i * 0.15 }}
            >
              <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold">
                {course.badge}
              </span>
              <h3 className="text-2xl font-bold text-foreground mt-4 mb-2">{course.title}</h3>
              <p className="text-muted-foreground mb-6">{course.description}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Clock size={16} />
                <span>{course.lectures} Lectures</span>
              </div>
              <Link to="/courses" className="btn-primary w-full text-center">
                Explore Course
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════ ALUMNI ═══════════════ */}
      <section className="container py-24">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
          transition={{ duration: 0.5 }}
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Success Stories</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
            Where Our Alumni Work
          </h2>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-8">
          {alumni.map((person, i) => (
            <motion.div
              key={i}
              className="text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <div className="w-16 h-16 rounded-full bg-accent-gradient flex items-center justify-center mb-3 mx-auto">
                <span className="text-xl font-bold text-white">{person.initial}</span>
              </div>
              <h4 className="font-semibold text-foreground text-sm">{person.name}</h4>
              <p className="text-xs text-muted-foreground">{person.role}</p>
              <p className="text-xs text-primary">{person.company}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section className="container py-24">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
          transition={{ duration: 0.5 }}
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Testimonials</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
            What Our Students Say
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {testimonials.map((item, i) => (
            <motion.div
              key={i}
              className="glass-card p-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Quote className="text-primary/30 mb-4" size={24} />
              <p className="text-foreground mb-4 italic">"{item.quote}"</p>
              <p className="text-sm text-primary font-medium">— {item.author}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════ CERTIFICATE ═══════════════ */}
      <section className="container py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
            transition={{ duration: 0.5 }}
          >
            <span className="text-primary text-sm font-semibold uppercase">Certificate</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">
              Industry-Aligned Completion Certificate
            </h2>
            <p className="text-muted-foreground mb-6">
              Issued after 100% course completion, including all lectures, evaluations, 
              mock interviews, and your final product case study.
            </p>
            <ul className="space-y-3">
              {['Complete 50 lectures', 'Pass evaluations', 'Mock interviews', 'Case study'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-foreground">
                  <CheckCircle className="text-primary shrink-0" size={18} />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="certificate-card">
              <div className="certificate-header">
                <Award className="text-accent" size={48} />
              </div>
              <div className="certificate-body">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">This certifies that</p>
                <p className="text-lg font-semibold text-foreground mb-1">[Your Name]</p>
                <p className="text-sm text-muted-foreground mb-4">has successfully completed</p>
                <h3 className="text-xl font-bold text-foreground mb-1">AI Product Management</h3>
                <p className="text-xs text-primary">Your Product Manager Academy</p>
              </div>
              <div className="certificate-footer">
                <div className="certificate-seal">YPM</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section className="container py-24 max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
          transition={{ duration: 0.5 }}
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">FAQ</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
            Common Questions
          </h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <FAQItem key={i} faq={faq} index={i} />
          ))}
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="container py-24 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Transform Your Career?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of successful PMs who started their journey with us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/courses" className="btn-primary">
              Get Started <ArrowRight size={18} />
            </Link>
            <Link to="/coaching" className="btn-secondary">
              Talk to an Advisor
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
