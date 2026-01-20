# 📋 YourProductManager - Implementation Plan

> **Reference Site:** https://vision-enhancer-hq.lovable.app  
> **Stack:** React + Vite + TypeScript + Tailwind + shadcn/ui + Supabase

---

## 🎯 Project Overview

Replicate the "Your Product Manager" landing page with:
- Modern dark theme with purple/gold accents
- Smooth scroll-triggered animations
- Premium UI/UX experience
- Mobile-responsive design

---

## 📦 Phase 1: Project Setup

### 1.1 Initialize Vite + React + TypeScript
```bash
npm create vite@latest . -- --template react-ts
npm install
```

### 1.2 Install Core Dependencies
```bash
# Styling
npm install -D tailwindcss postcss autoprefixer
npm install clsx tailwind-merge class-variance-authority

# UI Components (shadcn/ui)
npx shadcn@latest init

# Icons
npm install lucide-react

# Animations
npm install framer-motion
npm install gsap @gsap/react

# State & Data
npm install @tanstack/react-query
npm install @supabase/supabase-js

# Routing
npm install react-router-dom
```

### 1.3 shadcn/ui Components to Install
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add accordion
npx shadcn@latest add input
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add navigation-menu
npx shadcn@latest add sheet
npx shadcn@latest add separator
```

---

## 🎨 Phase 2: Design System

### 2.1 Color Palette (from reference)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#0a0a0f` | Main dark background |
| `--foreground` | `#fafafa` | Primary text |
| `--primary` | `#8b5cf6` | Purple accent |
| `--primary-glow` | `#a78bfa` | Hover states |
| `--secondary` | `#1a1a2e` | Card backgrounds |
| `--accent` | `#fbbf24` | Gold highlights/CTAs |
| `--muted` | `#71717a` | Secondary text |
| `--border` | `#27272a` | Subtle borders |

### 2.2 Typography Scale

| Element | Size | Weight | Font |
|---------|------|--------|------|
| H1 (Hero) | 4rem / 64px | 700 | Inter |
| H2 (Section) | 2.5rem / 40px | 600 | Inter |
| H3 (Card) | 1.5rem / 24px | 600 | Inter |
| Body | 1rem / 16px | 400 | Inter |
| Small | 0.875rem / 14px | 400 | Inter |

### 2.3 Spacing System
- Use Tailwind's default spacing (4px base)
- Section padding: `py-20` to `py-32`
- Container max-width: `max-w-7xl`

---

## 📂 Phase 3: File Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── Container.tsx
│   ├── sections/
│   │   ├── HeroSection.tsx
│   │   ├── StartJourneySection.tsx
│   │   ├── WhyYPMSection.tsx
│   │   ├── CoursesSection.tsx
│   │   ├── AlumniSection.tsx
│   │   ├── CertificateSection.tsx
│   │   ├── JobTitlesSection.tsx
│   │   ├── TestimonialsSection.tsx
│   │   ├── TimelineSection.tsx
│   │   ├── MentorshipSection.tsx
│   │   └── FAQSection.tsx
│   └── animations/
│       ├── SplitText.tsx
│       ├── ScrollReveal.tsx
│       ├── FadeIn.tsx
│       └── GlowCard.tsx
├── hooks/
│   ├── useScrollAnimation.ts
│   └── useMediaQuery.ts
├── lib/
│   ├── utils.ts               # cn() helper
│   └── supabaseClient.ts
├── pages/
│   ├── Home.tsx
│   ├── Courses.tsx
│   ├── Coaching.tsx
│   └── NotFound.tsx
├── styles/
│   └── globals.css
├── types/
│   └── index.ts
├── App.tsx
└── main.tsx
```

---

## 🗓️ Phase 4: Implementation Order

### Week 1: Foundation
| Day | Task | Components |
|-----|------|------------|
| 1 | Project setup, Tailwind config, shadcn init | - |
| 2 | Layout components | Navbar, Footer, Container |
| 3 | Animation utilities | SplitText, ScrollReveal, FadeIn |
| 4 | Hero section | HeroSection |
| 5 | Start Journey section | StartJourneySection |

### Week 2: Core Sections
| Day | Task | Components |
|-----|------|------------|
| 1 | Why YPM feature cards | WhyYPMSection, GlowCard |
| 2 | Courses section | CoursesSection |
| 3 | Alumni & Certificate | AlumniSection, CertificateSection |
| 4 | Job Titles & Testimonials | JobTitlesSection, TestimonialsSection |
| 5 | Timeline & Mentorship | TimelineSection, MentorshipSection |

### Week 3: Polish & Integration
| Day | Task |
|-----|------|
| 1 | FAQ section with accordion |
| 2 | Mobile responsiveness |
| 3 | Animation fine-tuning |
| 4 | Supabase integration prep |
| 5 | Testing & deployment to Cloudflare |

---

## ✨ Phase 5: Animation Specifications

### 5.1 Page Load Animations
```typescript
// Hero headline - SplitText with stagger
delay: 0ms, duration: 800ms, stagger: 30ms per char

// Stats counter - Count up
delay: 500ms, duration: 1500ms

// CTA buttons - Fade in from bottom
delay: 800ms, duration: 500ms
```

### 5.2 Scroll Animations
```typescript
// Section headings - ScrollReveal
trigger: "top 80%", duration: 600ms, blur: 4px

// Cards - Staggered fade in
trigger: "top 85%", stagger: 100ms per card

// Images - Scale up with opacity
trigger: "top 75%", scale: 0.95 → 1, opacity: 0 → 1
```

### 5.3 Interaction Animations
```typescript
// Button hover - Scale + glow
scale: 1.02, boxShadow: "0 0 20px rgba(139, 92, 246, 0.4)"

// Card hover - Lift + border glow
translateY: -4px, borderColor: "rgba(139, 92, 246, 0.5)"

// Nav link hover - Underline slide
width: 0 → 100%, duration: 200ms
```

---

## 🔧 Phase 6: Configuration Files

### 6.1 Tailwind Config Highlights
- Dark mode: `class`
- Custom colors for brand
- Extended animations (fade-in, slide-up, glow)
- Custom fonts (Inter)

### 6.2 Vite Config
- Path aliases (`@/` → `src/`)
- Build optimization for Cloudflare Pages

---

## ✅ Pre-Implementation Checklist

- [ ] Node.js v18+ installed
- [ ] Git repository initialized
- [ ] Supabase project created (for later)
- [ ] Cloudflare Pages project connected
- [ ] Reference site bookmarked for comparison

---

## 🚀 Ready to Code!

Once you confirm, we'll begin with:
1. Initialize Vite project
2. Configure Tailwind with custom theme
3. Set up shadcn/ui
4. Create base layout components
5. Build the Hero section

**Proceed to Step 5: Code Implementation?**
