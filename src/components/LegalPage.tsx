import { SUPPORT_EMAIL } from '@/lib/links'

export type LegalSection = { heading: string; body: string[] }

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string
  updated: string
  intro: string
  sections: LegalSection[]
}) {
  return (
    <div className="bg-black text-white">
      <div className="container pt-32 pb-24">
        <header data-reveal className="border-b border-white/10 pb-10">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Legal</span>
          <h1 className="mt-3 font-['Montserrat'] text-4xl md:text-5xl font-black uppercase tracking-tight">{title}</h1>
          <p className="mt-4 text-sm text-white/45">Last updated: {updated}</p>
          <p className="mt-6 max-w-3xl leading-relaxed text-white/70">{intro}</p>
        </header>

        <div className="mt-12 grid lg:grid-cols-[220px_minmax(0,1fr)] gap-x-14">
          <nav aria-label="On this page" className="max-lg:hidden">
            <ul className="sticky top-32 space-y-2 border-l border-white/10">
              {sections.map((s) => (
                <li key={s.heading}>
                  <a
                    href={`#${slug(s.heading)}`}
                    className="-ml-px block border-l border-transparent pl-4 text-sm text-white/45 transition-colors hover:border-primary hover:text-white"
                  >
                    {s.heading}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-12">
            {sections.map((s, i) => (
              <section data-reveal key={s.heading} id={slug(s.heading)} className="scroll-mt-32">
                <h2 className="flex items-baseline gap-x-3 text-xl md:text-2xl font-bold">
                  <span className="font-['Montserrat'] text-sm font-black text-[#FBBF24]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {s.heading}
                </h2>
                <div className="mt-4 space-y-4 leading-relaxed text-white/65">
                  {s.body.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </section>
            ))}

            <section data-reveal className="rounded-2xl border border-purple-500/25 bg-[#07070c] p-6 md:p-8">
              <h2 className="text-xl font-bold">Contact Information</h2>
              <p className="mt-3 leading-relaxed text-white/65">
                For any questions regarding this {title.toLowerCase()}, you may contact:
              </p>
              <p className="mt-4 leading-relaxed text-white/85">
                Khushbu Sharma
                <br />
                <span className="text-white/55">Founder, YPM (Your Product Manager)</span>
                <br />
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#c084fc] hover:text-white">
                  {SUPPORT_EMAIL}
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
