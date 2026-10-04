import { motion } from 'framer-motion'

const jobTitles = [
  'AI Product Lead',
  'Product Strategy Consultant',
  'Chief Product Officer (CPO)',
  'Management Consultant (Digital Strategy)',
  'Principal Product Manager',
  'Fractional Head of Product',
  'VP of Product & Strategy',
  'Technical Product Manager (TPM)',
  'Growth Strategy Architect',
  'Product Operations (ProdOps) Consultant',
  'Director of Strategic Transformation',
  'Founding Product Manager',
]

export function JobTitlesSection() {
  return (
    <section className="pt-20 pb-0">
      <div className="container">
        <div data-reveal className="max-w-4xl mx-auto">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-12">
                Your Future Job Titles
              </h2>

              <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-6 md:gap-8 pt-6 pb-0 -mb-8">
                {jobTitles.map((title) => {
                  return (
                    <motion.div
                      key={title}
                      whileHover={{ y: -4, scale: 1.05 }}
                      transition={{ duration: 0.25 }}
                      className={[
                        'inline-flex w-fit items-center justify-center rounded-full font-semibold',
                        'px-12 py-3 mx-1 text-xs sm:text-sm md:text-base leading-tight',
                        'whitespace-nowrap',
                        'bg-linear-to-br from-[#a855f7] to-[#7e22ce] text-white',
                        'pill-outline',
                      ].join(' ')}
                    >
                      {title}
                    </motion.div>
                  )
                })}
              </div>
            </div>
        </div>
      </div>
    </section>
  )
}
