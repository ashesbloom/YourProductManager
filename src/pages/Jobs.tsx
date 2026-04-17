import { motion } from 'framer-motion'
import { Briefcase, MapPin, Search, Star } from 'lucide-react'

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

type Job = {
  title: string
  company: string
  location: string
  type: string
  salary: string
  isCertified?: boolean
}

const featuredJobs: Job[] = [
  {
    title: 'Senior AI Product Manager',
    company: 'TechCorp Global',
    location: 'Bangalore',
    type: 'Full-time',
    salary: '35L - 45L',
    isCertified: true,
  },
  {
    title: 'Product Manager - ML Platform',
    company: 'DataDriven Inc',
    location: 'Remote',
    type: 'Full-time',
    salary: '28L - 38L',
    isCertified: true,
  },
]

const allJobs: Job[] = [
  {
    title: 'Associate Product Manager',
    company: 'StartupXYZ',
    location: 'Delhi NCR',
    type: 'Full-time',
    salary: '18L - 25L',
    isCertified: true,
  },
  {
    title: 'Technical Product Manager',
    company: 'CloudTech Solutions',
    location: 'Hyderabad',
    type: 'Full-time',
    salary: '28L - 35L',
  },
  {
    title: 'Product Strategy Analyst',
    company: 'FinanceFirst',
    location: 'Remote',
    type: 'Full-time',
    salary: '22L - 28L',
    isCertified: true,
  },
  {
    title: 'AI Product Manager',
    company: 'Innovation Labs',
    location: 'Pune',
    type: 'Full-time',
    salary: '32L - 42L',
  },
  {
    title: 'Growth Product Manager',
    company: 'ConsumerBrand',
    location: 'Bangalore',
    type: 'Full-time',
    salary: '25L - 32L',
    isCertified: true,
  },
]

function JobCard({ job, featured }: { job: Job; featured?: boolean }) {
  return (
    <div
      className={
        featured
          ? 'rounded-2xl border border-purple-500/45 bg-[#07070c] shadow-[0_12px_35px_-18px_rgba(124,58,237,0.55)] p-6'
          : 'rounded-2xl border border-purple-500/25 bg-[#07070c] shadow-[0_12px_30px_-20px_rgba(124,58,237,0.3)] p-6'
      }
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
            <Briefcase size={18} className="text-primary" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white truncate">{job.title}</div>
            <div className="text-sm text-white/60 truncate">{job.company}</div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-500/12 text-white/70 text-xs font-semibold border border-purple-500/25">
                {job.location}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-500/12 text-white/70 text-xs font-semibold border border-purple-500/25">
                {job.type}
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="font-black text-white">{job.salary}</div>
          {job.isCertified ? (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBBF24]/15 text-[#FBBF24] text-xs font-bold border border-[#FBBF24]/25">
              <Star size={14} className="text-[#FBBF24]" />
              YPM Certified
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function Jobs() {
  return (
    <div className="bg-black">
      {/* Hero */}
      <section className="pt-28 pb-16 bg-black text-white border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            className="text-center"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-black tracking-tight">
              The AI-First PM Career Hub
            </h1>
            <p className="mt-4 text-white/70 text-base md:text-lg">
              Exclusive opportunities for Product Managers in the AI era
            </p>
          </motion.div>

          {/* Search row (UI only) */}
          <motion.div
            className="mt-12 grid grid-cols-1 md:grid-cols-[1fr_220px_auto_140px] gap-4 items-center"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" />
              <input
                type="text"
                placeholder="Search by keyword..."
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="relative">
              <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" />
              <select className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option>All Locations</option>
                <option>Bangalore</option>
                <option>Delhi NCR</option>
                <option>Hyderabad</option>
                <option>Remote</option>
              </select>
            </div>

            <label className="flex items-center gap-3 text-sm text-white/60 select-none">
              <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-white/5" />
              Remote Only
            </label>

            <button className="h-12 rounded-xl bg-primary text-primary-foreground font-bold px-6 hover:opacity-90 transition-opacity">
              Find Jobs
            </button>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
            {/* Left: Listings */}
            <div>
              <div className="mb-10">
                <div className="flex items-center gap-2 text-white font-black">
                  <Star size={18} className="text-[#FBBF24]" />
                  Featured Opportunities
                </div>
              </div>

              <div className="space-y-6">
                {featuredJobs.map((job) => (
                  <JobCard key={`${job.title}-${job.company}`} job={job} featured />
                ))}
              </div>

              <h2 className="mt-16 mb-8 text-2xl font-black text-white">All Opportunities</h2>

              <div className="space-y-5">
                {allJobs.map((job) => (
                  <JobCard key={`${job.title}-${job.company}`} job={job} />
                ))}
              </div>
            </div>

            {/* Right: Sidebar cards */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-purple-500/35 bg-[#07070c] shadow-[0_10px_30px_-18px_rgba(124,58,237,0.45)] p-6">
                <div className="font-black text-white">Not Job Ready?</div>
                <p className="mt-2 text-sm text-white/60 leading-relaxed">
                  Get a professional 1:1 resume audit and LinkedIn optimization tailored for AI PM roles.
                </p>
                <button className="mt-6 w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity">
                  Get 1:1 Resume Audit
                </button>
              </div>

              <div className="rounded-2xl bg-[#07070c] border border-purple-500/25 shadow-[0_16px_35px_-20px_rgba(124,58,237,0.45)] p-6">
                <div className="font-black text-white">YPM Certified Badge</div>
                <p className="mt-2 text-sm text-white/60 leading-relaxed">
                  Jobs with this badge prioritize YPM alumni for faster hiring.
                </p>
                <div className="mt-5 inline-flex items-center gap-2 text-[#FBBF24] font-bold">
                  <Star size={16} className="text-[#FBBF24]" />
                  YPM Certified
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
