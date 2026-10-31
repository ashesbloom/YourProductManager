import { Brain, Compass, Rocket, type LucideIcon } from 'lucide-react'

type Post = {
  title: string
  excerpt: string
  category: 'Product thinking' | 'Career' | 'AI products'
  readTime: string
  date?: string // set when the post is published; until then the card says "Coming soon"
  cover?: string // image URL; without one the card draws a placeholder cover for its category
  featured?: boolean
}

// TODO(blog): these are the planned posts. Add the full text, a real cover image and a date as each is published.
const POSTS: Post[] = [
  {
    title: 'How to Think Like a Product Manager',
    excerpt: 'A practical framework to break down problems, define outcomes, and ship with clarity.',
    category: 'Product thinking',
    readTime: '5 min read',
    featured: true,
  },
  {
    title: 'AI Product Fundamentals',
    excerpt: 'The basics: data, models, evaluation, and how to make tradeoffs in AI-first products.',
    category: 'AI products',
    readTime: '6 min read',
    featured: true,
  },
  {
    title: 'Breaking Into PM (Without a PM Title)',
    excerpt: 'Portfolio, internal transfers, and real-world projects that show product thinking.',
    category: 'Career',
    readTime: '7 min read',
  },
]

const COVER: Record<Post['category'], { icon: LucideIcon; tint: string }> = {
  'Product thinking': { icon: Compass, tint: 'from-[#3b1d78] via-[#1a0f33]' },
  'AI products': { icon: Brain, tint: 'from-[#5b21b6] via-[#22104a]' },
  Career: { icon: Rocket, tint: 'from-[#4c1d95] via-[#1c1033]' },
}

function Cover({ post, large }: { post: Post; large?: boolean }) {
  if (post.cover) return <img src={post.cover} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
  const { icon: Icon, tint } = COVER[post.category]
  return (
    <div className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-linear-to-br ${tint} to-black`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.09)_1px,transparent_0)] [background-size:18px_18px]" />
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/30 blur-3xl" />
      <Icon size={large ? 72 : 48} strokeWidth={1.25} className="relative text-purple-200/80 transition-transform duration-500 group-hover:scale-110" />
    </div>
  )
}

function Meta({ post }: { post: Post }) {
  return (
    <p className="text-xs text-white/45">
      {post.date ?? 'Coming soon'} · {post.readTime}
    </p>
  )
}

const tag = 'inline-block rounded-full border border-purple-400/40 bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-200'

export default function Blog() {
  const featured = POSTS.filter((p) => p.featured)

  return (
    <div className="min-h-screen bg-black pb-24 pt-[calc(var(--header-h)+3rem)] text-white">
      <div className="container">
        <h1 className="font-['Montserrat'] text-4xl font-extrabold md:text-5xl">Blog</h1>
        <p className="mt-3 max-w-2xl text-lg text-white/60">Short, practical notes on product thinking, career moves, and building in the AI era.</p>

        <section className="mt-12" aria-labelledby="featured">
          <h2 id="featured" className="font-['Montserrat'] text-2xl font-bold">
            Featured
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {featured.map((post) => (
              <article key={post.title} className="group overflow-hidden rounded-3xl border border-purple-400/30 bg-linear-to-br from-purple-950/40 via-black to-black">
                <div className="aspect-[16/9] overflow-hidden">
                  <Cover post={post} large />
                </div>
                <div className="p-6 md:p-7">
                  <span className={tag}>{post.category}</span>
                  <h3 className="mt-4 font-['Montserrat'] text-2xl font-bold leading-snug">{post.title}</h3>
                  <p className="mt-3 leading-relaxed text-white/60">{post.excerpt}</p>
                  <div className="mt-5">
                    <Meta post={post} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16" aria-labelledby="all">
          <h2 id="all" className="font-['Montserrat'] text-2xl font-bold">
            All posts
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {POSTS.map((post) => (
              <article key={post.title} className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d14] transition-colors hover:border-purple-400/40">
                <div className="aspect-[16/10] overflow-hidden">
                  <Cover post={post} />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <span className={`${tag} self-start`}>{post.category}</span>
                  <h3 className="mt-3 font-semibold leading-snug">{post.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-white/55">{post.excerpt}</p>
                  <div className="mt-4">
                    <Meta post={post} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
