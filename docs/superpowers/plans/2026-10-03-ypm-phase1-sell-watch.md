# YPM Phase 1 — Sell + Watch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A student logs in, buys a YPM course through Razorpay, and immediately watches its gated lectures. Playback resumes where they left off, and a lecture counts as complete once 85% of it has actually been watched.

**Architecture:**
- One Cloudflare Worker (Workers + static assets, through `@cloudflare/vite-plugin`) serves the existing React SPA plus `/api/*` and `/media/*`.
- D1 stores users, sessions, orders, enrollments, progress and an event log.
- R2 stores lectures as HLS, encoded locally with ffmpeg. The Worker checks every video request against the session and the enrollment.
- One TypeScript catalog file, shared by the SPA and the Worker, is the only place prices and lectures are defined.

**Tech Stack:**
- Frontend: React 19, Vite 7, Tailwind 4, `@tanstack/react-query` 5 (already installed), `hls.js` (the one new runtime dependency).
- Cloudflare: Workers, D1, R2, wrangler 4.
- Services: Razorpay Orders + Checkout.js, Resend, Cloudflare Turnstile, Google OAuth.
- Tests: Node 26 `node --test` with `node:sqlite`.

**Spec:** `docs/superpowers/specs/2026-10-03-ypm-platform-design.md` (Phase 1 = §8)

## Global Constraints

**Runtime and dependencies**
- Node ≥ 22.6 (this machine has 26.8). Tests run as TypeScript directly: `node --test worker/*.test.ts`.
- Hosting is Cloudflare Workers with static assets, wrangler 4.x, and `@cloudflare/vite-plugin` ≥ 1.7 (needed for array `run_worker_first`).
- No router, ORM or validation library in `worker/`. The only new runtime dependency is `hls.js`.

**Code conventions**
- Relative imports in `worker/` use explicit `.ts` extensions.
- Files the Worker imports (`src/data/catalog.ts`, `src/lib/bitmap.ts`, `src/lib/links.ts`) must have no imports or only `.ts`-relative ones, and never use the `@/` alias.
- Store times as unix epoch **milliseconds** (`INTEGER`). Store money as integer **paise**, GST-inclusive.

**Pricing** (only from `src/data/catalog.ts`)

| Product | Price | Was | Grants |
|---|---|---|---|
| `ai-product` | ₹11,999 | ₹29,999 | `ai-product` + `foundations` |
| `foundations` | ₹2,999 | ₹6,999 | `foundations` |

**Progress and sessions**
- A lecture is complete when ≥ 85% of its 10-second buckets were actually played (`COMPLETE_PCT = 85`, `BUCKET_S = 10`).
- Session cookie: `ypm_s`, HttpOnly, Secure, SameSite=Lax. Only `sha256(token)` is stored. 14-day idle timeout, max 3 sessions per user.

**Trust boundaries**
- Every state-changing `POST` under `/api/*` requires `content-type: application/json`. The only exception is `/api/razorpay/webhook`, which is HMAC-verified instead.
- Any lookup keyed by user input goes through `lookup()` in the catalog, never `MAP[key]`. This blocks keys like `__proto__`.

**Visual**
- Keep the theme: dark, primary purple `#8b5cf6`, accent gold `#fbbf24`. New pages add no glows, gradients-as-decoration or emoji.

**Deliberate deviations from the spec**
- The course and product id is `ai-product`, not `ai-pm`, so existing `/courses/ai-product` URLs keep working.
- Paid 1:1 call products move to Phase 2, because their prices are still undecided (spec §10, question 5).
- `@tanstack/react-query` is already installed, so it is now used for the logged-in state and progress, and drops off spec §8's Phase 4 removal list.

## Review Focus

These are the inputs and failure modes most likely to hurt a real user. Each one has a pinned test in the task named.

1. **Razorpay events arriving out of order, twice, or after a failed attempt.**
   - The client verify and the webhook can both arrive, in either order, and repeatedly.
   - A `payment.failed` can be followed by a successful retry on the same order.
   - Expected: access is granted exactly once, and a late `payment.failed` never downgrades a paid order. (Task 7)
2. **Refunds.**
   - A partial refund keeps access.
   - A full refund revokes only the enrollments that order granted. Admin grants and enrollments from other orders survive. (Task 7)
3. **A lecture with no uploaded video yet** (`durationS: 0`, or no R2 object).
   - It is still listed on the course page.
   - The player shows "Video coming soon".
   - The progress API and media both answer 404, not 500. (Tasks 9 and 10)
4. **A session that expires, or an enrollment revoked, mid-video.**
   - `hasAccess` turns false, so video chunks return 401/403.
   - The player shows a "log in again" message instead of spinning forever. (Tasks 9 and 10)
5. **Hostile input at the boundary.**
   - `productId: "__proto__"`, `next=//evil.com`, `/media/x/../y`, and oversized or non-hex `watched` must all yield a 4xx or a safe fallback, never a crash or an open redirect. (Tasks 3, 4 and 9)

## File Map

| File | Responsibility |
|---|---|
| `wrangler.jsonc` | Worker config: assets/SPA handling, D1/R2 bindings, vars, observability |
| `tsconfig.worker.json`, `worker-configuration.d.ts` | Worker typecheck (`Env` generated by `wrangler types`) |
| `migrations/0001_init.sql` | D1 schema |
| `worker/index.ts` | Router: one `switch` over `METHOD path`, error boundary |
| `worker/http.ts` | `HttpError`, `json`, `readJson`, cookies, `redirect`, session load/require |
| `worker/lib.ts` | Pure helpers: sha256, HMAC verify, random token/code, `safeNext`, `mediaKey`, `isEmail` |
| `worker/email.ts` | `sendEmail` through Resend (logs instead when there's no key, for local dev) |
| `worker/auth.ts` | OTP, Google OAuth, sessions, `/api/me`, logout |
| `worker/pay.ts` | Checkout, client verify, webhook, `fulfill`/`markFailed`/`refund`, receipt |
| `worker/media.ts` | Gated R2 streaming, `hasAccess`, progress save/read |
| `worker/lib.test.ts` | The one test file: pure helpers + DB logic on `node:sqlite` running the real migration |
| `src/data/catalog.ts` | Products, courses → modules → lectures, `lookup`, `formatINR` |
| `src/lib/bitmap.ts` | Watched-bucket bitmap: build from played ranges, OR, count, validate (shared) |
| `src/lib/api.ts` | `api()` fetch wrapper, `ApiError`, `loadScript()` |
| `src/lib/me.ts` | `useMe()`, `useProgress()` react-query hooks + types |
| `src/components/VideoPlayer.tsx` | hls.js player, resume, progress heartbeats, watermark, error states |
| `src/pages/Login.tsx`, `Dashboard.tsx`, `Learn.tsx`, `NotFound.tsx`, `RefundPolicy.tsx`, `DeliveryPolicy.tsx` | New pages |
| `scripts/encode.sh`, `scripts/upload-local.sh` | ffmpeg → HLS, and seeding the local R2 |
| `README.md` | Dev, deploy and manual-admin commands |

---

## Task 0: Accounts, keys and tools (manual — project owner)

No code. Every later task assumes these exist. Values marked **secret** never go in git.

- [ ] **Step 1: Commit the current work first.** The working tree has staged deletions and untracked pages (About, Verify, LegalPage, …). Commit them on `main` (or a branch) so Phase 1 starts from a clean tree:

```bash
git add -A && git commit -m "chore: snapshot site before Phase 1 backend"
git checkout -b phase1-sell-watch
```

- [ ] **Step 2: Install tools**

```bash
brew install ffmpeg rclone
ffmpeg -version | head -1 && rclone version | head -1
```

- [ ] **Step 3: Cloudflare resources** (run after Task 1 Step 1 installs wrangler)

```bash
npx wrangler login
npx wrangler d1 create ypm --location apac        # copy the printed database_id
npx wrangler r2 bucket create ypm-media --location apac
```

- [ ] **Step 4: Collect keys into a password manager**

| Key | Where | Dev value |
|---|---|---|
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` (**secret**) | Razorpay Dashboard → Test Mode → Account & Settings → API Keys | test keys |
| `RAZORPAY_WEBHOOK_SECRET` (**secret**) | You choose it (any long random string); entered when the webhook is created in Task 13 | any string |
| `RESEND_API_KEY` (**secret**) | resend.com → API Keys, after verifying the sending domain's DNS records in Cloudflare | empty (emails are logged to the console instead) |
| `TURNSTILE_SECRET` (**secret**) + site key | Cloudflare → Turnstile → Add widget (hostnames: `localhost`, the workers.dev host, the real domain) | secret `1x0000000000000000000000000000000AA`, site key `1x00000000000000000000AA` (Cloudflare's always-pass test keys) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (**secret**) | Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web). Authorized redirect URI: `http://localhost:5173/api/auth/google/callback` (the production ones are added in Task 13) | real dev client |
| R2 S3 credentials (**secret**) | Cloudflare → R2 → Manage API tokens → Object Read & Write on `ypm-media` | — |
| Sending address | `EMAIL_FROM`, e.g. `YPM <no-reply@yourpm.in>`. The domain must match the one verified in Resend | — |

- [ ] **Step 5: Configure the rclone remote for R2** (used in Task 13)

```bash
rclone config create r2 s3 provider=Cloudflare \
  access_key_id=<R2_ACCESS_KEY_ID> secret_access_key=<R2_SECRET_ACCESS_KEY> \
  endpoint=https://<CLOUDFLARE_ACCOUNT_ID>.r2.cloudflarestorage.com acl=private
rclone lsd r2:     # expect: ypm-media
```

---

## Task 1: Run the site on a Cloudflare Worker with static assets

**Files:**
- Create: `wrangler.jsonc`, `tsconfig.worker.json`, `worker/index.ts`, `worker/http.ts`, `.dev.vars.example`, `.env.development`
- Generated (commit it): `worker-configuration.d.ts`
- Modify: `package.json`, `vite.config.ts`, `.gitignore`
- Delete: `public/_redirects`

**Interfaces:**
- Produces:
  - `worker/http.ts` exports `class HttpError extends Error { status: number }` and `json(data: unknown, status?: number, headers?: HeadersInit): Response`. Every `json()` response has `cache-control: no-store`.
  - The global type `Env` (from `wrangler types`), with `DB: D1Database`, `MEDIA: R2Bucket`, `EMAIL_FROM: string`, and the secrets from `.dev.vars`.

- [ ] **Step 1: Install the Cloudflare tooling**

```bash
npm i -D wrangler @cloudflare/vite-plugin
npx wrangler --version   # expect 4.x
```

Now finish Task 0 Step 3 to get the D1 `database_id`.

- [ ] **Step 2: Create `wrangler.jsonc`**

Replace `<DATABASE_ID>` with the id printed by `wrangler d1 create`.

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "ypm",
  "main": "worker/index.ts",
  "compatibility_date": "2026-10-01",
  "assets": {
    // Every non-API route serves index.html; only these paths run the Worker (page loads stay free).
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*", "/media/*"]
  },
  "d1_databases": [
    { "binding": "DB", "database_name": "ypm", "database_id": "<DATABASE_ID>", "migrations_dir": "migrations" }
  ],
  "r2_buckets": [{ "binding": "MEDIA", "bucket_name": "ypm-media" }],
  "vars": { "EMAIL_FROM": "YPM <no-reply@yourpm.in>" },
  "observability": { "enabled": true }
}
```

- [ ] **Step 3: Local secrets and the git-ignore list**

Create `.dev.vars.example` and commit it:

```bash
RAZORPAY_KEY_ID=rzp_test_replace
RAZORPAY_KEY_SECRET=replace
RAZORPAY_WEBHOOK_SECRET=replace
# Empty = emails are printed to the dev server console instead of sent.
RESEND_API_KEY=
TURNSTILE_SECRET=1x0000000000000000000000000000000AA
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Then:

```bash
cp .dev.vars.example .dev.vars   # fill in real test keys; never commit .dev.vars
printf '\n# Cloudflare\n.dev.vars\n.wrangler\n\n# Encoded lecture output (lives in R2, not git)\n/media\n' >> .gitignore
```

Create `.env.development` (public values only):

```bash
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

- [ ] **Step 4: Create `worker/http.ts`**

```ts
export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  const res = Response.json(data, { status, headers })
  res.headers.set('cache-control', 'no-store')
  return res
}
```

- [ ] **Step 5: Create `worker/index.ts`**

```ts
import { HttpError, json } from './http.ts'

export default {
  async fetch(req): Promise<Response> {
    const url = new URL(req.url)
    try {
      switch (`${req.method} ${url.pathname}`) {
        case 'GET /api/health':
          return json({ ok: true })
      }
      return json({ error: 'Not found' }, 404)
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status)
      console.error(JSON.stringify({ msg: 'unhandled', path: url.pathname, err: String(err), stack: (err as Error).stack }))
      return json({ error: 'Something went wrong' }, 500)
    }
  },
} satisfies ExportedHandler<Env>
```

- [ ] **Step 6: Add the Vite plugin; keep vendor chunking client-only**

Replace `vite.config.ts` with:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  environments: {
    // Scoped to the browser build: the Worker bundle must not be split into vendor chunks.
    client: {
      build: {
        rollupOptions: {
          output: {
            // Vendors change far less often than app code, so give them their own
            // long-lived chunks instead of busting one bundle on every edit.
            // Matched by path rather than package name: the name form misses
            // sub-entries like `react-dom/client`, which left react-dom in the entry.
            manualChunks(id: string) {
              if (!id.includes('node_modules')) return
              if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react'
              if (id.includes('node_modules/gsap')) return 'gsap'
              if (id.includes('node_modules/framer-motion') || id.includes('node_modules/motion')) return 'motion'
              if (id.includes('node_modules/lucide-react')) return 'icons'
              return 'vendor'
            },
          },
        },
      },
    },
  },
})
```

- [ ] **Step 7: Worker typecheck config and generated types**

Create `tsconfig.worker.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2023"],
    "types": [],
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "skipLibCheck": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["worker", "worker-configuration.d.ts"],
  "exclude": ["worker/**/*.test.ts"]
}
```

Run:

```bash
npx wrangler types   # writes worker-configuration.d.ts (Env + runtime types); rerun whenever wrangler.jsonc or .dev.vars keys change
```

- [ ] **Step 8: Update the `package.json` scripts**

Replace the `"scripts"` block with:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && tsc -p tsconfig.worker.json && vite build",
  "preview": "npm run build && vite preview",
  "deploy": "npm run build && wrangler deploy",
  "cf-typegen": "wrangler types"
},
```

- [ ] **Step 9: Remove the Pages-only SPA redirect**

```bash
git rm public/_redirects   # SPA fallback is now `not_found_handling`
```

- [ ] **Step 10: Verify**

```bash
npm run dev
# in another terminal:
curl -s localhost:5173/api/health            # expect {"ok":true}
curl -s localhost:5173/api/nope              # expect {"error":"Not found"}
curl -s localhost:5173/courses | head -3     # expect <!doctype html>
```

Open `http://localhost:5173/courses/ai-product` in a browser and confirm it renders as it did before. Stop the dev server, then:

```bash
npm run build    # expect: no type errors; dist/client and dist/ypm created
```

- [ ] **Step 11: Commit**

```bash
git add wrangler.jsonc tsconfig.worker.json worker-configuration.d.ts worker/ .dev.vars.example .env.development .gitignore package.json package-lock.json vite.config.ts
git commit -m "feat: serve site from a Cloudflare Worker with static assets"
```

---

## Task 2: Fix the stylesheet that overrides Tailwind

The new pages need responsive utilities that work. Today about 250 hand-copied `!important` utility rules in `src/styles.css` beat every `md:`/`lg:` variant. A leftover shadcn `.dark` block also turns `primary` grey. This task deletes only plain copies of Tailwind utilities. Custom classes (`btn-*`, `glass-card`, `gradient-text`, `orb`, `container`, …) stay.

**Files:**
- Modify: `src/styles.css`

**Interfaces:**
- Produces: Tailwind tokens `primary` (#8b5cf6), `primary-foreground`, `primary-glow`, `accent` (#fbbf24), `accent-foreground`, `muted-foreground`, `card`, `secondary`, `border`, `ring`, `background`, `foreground`. All later tasks use `text-primary`, `bg-primary`, `border-border`, and so on.

- [ ] **Step 1: Take baseline screenshots**

Run `npm run dev` and screenshot each route at 375px and 1280px wide: `/`, `/courses`, `/courses/ai-product`, `/about`, `/contact`, `/blog`, `/resources`, `/privacy`, `/terms`, `/verify?id=YPM0000000`. Save them to `/tmp/ypm-before/`. Use the Chrome tools or the `run` skill.

- [ ] **Step 2: Check the deletion boundaries**

```bash
for n in 8 13 183 228 245 439 458 467 1074 1102 1119 1144 1147 1152 1489 1563; do printf "%5s|%s\n" $n "$(sed -n "${n}p" src/styles.css)"; done
```

Expected (blank right-hand side = empty line):

```
    8|/* ═══════════════ CSS VARIABLES ═══════════════ */
   13|}
  183|.text-foreground { color: var(--color-foreground) !important; }
  228|}
  245|/* ═══════════════ FLEXBOX ═══════════════ */
  439|
  458|/* Neutralize matte white gradient overlays used across cards */
  467|
 1074|/* ═══════════════ EFFECTS ═══════════════ */
 1102|
 1119|/* ═══════════════ GRADIENTS ═══════════════ */
 1144|.opacity-80 { opacity: 0.8 !important; }
 1147|/* ═══════════════ WIDTH HELPERS ═══════════════ */
 1152|
 1489|@theme inline {
 1563|
```

If any line differs, the file has changed since this plan was written. Open it, find the same blocks by their `/* ═══ … ═══ */` headers, and adjust the line numbers before continuing.

- [ ] **Step 3: Delete the utility copies and the shadcn leftovers**

One `sed` pass, so every range refers to the original line numbers:

```bash
sed -i '' -e '8,13d' -e '183,228d' -e '245,439d' -e '458,467d' -e '1074,1102d' -e '1119,1144d' -e '1147,1152d' -e '1489,1563d' src/styles.css
grep -c '!important' src/styles.css   # was ~330; expect well under 100 (the remaining ones belong to custom classes)
```

What each range removes:

| Range | Removed |
|---|---|
| 8–13 | the old `:root` variables |
| 183–228 | text/font utility copies (the `h1–h6` line-height rule on line 181 stays) |
| 245–439 | flex, grid, gap, spacing, sizing, position, border and background copies |
| 458–467 | the "neutralize white gradients" hack |
| 1074–1102 | blur, backdrop, overflow, cursor and shadow copies |
| 1119–1144 | gradient, transform, transition and opacity copies (`.group { position: relative; }` on 1145 stays) |
| 1147–1152 | width helpers |
| 1489–1563 | shadcn `@theme inline` + `.dark` (the `@layer base` block stays) |

- [ ] **Step 4: Define the brand tokens**

In `src/styles.css`, directly below the line `@custom-variant dark (&:is(.dark *));`, insert:

```css

/* Brand tokens. Tailwind generates bg-primary, text-accent, border-border, … from these. */
@theme {
  --color-background: #0a0a0f;
  --color-foreground: #fafafa;
  --color-primary: #8b5cf6;
  --color-primary-foreground: #ffffff;
  --color-primary-glow: #a78bfa;
  --color-accent: #fbbf24;
  --color-accent-foreground: #0a0a0f;
  --color-muted-foreground: #a1a1aa;
  --color-card: #111117;
  --color-secondary: #1a1a2e;
  --color-border: rgb(255 255 255 / 0.1);
  --color-ring: #8b5cf6;
}
```

- [ ] **Step 5: Build**

```bash
npm run build   # expect success
```

- [ ] **Step 6: Visual pass**

Run `npm run dev`, re-screenshot the same routes into `/tmp/ypm-before/../ypm-after/`, and compare. These changes are **expected and intended**:
- Desktop grids become multi-column (Courses card, CourseContent sidebar, LegalPage table of contents).
- Headings scale up on desktop.
- `rounded-3xl` corners come back.
- `bg-white/5` cards turn subtle translucent grey instead of near-black.
- `primary` rings and borders turn purple instead of grey.

Fix only real breakage: overlapping or overflowing content, or text you can no longer read. Fix it **at the call site** by editing the class list in the `.tsx` file. Never re-add a global override. Spend at most ~1 hour on this; deeper visual work belongs to Phase 4.

- [ ] **Step 7: Commit**

```bash
git add src/styles.css src/pages src/components
git commit -m "fix: drop CSS that overrode Tailwind utilities; define brand tokens"
```

---
## Task 3: One shared course catalog

Prices and lecture lists are currently duplicated and contradict each other (`Home.tsx`, `Courses.tsx`, `CourseContent.tsx`). This task moves them into one file that both the SPA and the Worker import.

**Files:**
- Create: `src/data/catalog.ts`, `worker/lib.test.ts`
- Modify: `src/pages/Courses.tsx`, `src/pages/CourseContent.tsx`, `package.json` (`test` script)

**Interfaces:**
- Produces, from `src/data/catalog.ts`:

```ts
type Lecture = { id: string; title: string; free: boolean; durationS: number }   // durationS 0 = video not uploaded yet
type Module = { title: string; lectures: Lecture[] }
type Course = { id: string; title: string; modules: Module[] }
type Product = { id: string; title: string; pricePaise: number; oldPricePaise: number; priceLabel: string; grants: string[] }
const COMPLETE_PCT = 85
const COURSES: Record<string, Course>
const PRODUCTS: Record<string, Product>                    // product id === course id it sells
const LECTURES: Record<string, Lecture & { courseId: string }>
function lookup<T>(map: Record<string, T>, key: unknown): T | undefined
function courseLectures(courseId: string): Lecture[]
function formatINR(paise: number): string                  // 1199900 → "₹11,999"
```

- [ ] **Step 1: Write the failing tests**

Add the test script to `package.json` `"scripts"`:

```json
"test": "node --test worker/*.test.ts",
```

Create `worker/lib.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { COURSES, LECTURES, PRODUCTS, courseLectures, formatINR, lookup } from '../src/data/catalog.ts'

test('catalog: lecture ids are unique and URL/R2-safe', () => {
  const ids = Object.values(COURSES).flatMap((c) => courseLectures(c.id).map((l) => l.id))
  assert.equal(new Set(ids).size, ids.length)
  for (const id of ids) assert.match(id, /^[a-z0-9-]+$/)
  assert.equal(Object.keys(LECTURES).length, ids.length)
})

test('catalog: products grant existing courses at the agreed prices', () => {
  for (const p of Object.values(PRODUCTS)) {
    assert.ok(Number.isInteger(p.pricePaise) && p.pricePaise > 0, p.id)
    for (const c of p.grants) assert.ok(lookup(COURSES, c), `${p.id} grants unknown course ${c}`)
  }
  assert.equal(PRODUCTS['ai-product'].pricePaise, 1_199_900)
  assert.deepEqual(PRODUCTS['ai-product'].grants, ['ai-product', 'foundations'])
  assert.equal(PRODUCTS.foundations.pricePaise, 299_900)
})

test('catalog: lookup ignores prototype keys and non-strings', () => {
  assert.equal(lookup(PRODUCTS, '__proto__'), undefined)
  assert.equal(lookup(PRODUCTS, 'constructor'), undefined)
  assert.equal(lookup(PRODUCTS, 42), undefined)
  assert.equal(lookup(PRODUCTS, 'foundations')?.id, 'foundations')
})

test('catalog: formatINR uses Indian digit grouping', () => {
  assert.equal(formatINR(1_199_900), '₹11,999')
  assert.equal(formatINR(29_990_000), '₹2,99,900')
})

test('catalog: AI PM lists all 50 lectures', { todo: 'awaiting the full lecture list from Drive; Task 13 removes this todo' }, () => {
  assert.equal(courseLectures('ai-product').length, 50)
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test`
Expected: FAIL, `Cannot find module '.../src/data/catalog.ts'`

- [ ] **Step 3: Create `src/data/catalog.ts`**

```ts
// What YPM sells. Imported by the SPA *and* the Worker, so this file must stay import-free.
// The Worker prices every order from here; amounts sent by the browser are never trusted.

export type Lecture = { id: string; title: string; free: boolean; durationS: number }
export type Module = { title: string; lectures: Lecture[] }
export type Course = { id: string; title: string; modules: Module[] }
export type Product = {
  id: string
  title: string
  pricePaise: number // final price, GST-inclusive
  oldPricePaise: number
  priceLabel: string
  grants: string[] // course ids unlocked by buying this
}

/** % of a lecture's 10-second buckets that must actually be played to count it complete. */
export const COMPLETE_PCT = 85

// durationS 0 = video not uploaded yet: listed on the course page, player shows "coming soon".
// scripts/encode.sh prints a ready-to-paste L(...) line with the real duration.
// Lecture ids are permanent (R2 keys and progress rows use them): never renumber after upload.
const L = (id: string, title: string, free = false, durationS = 0): Lecture => ({ id, title, free, durationS })

export const COURSES: Record<string, Course> = {
  'ai-product': {
    id: 'ai-product',
    title: 'AI Product Management',
    modules: [
      {
        title: 'AI Product Management',
        lectures: [
          L('ai-product-01', 'Introduction to AI Product Management', true),
          L('ai-product-02', 'What is an AI Product?', true),
          L('ai-product-03', 'The AI Product Lifecycle', true),
          L('ai-product-04', 'Understanding Machine Learning Basics'),
          L('ai-product-05', 'AI Product Strategy Framework'),
          L('ai-product-06', 'Identifying AI Opportunities'),
          L('ai-product-07', 'Building AI Roadmaps'),
          L('ai-product-08', 'Working with Data Teams'),
          L('ai-product-09', 'AI Ethics and Responsibility'),
          L('ai-product-10', 'AI Product Metrics'),
        ],
      },
    ],
  },
  foundations: {
    id: 'foundations',
    title: 'Product Management (Foundations)',
    modules: [
      {
        title: 'Product Management Foundations',
        lectures: [
          L('foundations-01', 'What is Product Management?', true),
          L('foundations-02', 'Core PM Responsibilities', true),
          L('foundations-03', 'Problem vs Solution Thinking', true),
          L('foundations-04', 'User Research Fundamentals'),
          L('foundations-05', 'Prioritization Basics'),
          L('foundations-06', 'Writing Clear PRDs'),
          L('foundations-07', 'Stakeholder Communication'),
        ],
      },
    ],
  },
}

export const PRODUCTS: Record<string, Product> = {
  'ai-product': {
    id: 'ai-product',
    title: 'AI Product Management',
    pricePaise: 11_999 * 100,
    oldPricePaise: 29_999 * 100,
    priceLabel: 'Launch price',
    // The AI programme includes the Foundations lectures free.
    grants: ['ai-product', 'foundations'],
  },
  foundations: {
    id: 'foundations',
    title: 'Product Management (Foundations)',
    pricePaise: 2_999 * 100,
    oldPricePaise: 6_999 * 100,
    priceLabel: 'Introductory price',
    grants: ['foundations'],
  },
}

export const LECTURES: Record<string, Lecture & { courseId: string }> = Object.fromEntries(
  Object.values(COURSES).flatMap((c) =>
    c.modules.flatMap((m) => m.lectures.map((l) => [l.id, { ...l, courseId: c.id }] as const)),
  ),
)

/** Map lookup for untrusted keys: a plain `PRODUCTS['__proto__']` would be truthy. */
export function lookup<T>(map: Record<string, T>, key: unknown): T | undefined {
  return typeof key === 'string' && Object.hasOwn(map, key) ? map[key] : undefined
}

export const courseLectures = (courseId: string): Lecture[] =>
  lookup(COURSES, courseId)?.modules.flatMap((m) => m.lectures) ?? []

export const formatINR = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`
```

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: 4 pass and 1 `todo` (the 50-lecture check). A `todo` doesn't fail the run.

- [ ] **Step 5: Fill in the real lecture lists**

Get the full, ordered lecture titles for both courses from the recordings in Google Drive. Use the Drive MCP `search_files` on the course folder, or ask the owner.

Replace the two `lectures: [...]` arrays:
- Ids are `ai-product-01`… and `foundations-01`…, numbered in order.
- Mark the free-preview lectures `true`. The site currently shows the first 3 of each; the owner confirms Foundations (spec §10, question 1).
- Group lectures into `modules` if the recordings are grouped. Otherwise keep one module.
- Leave `durationS` at 0; Task 8 fills it in.

Once AI PM has 50 entries, delete `{ todo: … }, ` from the last test. If the material isn't available yet, leave the `todo` in and carry on; Task 13 blocks the deploy until it's done.

Run: `npm test` → all pass (or 4 pass + 1 todo).

- [ ] **Step 6: Make `Courses.tsx` read from the catalog**

In `src/pages/Courses.tsx`:

(a) Below the lucide import, add:

```ts
import { courseLectures, formatINR, PRODUCTS } from '@/data/catalog'
```

(b) In `type CourseCard`, delete these six lines: `metaLeft`, `metaRight`, `oldPrice?`, `price`, `priceLabel`, `priceSuffix?`.

(c) In the `courses` array, delete the same six properties from both entries. That's these lines in the `foundations` entry:

```ts
    metaLeft: '16 Lectures',
    metaRight: '1 Free Lecture',
    oldPrice: '₹6,999',
    price: '₹2,999',
    priceLabel: 'Introductory price',
    priceSuffix: '(incl. GST)',
```

and these in the `ai-product` entry:

```ts
    metaLeft: '50 Lectures',
    metaRight: '3 Free Lectures',
    oldPrice: '₹29,999',
    price: '₹11,999',
    priceLabel: 'Launch price',
    priceSuffix: '(incl. GST)',
```

(d) In `CourseCardRow`, directly after `const isDark = course.theme === 'dark'`, add:

```ts
  const product = PRODUCTS[course.id]
  const lectures = courseLectures(course.id)
  const freeCount = lectures.filter((l) => l.free).length
```

(e) Replace `<span>{course.metaLeft}</span>` with `<span>{lectures.length} Lectures</span>`. Replace `{course.metaRight}` with `{freeCount} Free {freeCount === 1 ? 'Lecture' : 'Lectures'}`. Replace `{course.priceLabel}` with `{product.priceLabel}`.

(f) Replace the whole price row, from `<div className="mt-2 flex items-end gap-4 flex-wrap">` to its closing `</div>`, with:

```tsx
          <div className="mt-2 flex items-end gap-4 flex-wrap">
            <span className={isDark ? 'text-white/30 line-through text-xl font-semibold' : 'text-gray-400 line-through text-xl font-semibold'}>
              {formatINR(product.oldPricePaise)}
            </span>
            <span className={isDark ? 'text-[#FBBF24] text-4xl font-black' : 'text-[#0a0a0f] text-4xl font-black'}>
              {formatINR(product.pricePaise)}
            </span>
            <span className={isDark ? 'text-white/50 text-sm font-semibold' : 'text-gray-400 text-sm font-semibold'}>
              (incl. GST)
            </span>
          </div>
```

- [ ] **Step 7: Make `CourseContent.tsx` read from the catalog**

Replace all of `src/pages/CourseContent.tsx` with the code below. The page copy stays here. Prices and lectures now come from the catalog. An unknown course id redirects to `/courses` instead of silently showing the AI course. The h1 now names the course.

```tsx
import { Link, Navigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, CirclePlay, Lock, Star } from 'lucide-react'
import { COURSES, PRODUCTS, courseLectures, formatINR, lookup, type Lecture } from '@/data/catalog'

const fadeIn = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

// Page copy per course. Prices and lectures come from the catalog.
type CoursePage = {
  priceMeta: string
  enrollNote: string
  includedFree: Array<{ title: string; description: string }>
}

const FREE_NOTICE =
  'Free lectures are provided to help you understand the fundamentals and teaching\napproach before enrolling.'
const FORMAT = ['Lecture-based', 'Recorded and self-paced', 'For independent learners', 'Lifetime access']

const PAGES: Record<string, CoursePage> = {
  'ai-product': {
    priceMeta: '(incl. GST) • Launch Price',
    enrollNote: 'Founding price available for early learners only',
    includedFree: [
      { title: 'Interview Ready', description: '3 simulated 1:1 PM interviews (1hr each) + project review' },
      { title: 'Elite Presence', description: 'LinkedIn & resume optimization for AI PM hiring' },
    ],
  },
  foundations: {
    priceMeta: '(incl. GST) • Introductory Price',
    enrollNote: 'Founding price available for early learners only',
    includedFree: [
      { title: 'Interview Ready', description: '3 simulated 1:1 PM interviews (1hr each) + project review' },
      { title: 'Elite Presence', description: 'LinkedIn & resume optimization for PM hiring' },
    ],
  },
}

function LectureRow({ lecture }: { lecture: Lecture }) {
  const isFree = lecture.free

  return (
    <div
      className={
        isFree
          ? 'rounded-2xl border border-green-200/60 bg-green-50/60 px-5 py-4 flex items-center justify-between gap-4'
          : 'rounded-2xl border border-gray-200/70 bg-gray-50/40 px-5 py-4 flex items-center justify-between gap-4'
      }
    >
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={
            isFree
              ? 'w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0'
              : 'w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0'
          }
        >
          {isFree ? <CirclePlay size={18} className="text-green-600" /> : <Lock size={18} className="text-gray-400" />}
        </div>
        <div className="min-w-0">
          <div className={isFree ? 'font-bold text-[#0a0a0f] truncate' : 'font-bold text-gray-600 truncate'}>
            {lecture.title}
          </div>
          {isFree ? <div className="text-xs text-green-600 font-semibold">Free Preview</div> : null}
        </div>
      </div>

      {isFree ? (
        <button className="btn-purple-animated shrink-0 inline-flex items-center justify-center px-5 h-10 rounded-full text-primary-foreground font-bold">
          Watch Free
        </button>
      ) : (
        <div className="shrink-0 inline-flex items-center gap-2 px-4 h-9 rounded-full bg-white border border-gray-200 text-gray-500 text-xs font-semibold">
          Locked
        </div>
      )}
    </div>
  )
}

export default function CourseContent() {
  const { courseId } = useParams()
  const course = lookup(COURSES, courseId)
  const page = lookup(PAGES, courseId)
  if (!course || !page) return <Navigate to="/courses" replace />
  const product = PRODUCTS[course.id]
  const lectures = courseLectures(course.id)
  const lockedCount = lectures.filter((l) => !l.free).length

  return (
    <div className="bg-white">
      <section className="pt-28 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
            {/* Left: Course content */}
            <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ duration: 0.4 }}>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#7c3aed]">Course content</p>
              <h1 className="mt-2 text-3xl md:text-4xl font-black text-[#0a0a0f]">{course.title}</h1>

              <div className="mt-8 rounded-2xl border border-green-200/60 bg-green-50/60 px-6 py-5 text-green-700 font-semibold text-sm leading-relaxed">
                {FREE_NOTICE}
              </div>

              <div className="mt-8 space-y-4">
                {lectures.map((lecture) => (
                  <LectureRow key={lecture.id} lecture={lecture} />
                ))}
                {lockedCount > 0 ? (
                  <p className="pt-2 text-center text-sm text-gray-400">Enroll to unlock all {lectures.length} lectures</p>
                ) : null}
              </div>

              <div className="mt-10">
                <Link to="/courses" className="text-primary font-bold">
                  ← Back to Courses
                </Link>
              </div>
            </motion.div>

            {/* Right: Sidebar */}
            <motion.aside
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="space-y-6"
            >
              {/* Enroll card */}
              <div className="rounded-2xl border border-gray-200/70 bg-white shadow-[0_10px_30px_-20px_rgba(0,0,0,0.18)] p-6">
                <div className="font-black text-[#0a0a0f]">Enroll Now</div>

                <div className="mt-4">
                  <div className="text-gray-400 line-through font-semibold">{formatINR(product.oldPricePaise)}</div>
                  <div className="text-4xl font-black text-[#0a0a0f]">{formatINR(product.pricePaise)}</div>
                  <div className="mt-1 text-sm text-gray-500 font-medium">{page.priceMeta}</div>
                </div>

                <button className="btn-purple-animated mt-6 w-full h-12 rounded-xl text-primary-foreground font-bold hover:opacity-90 transition-opacity">
                  Enroll in Course
                </button>

                <div className="mt-5 text-center text-sm text-gray-400">{page.enrollNote}</div>
              </div>

              {/* Included free */}
              <div className="rounded-2xl bg-[#0a0a0f] border border-white/10 shadow-2xl p-6">
                <div className="text-white font-black">Included FREE</div>

                <div className="mt-5 space-y-5">
                  {page.includedFree.map((item) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <div className="mt-0.5 w-8 h-8 rounded-lg bg-[#FBBF24]/15 flex items-center justify-center shrink-0">
                        <Star size={16} className="text-[#FBBF24]" />
                      </div>
                      <div>
                        <div className="text-[#FBBF24] font-bold">{item.title}</div>
                        <div className="text-white/60 text-sm leading-relaxed">{item.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Course format */}
              <div className="rounded-2xl border border-gray-200/70 bg-white shadow-[0_10px_30px_-20px_rgba(0,0,0,0.18)] p-6">
                <div className="font-black text-[#0a0a0f]">Course Format</div>
                <div className="mt-5 space-y-3">
                  {FORMAT.map((line) => (
                    <div key={line} className="flex items-center gap-3 text-gray-600 font-semibold">
                      <CheckCircle2 size={18} className="text-green-600" />
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 8: Verify**

Run: `npm test && npm run build`. Both should pass.
Run: `npm run dev`. Check:
- `/courses` shows the same prices as before. Lecture counts now come from the catalog.
- `/courses/foundations` shows the course title and every lecture.
- `/courses/nope` redirects to `/courses`.

- [ ] **Step 9: Commit**

```bash
git add src/data/catalog.ts worker/lib.test.ts package.json src/pages/Courses.tsx src/pages/CourseContent.tsx
git commit -m "feat: single course catalog shared by site and worker"
```

---

## Task 4: Database schema and pure helpers

**Files:**
- Create: `migrations/0001_init.sql`, `worker/lib.ts`, `src/lib/bitmap.ts`
- Modify: `worker/lib.test.ts`, `package.json` (db scripts)

**Interfaces:**
- Produces, from `worker/lib.ts`:

```ts
sha256Hex(text: string): Promise<string>                       // lowercase hex
hmacVerify(secret: string, message: string, sigHex: string): Promise<boolean>
randomToken(bytes = 32): string                                // base64url, 43 chars for 32 bytes
randomCode(): string                                           // 6 digits
safeNext(next: string | null | undefined, fallback = '/dashboard'): string
isEmail(s: string): boolean
mediaKey(pathname: string): { lectureId: string; key: string; ext: string } | null
CONTENT_TYPES: Record<string, string>
```

- Produces, from `src/lib/bitmap.ts`:

```ts
BUCKET_S = 10
bucketCount(durationS: number): number
fromRanges(ranges: Array<[number, number]>, durationS: number): string   // hex
orHex(a: string, b: string, n: number): string
countHex(hex: string, n: number): number
isHexBitmap(hex: string, n: number): boolean
```

- Produces, in the test file: `testDb(): D1Database`, a D1 stand-in over `node:sqlite` with the real migration applied. Tasks 5, 7 and 9 use it.

- [ ] **Step 1: Write the failing tests**

Add these imports to the **top** of `worker/lib.test.ts`, below the existing ones:

```ts
import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { hmacVerify, isEmail, mediaKey, randomCode, randomToken, safeNext, sha256Hex } from './lib.ts'
import { bucketCount, countHex, fromRanges, isHexBitmap, orHex } from '../src/lib/bitmap.ts'
```

Append to the end of the file:

```ts
/** D1 stand-in over node:sqlite with the real migration applied: prepare/bind/first/all/run/batch. */
function testDb(): D1Database {
  const db = new DatabaseSync(':memory:')
  db.exec('PRAGMA foreign_keys = ON;')
  db.exec(readFileSync(new URL('../migrations/0001_init.sql', import.meta.url), 'utf8'))
  const stmt = (sql: string, args: unknown[] = []) => ({
    bind: (...a: unknown[]) => stmt(sql, a),
    first: async () => db.prepare(sql).get(...(args as never[])) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...(args as never[])) }),
    run: async () => {
      const r = db.prepare(sql).run(...(args as never[]))
      return { meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } }
    },
  })
  return {
    prepare: (sql: string) => stmt(sql),
    batch: async (stmts: Array<{ run: () => Promise<unknown> }>) => {
      const out = []
      for (const s of stmts) out.push(await s.run())
      return out
    },
  } as unknown as D1Database
}

const DAY = 86_400_000

test('schema: orders.status only allows known states', async () => {
  const db = testDb()
  await db.prepare(`INSERT INTO users(id, email, created_at, last_seen_at) VALUES(1, 'a@b.co', 0, 0)`).run()
  await assert.rejects(
    db.prepare(`INSERT INTO orders(id, user_id, product_id, amount, status, created_at) VALUES('o1', 1, 'foundations', 100, 'bogus', 0)`).run(),
  )
})

test('lib: sha256Hex matches the standard test vector', async () => {
  assert.equal(await sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
})

test('lib: hmacVerify accepts the right signature and rejects tampering', async () => {
  const sig = createHmac('sha256', 'shh').update('order_1|pay_1').digest('hex')
  assert.equal(await hmacVerify('shh', 'order_1|pay_1', sig), true)
  assert.equal(await hmacVerify('shh', 'order_1|pay_2', sig), false)
  assert.equal(await hmacVerify('other', 'order_1|pay_1', sig), false)
  assert.equal(await hmacVerify('shh', 'order_1|pay_1', 'not-hex'), false)
})

test('lib: randomCode is 6 digits; randomToken is url-safe', () => {
  for (let i = 0; i < 50; i++) assert.match(randomCode(), /^\d{6}$/)
  assert.match(randomToken(), /^[A-Za-z0-9_-]{43}$/)
})

test('lib: safeNext only allows same-site paths', () => {
  assert.equal(safeNext('/learn/foundations'), '/learn/foundations')
  assert.equal(safeNext('//evil.com'), '/dashboard')
  assert.equal(safeNext('/\\evil.com'), '/dashboard')
  assert.equal(safeNext('https://evil.com'), '/dashboard')
  assert.equal(safeNext(null), '/dashboard')
})

test('lib: isEmail', () => {
  assert.equal(isEmail('a@b.co'), true)
  assert.equal(isEmail('a@b'), false)
  assert.equal(isEmail('a b@c.co'), false)
  assert.equal(isEmail(`${'x'.repeat(250)}@b.co`), false)
})

test('lib: mediaKey accepts HLS paths and rejects traversal', () => {
  assert.deepEqual(mediaKey('/media/foundations-01/master.m3u8'), {
    lectureId: 'foundations-01',
    key: 'foundations-01/master.m3u8',
    ext: 'm3u8',
  })
  assert.equal(mediaKey('/media/foundations-01/720p/seg_0003.ts')?.key, 'foundations-01/720p/seg_0003.ts')
  assert.equal(mediaKey('/media/foundations-01/../secret.ts'), null)
  assert.equal(mediaKey('/media/foundations-01/x.exe'), null)
  assert.equal(mediaKey('/media/Foundations-01/master.m3u8'), null)
})

test('bitmap: only fully played 10s buckets count; seeking adds nothing', () => {
  const d = 100 // 10 buckets
  assert.equal(countHex(fromRanges([[0, 5], [95, 100]], d), bucketCount(d)), 0) // jumped to the end
  assert.equal(countHex(fromRanges([[0, 50]], d), bucketCount(d)), 5)
  assert.equal(countHex(fromRanges([[0, 9.6]], d), bucketCount(d)), 1) // 0.5s float tolerance
})

test('bitmap: the short last bucket counts when played to the end', () => {
  assert.equal(countHex(fromRanges([[90, 95]], 95), bucketCount(95)), 1)
})

test('bitmap: two partial sessions merge past the completion bar', () => {
  const n = bucketCount(100)
  const merged = orHex(fromRanges([[0, 50]], 100), fromRanges([[50, 90]], 100), n)
  assert.equal(Math.floor((countHex(merged, n) * 100) / n), 90)
})

test('bitmap: validation rejects non-hex, odd-length and oversized input', () => {
  const n = bucketCount(100) // 2 bytes
  assert.equal(isHexBitmap('ff03', n), true)
  assert.equal(isHexBitmap('', n), true)
  assert.equal(isHexBitmap('zz03', n), false)
  assert.equal(isHexBitmap('fff', n), false)
  assert.equal(isHexBitmap('ff03ff', n), false)
})

test('bitmap: bits beyond the lecture length are ignored', () => {
  assert.equal(countHex('ffff', 10), 10)
})
```

`DAY` is used by Task 5's tests. It's declared here so all tests share one copy.

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test`
Expected: FAIL, `Cannot find module '.../worker/lib.ts'`

- [ ] **Step 3: Create `migrations/0001_init.sql`**

```sql
-- Phase 1 schema. Times are unix epoch milliseconds; money is paise (GST-inclusive).

CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  google_sub TEXT UNIQUE,
  is_admin INTEGER NOT NULL DEFAULT 0,
  utm TEXT, -- first-touch attribution JSON, written once at signup
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY, -- sha256(token); the raw token only ever lives in the cookie
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);

CREATE TABLE otps (
  email TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_at INTEGER NOT NULL,
  window_at INTEGER NOT NULL, -- start of the 24h send-count window
  sends INTEGER NOT NULL
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY, -- Razorpay order_id
  user_id INTEGER NOT NULL REFERENCES users(id),
  product_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('created', 'paid', 'failed', 'refunded')),
  payment_id TEXT,
  created_at INTEGER NOT NULL,
  paid_at INTEGER
);
CREATE INDEX orders_user ON orders(user_id);
CREATE INDEX orders_payment ON orders(payment_id);

CREATE TABLE enrollments (
  user_id INTEGER NOT NULL REFERENCES users(id),
  course_id TEXT NOT NULL,
  source TEXT NOT NULL, -- 'order:<order_id>' or 'admin'
  granted_at INTEGER NOT NULL,
  revoked_at INTEGER,
  PRIMARY KEY (user_id, course_id)
);

CREATE TABLE progress (
  user_id INTEGER NOT NULL REFERENCES users(id),
  lecture_id TEXT NOT NULL,
  position_s INTEGER NOT NULL, -- resume point
  watched TEXT NOT NULL, -- hex bitmap of 10s buckets actually played
  pct INTEGER NOT NULL,
  completed_at INTEGER,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, lecture_id)
);

-- Append-only business log: logins, payments, refunds, completions. Feeds the Phase 3 admin views.
CREATE TABLE events (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  type TEXT NOT NULL,
  data TEXT,
  at INTEGER NOT NULL
);
CREATE INDEX events_user ON events(user_id, at);
```

- [ ] **Step 4: Create `worker/lib.ts`**

```ts
// Pure helpers (Web Crypto only): used by Worker routes and runnable under `node --test`.

const enc = new TextEncoder()
const toHex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')

export async function sha256Hex(text: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', enc.encode(text)))
}

/** Constant-time check of a hex HMAC-SHA256 signature (Razorpay payment and webhook signatures). */
export async function hmacVerify(secret: string, message: string, sigHex: string): Promise<boolean> {
  if (!/^[0-9a-f]{64}$/.test(sigHex)) return false
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
  const sig = new Uint8Array(32)
  for (let i = 0; i < 32; i++) sig[i] = parseInt(sigHex.slice(i * 2, i * 2 + 2), 16)
  return crypto.subtle.verify('HMAC', key, sig, enc.encode(message))
}

export function randomToken(bytes = 32): string {
  const b = crypto.getRandomValues(new Uint8Array(bytes))
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export const randomCode = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0')

/** Same-site path to land on after login. Blocks `//host` and `/\host` open redirects. */
export const safeNext = (next: string | null | undefined, fallback = '/dashboard') =>
  next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : fallback

export const isEmail = (s: string) => s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

// Directory and file names are [a-z0-9_-] only, so `..` can never reach R2.
const MEDIA_RE = /^\/media\/([a-z0-9-]+)\/((?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.(m3u8|ts|m4s|mp4|jpg|vtt))$/

export function mediaKey(pathname: string): { lectureId: string; key: string; ext: string } | null {
  const m = MEDIA_RE.exec(pathname)
  return m ? { lectureId: m[1], key: `${m[1]}/${m[2]}`, ext: m[3] } : null
}

export const CONTENT_TYPES: Record<string, string> = {
  m3u8: 'application/vnd.apple.mpegurl',
  ts: 'video/mp2t',
  m4s: 'video/iso.segment',
  mp4: 'video/mp4',
  jpg: 'image/jpeg',
  vtt: 'text/vtt',
}
```

- [ ] **Step 5: Create `src/lib/bitmap.ts`**

```ts
// Which 10-second buckets of a lecture were actually played, as a hex bitmap
// (bucket i = bit i%8 of byte i/8). The player builds it; the Worker merges and counts it.
// Imported by the Worker too, so this file must stay import-free.

export const BUCKET_S = 10

export const bucketCount = (durationS: number) => Math.max(1, Math.ceil(durationS / BUCKET_S))

const byteLen = (n: number) => Math.ceil(n / 8)

function toBytes(hex: string, len: number): Uint8Array {
  const out = new Uint8Array(len)
  for (let i = 0; i < len && i * 2 < hex.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')

/** Buckets fully covered by played time ranges (e.g. `video.played`). Seeking past a bucket never marks it. */
export function fromRanges(ranges: Array<[number, number]>, durationS: number): string {
  const n = bucketCount(durationS)
  const bytes = new Uint8Array(byteLen(n))
  for (const [s, e] of ranges) {
    for (let i = Math.floor(s / BUCKET_S); i < n && i * BUCKET_S < e; i++) {
      const start = i * BUCKET_S
      const end = Math.min(start + BUCKET_S, durationS)
      // 0.5s tolerance absorbs float jitter at bucket edges.
      if (s <= start + 0.5 && e >= end - 0.5) bytes[i >> 3] |= 1 << (i & 7)
    }
  }
  return toHex(bytes)
}

export function orHex(a: string, b: string, n: number): string {
  const x = toBytes(a, byteLen(n))
  const y = toBytes(b, byteLen(n))
  for (let i = 0; i < x.length; i++) x[i] |= y[i]
  return toHex(x)
}

export function countHex(hex: string, n: number): number {
  const bytes = toBytes(hex, byteLen(n))
  let count = 0
  for (let i = 0; i < n; i++) if (bytes[i >> 3] & (1 << (i & 7))) count++
  return count
}

export const isHexBitmap = (hex: string, n: number) =>
  hex.length % 2 === 0 && hex.length <= byteLen(n) * 2 && /^[0-9a-f]*$/.test(hex)
```

- [ ] **Step 6: Run the tests**

Run: `npm test`
Expected: everything passes, except the `todo` if Task 3 Step 5 is still pending. If `node:sqlite` prints an `ExperimentalWarning`, ignore it.

- [ ] **Step 7: Apply the migration locally**

Add these to `package.json` `"scripts"`:

```json
"db:migrate:local": "wrangler d1 migrations apply ypm --local",
"db:migrate:remote": "wrangler d1 migrations apply ypm --remote"
```

Run: `npm run db:migrate:local`
Expected: `0001_init.sql` is listed as applied.
Run: `npx wrangler d1 execute ypm --local --command "SELECT name FROM sqlite_master WHERE type='table'"`
Expected: the list includes `users`, `sessions`, `otps`, `orders`, `enrollments`, `progress` and `events`.

- [ ] **Step 8: Commit**

```bash
git add migrations/ worker/lib.ts worker/lib.test.ts src/lib/bitmap.ts package.json
git commit -m "feat: D1 schema, crypto helpers and watched-bucket bitmap"
```

---

## Task 5: Login API — email OTP, Google, sessions

**Files:**
- Create: `worker/auth.ts`, `worker/email.ts`
- Modify: `worker/http.ts`, `worker/index.ts`, `worker/lib.test.ts`

**Interfaces:**
- Consumes: `sha256Hex`, `randomToken`, `randomCode`, `safeNext`, `isEmail` (Task 4); `testDb()` (Task 4).
- Produces, from `worker/http.ts`:

```ts
readJson(req: Request): Promise<Record<string, unknown>>     // 415 unless JSON, 400 if malformed
getCookie(req: Request, name: string): string | null
redirect(location: string, headers?: Headers): Response    // 302
SESSION_COOKIE = 'ypm_s'; SESSION_IDLE_MS = 14 days
sessionCookie(token: string): string; clearSessionCookie: string
type Session = { sid: string; userId: number; email: string; name: string | null }
loadSession(db: D1Database, token: string | null, now: number): Promise<Session | null>
requireSession(req: Request, env: Env): Promise<Session>    // throws HttpError 401
```

- Produces, from `worker/auth.ts`: `issueOtp`, `checkOtp`, `upsertUser` and `createSession` (signatures in Step 4), plus the route handlers `sendOtp`, `verifyOtp`, `googleStart`, `googleCallback`, `logout` and `me`.
- Produces, from `worker/email.ts`: `sendEmail(env: Env, to: string, subject: string, text: string): Promise<void>`.
- HTTP contract:

| Request | Body | Response |
|---|---|---|
| `POST /api/auth/otp` | `{email, turnstileToken}` | `{ok: true}`, or 400/429 |
| `POST /api/auth/verify` | `{email, code, utm?}` | `{ok: true}` and sets the `ypm_s` cookie |
| `GET /api/auth/google?next=&utm=` | — | 302 to Google |
| `GET /api/auth/google/callback` | — | 302 to `next`, with the cookie set |
| `POST /api/auth/logout` | `{}` | `{ok: true}` and clears the cookie |
| `GET /api/me` | — | `{user: {email, name} \| null, enrollments: string[]}` |

- [ ] **Step 1: Write the failing tests**

Add to the top of `worker/lib.test.ts`:

```ts
import { checkOtp, createSession, issueOtp, upsertUser } from './auth.ts'
import { loadSession, SESSION_IDLE_MS } from './http.ts'
```

Append:

```ts
test('otp: single-use code, 60s cooldown, expiry', async () => {
  const db = testDb()
  const t0 = 1_000_000
  const first = (await issueOtp(db, 'a@b.co', t0)) as { code: string }
  assert.match(first.code, /^\d{6}$/)
  assert.equal(await issueOtp(db, 'a@b.co', t0 + 30_000), 'cooldown')
  assert.equal(await checkOtp(db, 'a@b.co', first.code === '000000' ? '111111' : '000000', t0 + 1), false)
  assert.equal(await checkOtp(db, 'a@b.co', first.code, t0 + 2), true)
  assert.equal(await checkOtp(db, 'a@b.co', first.code, t0 + 3), false) // already used
  const second = (await issueOtp(db, 'a@b.co', t0 + 61_000)) as { code: string }
  assert.equal(await checkOtp(db, 'a@b.co', second.code, t0 + 61_000 + 10 * 60_000 + 1), false) // expired
})

test('otp: locks after 5 wrong attempts', async () => {
  const db = testDb()
  const { code } = (await issueOtp(db, 'a@b.co', 0)) as { code: string }
  const wrong = code === '000000' ? '111111' : '000000'
  for (let i = 0; i < 5; i++) assert.equal(await checkOtp(db, 'a@b.co', wrong, 1), false)
  assert.equal(await checkOtp(db, 'a@b.co', code, 2), false)
})

test('otp: at most 10 codes per email per 24h', async () => {
  const db = testDb()
  for (let i = 0; i < 10; i++) assert.equal(typeof (await issueOtp(db, 'a@b.co', i * 61_000)), 'object')
  assert.equal(await issueOtp(db, 'a@b.co', 10 * 61_000), 'limit')
  assert.equal(typeof (await issueOtp(db, 'a@b.co', DAY + 1)), 'object')
})

test('users: first-touch utm kept; Google sub links to the same account', async () => {
  const db = testDb()
  const id = await upsertUser(db, { email: 'a@b.co', utm: '{"utm_source":"meta"}' }, 1)
  assert.equal(await upsertUser(db, { email: 'a@b.co', utm: '{"utm_source":"organic"}' }, 2), id)
  assert.equal(await upsertUser(db, { email: 'a@b.co', googleSub: 'g-1', name: 'A' }, 3), id)
  assert.equal(await upsertUser(db, { email: 'renamed@b.co', googleSub: 'g-1' }, 4), id) // Google email changed
  const row = (await db.prepare(`SELECT utm, name, google_sub FROM users WHERE id = ?`).bind(id).first()) as Record<string, unknown>
  assert.equal(row.utm, '{"utm_source":"meta"}')
  assert.equal(row.name, 'A')
  assert.equal(row.google_sub, 'g-1')
})

test('session: lookup, idle expiry, sliding refresh, max 3 per user', async () => {
  const db = testDb()
  const uid = await upsertUser(db, { email: 'a@b.co' }, 0)
  const t1 = await createSession(db, uid, 0)
  assert.equal((await loadSession(db, t1, 1))?.userId, uid)
  assert.equal(await loadSession(db, t1, SESSION_IDLE_MS + 1), null) // idle too long
  assert.equal(await loadSession(db, 'not-a-token', 1), null)
  const t2 = await createSession(db, uid, 0)
  await loadSession(db, t2, 2 * DAY) // activity on day 2 slides the expiry
  assert.ok(await loadSession(db, t2, SESSION_IDLE_MS + DAY))
  await createSession(db, uid, 10)
  const t4 = await createSession(db, uid, 20) // 4th session evicts the oldest (t1)
  assert.equal(await loadSession(db, t1, 30), null)
  assert.ok(await loadSession(db, t4, 30))
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test`
Expected: FAIL, `Cannot find module '.../worker/auth.ts'`

- [ ] **Step 3: Extend `worker/http.ts`**

Add an import at the top:

```ts
import { sha256Hex } from './lib.ts'
```

Append:

```ts
/** A JSON-only body blocks cross-site form posts (CSRF): browsers can't send it cross-origin without a CORS preflight, which we never approve. */
export async function readJson(req: Request): Promise<Record<string, unknown>> {
  if (!req.headers.get('content-type')?.startsWith('application/json')) throw new HttpError(415, 'Expected JSON')
  try {
    const body: unknown = await req.json()
    if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>
  } catch {
    // fall through
  }
  throw new HttpError(400, 'Invalid JSON')
}

export function getCookie(req: Request, name: string): string | null {
  for (const part of (req.headers.get('cookie') ?? '').split(';')) {
    const i = part.indexOf('=')
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim()
  }
  return null
}

export function redirect(location: string, headers = new Headers()): Response {
  headers.set('location', location)
  return new Response(null, { status: 302, headers })
}

const DAY = 86_400_000
export const SESSION_COOKIE = 'ypm_s'
export const SESSION_IDLE_MS = 14 * DAY

// The cookie deliberately outlives the idle timeout: the server-side expiry is what logs people out.
export const sessionCookie = (token: string) =>
  `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=34560000`
export const clearSessionCookie = `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`

export type Session = { sid: string; userId: number; email: string; name: string | null }

export async function loadSession(db: D1Database, token: string | null, now: number): Promise<Session | null> {
  if (!token) return null
  const sid = await sha256Hex(token)
  const row = await db
    .prepare(
      `SELECT s.user_id, s.expires_at, u.email, u.name FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.expires_at > ?`,
    )
    .bind(sid, now)
    .first<{ user_id: number; expires_at: number; email: string; name: string | null }>()
  if (!row) return null
  // Sliding idle timeout, written at most once a day per session.
  if (row.expires_at - now < SESSION_IDLE_MS - DAY) {
    await db.batch([
      db.prepare(`UPDATE sessions SET expires_at = ? WHERE id = ?`).bind(now + SESSION_IDLE_MS, sid),
      db.prepare(`UPDATE users SET last_seen_at = ? WHERE id = ?`).bind(now, row.user_id),
    ])
  }
  return { sid, userId: row.user_id, email: row.email, name: row.name }
}

export async function requireSession(req: Request, env: Env): Promise<Session> {
  const session = await loadSession(env.DB, getCookie(req, SESSION_COOKIE), Date.now())
  if (!session) throw new HttpError(401, 'Please log in')
  return session
}
```

- [ ] **Step 4: Create `worker/email.ts`**

```ts
import { HttpError } from './http.ts'

export async function sendEmail(env: Env, to: string, subject: string, text: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    // Local dev without Resend: read the email (e.g. a login code) from the dev server console.
    // Production must have RESEND_API_KEY set (Task 13 checklist), or codes would land in Workers Logs.
    console.log(JSON.stringify({ msg: 'email not sent (no RESEND_API_KEY)', to, subject, text }))
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, text }),
  })
  if (!res.ok) {
    console.error(JSON.stringify({ msg: 'email failed', to, subject, status: res.status, body: await res.text() }))
    throw new HttpError(502, 'Could not send the email. Please try again.')
  }
}
```

- [ ] **Step 5: Create `worker/auth.ts`**

```ts
import { sendEmail } from './email.ts'
import {
  clearSessionCookie,
  getCookie,
  HttpError,
  json,
  loadSession,
  readJson,
  redirect,
  SESSION_COOKIE,
  SESSION_IDLE_MS,
  sessionCookie,
} from './http.ts'
import { isEmail, randomCode, randomToken, safeNext, sha256Hex } from './lib.ts'

const MIN = 60_000
const DAY = 86_400_000
const OTP_TTL = 10 * MIN
const OTP_COOLDOWN = MIN
const OTP_DAILY_MAX = 10
const OTP_MAX_ATTEMPTS = 5
const MAX_SESSIONS = 3

const normEmail = (v: unknown) => {
  const email = typeof v === 'string' ? v.trim().toLowerCase() : ''
  return isEmail(email) ? email : ''
}
const utmString = (v: unknown) => (typeof v === 'string' && v.length <= 1000 ? v : null)

// ---- DB logic (exported for tests) ----

/** Stores a fresh code for `email`. Rate limits: one per minute, OTP_DAILY_MAX per 24h window. */
export async function issueOtp(db: D1Database, email: string, now: number): Promise<{ code: string } | 'cooldown' | 'limit'> {
  const row = await db
    .prepare(`SELECT sent_at, window_at, sends FROM otps WHERE email = ?`)
    .bind(email)
    .first<{ sent_at: number; window_at: number; sends: number }>()
  if (row && now - row.sent_at < OTP_COOLDOWN) return 'cooldown'
  const inWindow = row !== null && now - row.window_at <= DAY
  if (inWindow && row.sends >= OTP_DAILY_MAX) return 'limit'
  const code = randomCode()
  await db
    .prepare(
      `INSERT INTO otps(email, code_hash, expires_at, attempts, sent_at, window_at, sends) VALUES(?, ?, ?, 0, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0,
         sent_at = excluded.sent_at, window_at = excluded.window_at, sends = excluded.sends`,
    )
    .bind(email, await sha256Hex(`${email}:${code}`), now + OTP_TTL, now, inWindow ? row.window_at : now, inWindow ? row.sends + 1 : 1)
    .run()
  return { code }
}

/** True once for the right, unexpired code; every check (right or wrong) uses up an attempt. */
export async function checkOtp(db: D1Database, email: string, code: string, now: number): Promise<boolean> {
  const row = await db
    .prepare(`UPDATE otps SET attempts = attempts + 1 WHERE email = ? AND expires_at > ? AND attempts < ? RETURNING code_hash`)
    .bind(email, now, OTP_MAX_ATTEMPTS)
    .first<{ code_hash: string }>()
  if (!row || row.code_hash !== (await sha256Hex(`${email}:${code}`))) return false
  // Expire rather than delete, so the send-rate window survives.
  await db.prepare(`UPDATE otps SET expires_at = 0 WHERE email = ?`).bind(email).run()
  return true
}

/** Finds or creates the user. `utm` is only written on creation (first touch). */
export async function upsertUser(
  db: D1Database,
  u: { email: string; name?: string | null; googleSub?: string | null; utm?: string | null },
  now: number,
): Promise<number> {
  if (u.googleSub) {
    const bySub = await db.prepare(`SELECT id FROM users WHERE google_sub = ?`).bind(u.googleSub).first<{ id: number }>()
    if (bySub) return bySub.id
  }
  const row = await db
    .prepare(
      `INSERT INTO users(email, name, google_sub, utm, created_at, last_seen_at) VALUES(?, ?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET name = COALESCE(users.name, excluded.name),
         google_sub = COALESCE(users.google_sub, excluded.google_sub), last_seen_at = excluded.last_seen_at
       RETURNING id`,
    )
    .bind(u.email, u.name ?? null, u.googleSub ?? null, u.utm ?? null, now, now)
    .first<{ id: number }>()
  return row!.id
}

/** Returns the raw token for the cookie; only its hash is stored. */
export async function createSession(db: D1Database, userId: number, now: number): Promise<string> {
  const token = randomToken()
  await db.batch([
    db.prepare(`INSERT INTO sessions(id, user_id, created_at, expires_at) VALUES(?, ?, ?, ?)`).bind(await sha256Hex(token), userId, now, now + SESSION_IDLE_MS),
    // Basic anti-sharing: an account keeps only its most recent sessions.
    db
      .prepare(
        `DELETE FROM sessions WHERE user_id = ? AND id NOT IN
         (SELECT id FROM sessions WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?)`,
      )
      .bind(userId, userId, MAX_SESSIONS),
    db.prepare(`INSERT INTO events(user_id, type, data, at) VALUES(?, 'login', NULL, ?)`).bind(userId, now),
  ])
  return token
}

async function turnstileOk(env: Env, token: string, ip: string | null): Promise<boolean> {
  const form = new FormData()
  form.append('secret', env.TURNSTILE_SECRET)
  form.append('response', token)
  if (ip) form.append('remoteip', ip)
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
  return ((await res.json()) as { success?: boolean }).success === true
}

// ---- Routes ----

export async function sendOtp(req: Request, env: Env): Promise<Response> {
  const body = await readJson(req)
  const email = normEmail(body.email)
  if (!email) throw new HttpError(400, 'Enter a valid email address')
  if (typeof body.turnstileToken !== 'string' || !(await turnstileOk(env, body.turnstileToken, req.headers.get('cf-connecting-ip')))) {
    throw new HttpError(400, 'Verification failed. Please try again.')
  }
  const result = await issueOtp(env.DB, email, Date.now())
  if (result === 'cooldown') throw new HttpError(429, 'Please wait a minute before requesting another code')
  if (result === 'limit') throw new HttpError(429, 'Too many codes today. Try again tomorrow or continue with Google.')
  await sendEmail(
    env,
    email,
    'Your YPM login code',
    `Your login code is ${result.code}. It expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.`,
  )
  return json({ ok: true })
}

export async function verifyOtp(req: Request, env: Env): Promise<Response> {
  const body = await readJson(req)
  const email = normEmail(body.email)
  const code = typeof body.code === 'string' ? body.code.trim() : ''
  if (!email || !/^\d{6}$/.test(code)) throw new HttpError(400, 'Enter the 6-digit code from the email')
  const now = Date.now()
  if (!(await checkOtp(env.DB, email, code, now))) throw new HttpError(400, 'That code is wrong or has expired')
  const userId = await upsertUser(env.DB, { email, utm: utmString(body.utm) }, now)
  const token = await createSession(env.DB, userId, now)
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie(token) })
}

const GOOGLE_COOKIE = 'ypm_g'

export function googleStart(req: Request, env: Env): Response {
  if (!env.GOOGLE_CLIENT_ID) throw new HttpError(503, 'Google sign-in is not configured')
  const url = new URL(req.url)
  const state = randomToken(16)
  const saved = encodeURIComponent(
    JSON.stringify({ state, next: safeNext(url.searchParams.get('next')), utm: utmString(url.searchParams.get('utm')) }),
  )
  const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  auth.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${url.origin}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  }).toString()
  return redirect(
    auth.toString(),
    new Headers({ 'set-cookie': `${GOOGLE_COOKIE}=${saved}; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=600` }),
  )
}

export async function googleCallback(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url)
  const fail = () => redirect('/login?error=google')
  let saved: { state?: string; next?: string; utm?: string | null }
  try {
    saved = JSON.parse(decodeURIComponent(getCookie(req, GOOGLE_COOKIE) ?? ''))
  } catch {
    return fail()
  }
  const code = url.searchParams.get('code')
  if (!code || !saved.state || saved.state !== url.searchParams.get('state')) return fail()

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${url.origin}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  })
  if (!tokenRes.ok) {
    console.error(JSON.stringify({ msg: 'google token exchange failed', status: tokenRes.status, body: await tokenRes.text() }))
    return fail()
  }
  const { id_token } = (await tokenRes.json()) as { id_token: string }
  // Received straight from Google's token endpoint over TLS, so the JWT signature needn't be re-verified.
  const payload = id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  const claims = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(payload), (c) => c.charCodeAt(0)))) as {
    aud: string
    sub: string
    email: string
    email_verified: boolean
    name?: string
  }
  if (claims.aud !== env.GOOGLE_CLIENT_ID || !claims.email_verified) return fail()

  const now = Date.now()
  const userId = await upsertUser(
    env.DB,
    { email: claims.email.toLowerCase(), name: claims.name ?? null, googleSub: claims.sub, utm: saved.utm ?? null },
    now,
  )
  const headers = new Headers()
  headers.append('set-cookie', sessionCookie(await createSession(env.DB, userId, now)))
  headers.append('set-cookie', `${GOOGLE_COOKIE}=; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=0`)
  return redirect(safeNext(saved.next), headers)
}

export async function logout(req: Request, env: Env): Promise<Response> {
  await readJson(req) // JSON-only, like every state-changing POST
  const token = getCookie(req, SESSION_COOKIE)
  if (token) await env.DB.prepare(`DELETE FROM sessions WHERE id = ?`).bind(await sha256Hex(token)).run()
  return json({ ok: true }, 200, { 'set-cookie': clearSessionCookie })
}

export async function me(req: Request, env: Env): Promise<Response> {
  const session = await loadSession(env.DB, getCookie(req, SESSION_COOKIE), Date.now())
  if (!session) return json({ user: null, enrollments: [] })
  const { results } = await env.DB.prepare(`SELECT course_id FROM enrollments WHERE user_id = ? AND revoked_at IS NULL`)
    .bind(session.userId)
    .all<{ course_id: string }>()
  return json({ user: { email: session.email, name: session.name }, enrollments: results.map((r) => r.course_id) })
}
```

- [ ] **Step 6: Wire the routes**

Replace `worker/index.ts` with:

```ts
import { googleCallback, googleStart, logout, me, sendOtp, verifyOtp } from './auth.ts'
import { HttpError, json } from './http.ts'

export default {
  async fetch(req, env): Promise<Response> {
    const url = new URL(req.url)
    try {
      switch (`${req.method} ${url.pathname}`) {
        case 'GET /api/health':
          return json({ ok: true })
        case 'POST /api/auth/otp':
          return await sendOtp(req, env)
        case 'POST /api/auth/verify':
          return await verifyOtp(req, env)
        case 'GET /api/auth/google':
          return googleStart(req, env)
        case 'GET /api/auth/google/callback':
          return await googleCallback(req, env)
        case 'POST /api/auth/logout':
          return await logout(req, env)
        case 'GET /api/me':
          return await me(req, env)
      }
      return json({ error: 'Not found' }, 404)
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status)
      console.error(JSON.stringify({ msg: 'unhandled', path: url.pathname, err: String(err), stack: (err as Error).stack }))
      return json({ error: 'Something went wrong' }, 500)
    }
  },
} satisfies ExportedHandler<Env>
```

- [ ] **Step 7: Run the tests and the typecheck**

Run: `npm test` → all pass (the catalog `todo` aside).
Run: `npx tsc -p tsconfig.worker.json` → no errors. If `Env` is missing a secret, add the key to `.dev.vars` and rerun `npx wrangler types`.

- [ ] **Step 8: Try it by hand**

```bash
npm run dev
# 415: not JSON (CSRF guard)
curl -si -X POST localhost:5173/api/auth/otp -d 'email=a@b.co' | head -1
# 200: the test Turnstile secret accepts the dummy token; the code prints in the dev-server console
curl -si -X POST localhost:5173/api/auth/otp -H 'content-type: application/json' \
  -d '{"email":"me@example.com","turnstileToken":"XXXX.DUMMY.TOKEN.XXXX"}' | head -1
# 429 on an immediate repeat
curl -si -X POST localhost:5173/api/auth/otp -H 'content-type: application/json' \
  -d '{"email":"me@example.com","turnstileToken":"XXXX.DUMMY.TOKEN.XXXX"}' | head -1
# verify: copy the ypm_s value from the Set-Cookie header
curl -si -X POST localhost:5173/api/auth/verify -H 'content-type: application/json' \
  -d '{"email":"me@example.com","code":"<CODE FROM CONSOLE>"}' | grep -i set-cookie
curl -s localhost:5173/api/me -H 'cookie: ypm_s=<TOKEN>'
# expect {"user":{"email":"me@example.com","name":null},"enrollments":[]}
```

If `GOOGLE_CLIENT_ID` is set, also open `http://localhost:5173/api/auth/google?next=/` in Chrome. Expect: Google account picker, then back on `/` with the `ypm_s` cookie set (DevTools → Application → Cookies).

- [ ] **Step 9: Commit**

```bash
git add worker/ 
git commit -m "feat: email OTP + Google login with hashed, sliding sessions"
```

---

## Task 6: Login page, logged-in state, first-touch UTM

**Files:**
- Create: `src/lib/api.ts`, `src/lib/me.ts`, `src/components/ui.ts`, `src/pages/Login.tsx`
- Modify: `src/main.tsx`, `src/App.tsx`, `src/components/layout/Navbar.tsx`

**Interfaces:**
- Consumes the HTTP contract from Task 5.
- Produces:

```ts
// src/lib/api.ts
class ApiError extends Error { status: number }
api<T>(path: string, body?: unknown): Promise<T>   // GET without body; JSON POST with body; throws ApiError(status, server error message)
loadScript(src: string): Promise<void>             // loads a script tag once
// src/lib/me.ts
type Me = { user: { email: string; name: string | null } | null; enrollments: string[] }
useMe(): UseQueryResult<Me>                        // query key ['me']
// src/components/ui.ts
btnPrimary, btnGhost, input: string                // class lists for app pages
```

- [ ] **Step 1: Create `src/lib/api.ts`**

```ts
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** GET when `body` is omitted, JSON POST otherwise (the Worker requires JSON on every POST). */
export async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(
    path,
    body === undefined
      ? undefined
      : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) },
  )
  const data: unknown = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? 'Something went wrong')
  return data as T
}

const scripts = new Map<string, Promise<void>>()

/** Loads a third-party script once (Razorpay Checkout, Turnstile). */
export function loadScript(src: string): Promise<void> {
  let loading = scripts.get(src)
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const el = document.createElement('script')
      el.src = src
      el.async = true
      el.onload = () => resolve()
      el.onerror = () => {
        scripts.delete(src)
        el.remove()
        reject(new Error(`Failed to load ${src}`))
      }
      document.head.appendChild(el)
    })
    scripts.set(src, loading)
  }
  return loading
}
```

- [ ] **Step 2: Create `src/lib/me.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type Me = { user: { email: string; name: string | null } | null; enrollments: string[] }

export const useMe = () => useQuery({ queryKey: ['me'], queryFn: () => api<Me>('/api/me') })
```

- [ ] **Step 3: Create `src/components/ui.ts`**

```ts
// Shared class lists for the app pages (login, dashboard, player). Marketing pages keep their own styles.
export const btnPrimary =
  'inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
export const btnGhost =
  'inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/15 px-6 font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/5'
export const input =
  'block w-full rounded-lg border border-white/15 bg-black px-4 py-3 text-white placeholder:text-white/35 focus:border-primary focus:outline-none'
```

- [ ] **Step 4: Add the query client and first-touch UTM capture to `src/main.tsx`**

Replace `src/main.tsx` with:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './styles.css'

// First-touch attribution for Meta ads: remember the first landing's UTM/fbclid until the visitor signs up.
try {
  const params = new URLSearchParams(window.location.search)
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'].filter((k) => params.has(k))
  if (keys.length && !localStorage.getItem('ypm_utm')) {
    localStorage.setItem(
      'ypm_utm',
      JSON.stringify({
        ...Object.fromEntries(keys.map((k) => [k, params.get(k)])),
        referrer: document.referrer.slice(0, 200),
        landing: window.location.pathname,
        at: Date.now(),
      }),
    )
  }
} catch {
  // Storage blocked (private mode): attribution is best-effort.
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false } },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
```

- [ ] **Step 5: Create `src/pages/Login.tsx`**

```tsx
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { api, ApiError, loadScript } from '@/lib/api'
import { useMe } from '@/lib/me'
import { btnGhost, btnPrimary, input } from '@/components/ui'

type Turnstile = {
  render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void }) => string
  reset: (id: string) => void
}
declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string

function storedUtm(): string | null {
  try {
    return localStorage.getItem('ypm_utm')
  } catch {
    return null
  }
}

export default function Login() {
  const [params] = useSearchParams()
  const next = params.get('next') ?? '/dashboard'
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: me } = useMe()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(
    params.get('error') === 'google' ? 'Google sign-in did not complete. Try again or use your email.' : '',
  )
  const widgetEl = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)

  useEffect(() => {
    loadScript('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit')
      .then(() => {
        if (!widgetEl.current || !window.turnstile || widgetId.current) return
        widgetId.current = window.turnstile.render(widgetEl.current, {
          sitekey: SITE_KEY,
          callback: setToken,
          'expired-callback': () => setToken(''),
        })
      })
      .catch(() => setError('Could not load the verification check. Disable ad-blockers for this site and refresh.'))
  }, [])

  if (me?.user) return <Navigate to={next} replace />

  const fail = (err: unknown) => setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')

  async function sendCode(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/api/auth/otp', { email, turnstileToken: token })
      setStep('code')
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
      // Turnstile tokens are single-use.
      setToken('')
      if (widgetId.current) window.turnstile?.reset(widgetId.current)
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/api/auth/verify', { email, code, utm: storedUtm() })
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      navigate(next, { replace: true })
    } catch (err) {
      fail(err)
      setBusy(false)
    }
  }

  const utm = storedUtm()
  const googleHref = `/api/auth/google?next=${encodeURIComponent(next)}${utm ? `&utm=${encodeURIComponent(utm)}` : ''}`

  return (
    <div className="bg-black px-4 pt-32 pb-24 text-white">
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-card p-8">
        <h1 className="text-2xl font-bold">Log in to YPM</h1>
        <p className="mt-2 text-sm text-white/60">Use the email you enrolled with. New here? Logging in creates your account.</p>

        <a href={googleHref} className={`${btnGhost} mt-8 w-full`}>
          Continue with Google
        </a>
        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-white/40">
          <span className="h-px flex-1 bg-white/10" />
          or
          <span className="h-px flex-1 bg-white/10" />
        </div>

        {step === 'email' ? (
          <form onSubmit={sendCode} className="space-y-4">
            <label className="block text-sm font-medium text-white/80" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={input}
            />
            <button type="submit" disabled={busy || !token} className={`${btnPrimary} w-full`}>
              {busy ? 'Sending…' : 'Email me a login code'}
            </button>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-4">
            <label className="block text-sm font-medium text-white/80" htmlFor="code">
              Enter the 6-digit code sent to {email}
            </label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className={`${input} tracking-[0.5em]`}
            />
            <button type="submit" disabled={busy || code.length !== 6} className={`${btnPrimary} w-full`}>
              {busy ? 'Checking…' : 'Log in'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('email')
                setCode('')
              }}
              className="w-full text-sm text-white/60 hover:text-white"
            >
              Use a different email or resend the code
            </button>
          </form>
        )}
        {/* Stays mounted across steps so the Turnstile widget survives "resend". */}
        <div ref={widgetEl} className={step === 'email' ? 'mt-4' : 'hidden'} />
        {error ? (
          <p role="alert" className="mt-4 text-sm text-red-400">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Add the route and the logged-in nav item**

In `src/App.tsx`, add `const Login = lazy(() => import('@/pages/Login'))` after the `Verify` lazy import. Add `<Route path="/login" element={<Login />} />` after the `/verify` route.

In `src/components/layout/Navbar.tsx`:
- Add `import { useMe } from '@/lib/me'`.
- Inside `Navbar()`, after `const location = useLocation()`, add:

```ts
  const { data: me } = useMe()
  // Logged-in visitors get their course dashboard in place of Login.
  const items = me?.user ? navLinks.map((l) => (l.href === '/login' ? { href: '/dashboard', label: 'My Courses' } : l)) : navLinks
```

- Change `items={navLinks}` to `items={items}`.

- [ ] **Step 7: Verify in the browser** (Chrome; Safari drops Secure cookies on `http://localhost`)

1. `npm run build` passes. Then run `npm run dev`.
2. Open `http://localhost:5173/?utm_source=meta&utm_campaign=launch` in a fresh profile, then go to `/login?next=/`. The Turnstile test widget shows "Success" and the send button enables.
3. Enter a new email and copy the code from the dev-server console. Expect to land on `/` with the nav showing **My Courses** in place of Login.
4. `npx wrangler d1 execute ypm --local --command "SELECT email, utm FROM users"` → the new user has `utm` containing `"utm_source":"meta"`.
5. Enter a wrong code. Expect the error "That code is wrong or has expired".
6. Hit send twice within a minute. Expect the cooldown message.
7. With Google configured: "Continue with Google" lands back logged in.

- [ ] **Step 8: Commit**

```bash
git add src/lib/api.ts src/lib/me.ts src/components/ui.ts src/pages/Login.tsx src/main.tsx src/App.tsx src/components/layout/Navbar.tsx
git commit -m "feat: login page (email code + Google) and logged-in nav"
```

---

## Task 7: Payments API — Razorpay checkout, verify, webhook

**Files:**
- Create: `worker/pay.ts`
- Modify: `worker/index.ts`, `worker/lib.test.ts`

**Interfaces:**
- Consumes: `PRODUCTS`, `lookup`, `formatINR` (Task 3); `hmacVerify` (Task 4); `requireSession`, `readJson`, `json`, `HttpError` (Task 5); `sendEmail` (Task 5); `SUPPORT_EMAIL` from `src/lib/links.ts`.
- Produces, from `worker/pay.ts`:

```ts
type Paid = { userId: number; productId: string; amount: number }
ownsAll(db: D1Database, userId: number, grants: string[]): Promise<boolean>
fulfill(db: D1Database, orderId: string, paymentId: string, now: number): Promise<Paid | null>   // null = already handled / unknown
markFailed(db: D1Database, orderId: string, paymentId: string, now: number): Promise<void>
refund(db: D1Database, paymentId: string, now: number): Promise<void>                           // full refunds only
applyEvent(db: D1Database, evt: RazorpayEvent, now: number): Promise<Paid | null>
checkout(req, env), checkoutVerify(req, env, ctx), webhook(req, env, ctx)                       // route handlers
```

- HTTP contract:

| Request | Body | Response |
|---|---|---|
| `POST /api/checkout` | `{productId}` | `{orderId, amount, keyId, name, prefill: {email, name}}`, or 401/404/409/502 |
| `POST /api/checkout/verify` | `{razorpay_order_id, razorpay_payment_id, razorpay_signature}` | `{status}`, where `'paid'` means access is granted |
| `POST /api/razorpay/webhook` | raw Razorpay event, header `X-Razorpay-Signature` | `{ok: true}` or 400 |

- [ ] **Step 1: Write the failing tests**

Add to the top of `worker/lib.test.ts`:

```ts
import { applyEvent, fulfill, markFailed, ownsAll, refund } from './pay.ts'
```

Append:

```ts
async function seedOrder(db: D1Database, id: string, productId: string, userId = 1) {
  await db.prepare(`INSERT OR IGNORE INTO users(id, email, created_at, last_seen_at) VALUES(?, ?, 0, 0)`).bind(userId, `u${userId}@b.co`).run()
  await db
    .prepare(`INSERT INTO orders(id, user_id, product_id, amount, status, created_at) VALUES(?, ?, ?, 100, 'created', 0)`)
    .bind(id, userId, productId)
    .run()
}
const active = async (db: D1Database, userId = 1) =>
  (
    await db.prepare(`SELECT course_id FROM enrollments WHERE user_id = ? AND revoked_at IS NULL ORDER BY course_id`).bind(userId).all()
  ).results.map((r) => (r as { course_id: string }).course_id)
const paidEvent = (orderId: string, paymentId: string) => ({
  event: 'order.paid',
  payload: { order: { entity: { id: orderId } }, payment: { entity: { id: paymentId, order_id: orderId } } },
})
const refundEvent = (orderId: string, paymentId: string, refund_status: string) => ({
  event: 'refund.processed',
  payload: { refund: { entity: { payment_id: paymentId } }, payment: { entity: { id: paymentId, order_id: orderId, refund_status } } },
})

test('pay: client verify and webhook racing grant access exactly once', async () => {
  const db = testDb()
  await seedOrder(db, 'order_A', 'ai-product')
  assert.ok(await fulfill(db, 'order_A', 'pay_1', 10))
  assert.equal(await applyEvent(db, paidEvent('order_A', 'pay_1'), 11), null) // webhook arrives second
  assert.equal(await fulfill(db, 'order_A', 'pay_1', 12), null) // retried delivery
  assert.deepEqual(await active(db), ['ai-product', 'foundations'])
  const { n } = (await db.prepare(`SELECT COUNT(*) AS n FROM events WHERE type = 'order_paid'`).first()) as { n: number }
  assert.equal(n, 1)
})

test('pay: failed attempt then success on the same order; a late failure never downgrades', async () => {
  const db = testDb()
  await seedOrder(db, 'order_A', 'foundations')
  await markFailed(db, 'order_A', 'pay_1', 1)
  assert.ok(await fulfill(db, 'order_A', 'pay_2', 2))
  await markFailed(db, 'order_A', 'pay_3', 3)
  const { status } = (await db.prepare(`SELECT status FROM orders WHERE id = 'order_A'`).first()) as { status: string }
  assert.equal(status, 'paid')
  assert.deepEqual(await active(db), ['foundations'])
})

test('pay: unknown order is a no-op', async () => {
  assert.equal(await fulfill(testDb(), 'order_missing', 'pay', 1), null)
})

test('pay: ownsAll blocks paying twice but allows the AI upgrade', async () => {
  const db = testDb()
  await seedOrder(db, 'order_A', 'foundations')
  await fulfill(db, 'order_A', 'pay_1', 1)
  assert.equal(await ownsAll(db, 1, ['foundations']), true)
  assert.equal(await ownsAll(db, 1, ['ai-product', 'foundations']), false)
})

test('pay: partial refund keeps access; full refund revokes', async () => {
  const db = testDb()
  await seedOrder(db, 'order_A', 'foundations')
  await applyEvent(db, paidEvent('order_A', 'pay_A'), 1)
  await applyEvent(db, refundEvent('order_A', 'pay_A', 'partial'), 2)
  assert.deepEqual(await active(db), ['foundations'])
  await applyEvent(db, refundEvent('order_A', 'pay_A', 'full'), 3)
  assert.deepEqual(await active(db), [])
})

test('pay: full refund revokes only what that order granted', async () => {
  const db = testDb()
  await seedOrder(db, 'order_A', 'foundations')
  await fulfill(db, 'order_A', 'pay_A', 1)
  await seedOrder(db, 'order_B', 'ai-product')
  await fulfill(db, 'order_B', 'pay_B', 2)
  await refund(db, 'pay_A', 3)
  assert.deepEqual(await active(db), ['ai-product', 'foundations']) // order B still grants Foundations
  await refund(db, 'pay_B', 4)
  assert.deepEqual(await active(db), [])
})

test('pay: admin grants survive refunds; buying again after a refund restores access', async () => {
  const db = testDb()
  await seedOrder(db, 'order_A', 'ai-product')
  await fulfill(db, 'order_A', 'pay_A', 1)
  await db.prepare(`UPDATE enrollments SET source = 'admin' WHERE course_id = 'foundations'`).run()
  await refund(db, 'pay_A', 2)
  assert.deepEqual(await active(db), ['foundations'])
  await seedOrder(db, 'order_C', 'ai-product')
  await fulfill(db, 'order_C', 'pay_C', 3)
  assert.deepEqual(await active(db), ['ai-product', 'foundations'])
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test`
Expected: FAIL, `Cannot find module '.../worker/pay.ts'`

- [ ] **Step 3: Create `worker/pay.ts`**

```ts
import { formatINR, lookup, PRODUCTS } from '../src/data/catalog.ts'
import { SUPPORT_EMAIL } from '../src/lib/links.ts'
import { sendEmail } from './email.ts'
import { HttpError, json, readJson, requireSession } from './http.ts'
import { hmacVerify } from './lib.ts'

export type Paid = { userId: number; productId: string; amount: number }

export type RazorpayEvent = {
  event: string
  payload: {
    order?: { entity: { id: string } }
    payment?: { entity: { id: string; order_id: string; refund_status?: string | null } }
    refund?: { entity: { payment_id: string } }
  }
}

const grantsOf = (productId: string) => lookup(PRODUCTS, productId)?.grants ?? []

// ---- DB logic (exported for tests) ----

/** True when the user already holds every course the product grants (blocks paying twice). */
export async function ownsAll(db: D1Database, userId: number, grants: string[]): Promise<boolean> {
  const { results } = await db
    .prepare(`SELECT course_id FROM enrollments WHERE user_id = ? AND revoked_at IS NULL`)
    .bind(userId)
    .all<{ course_id: string }>()
  return grants.every((c) => results.some((r) => r.course_id === c))
}

/**
 * Marks an order paid and grants its courses. Idempotent: the client verify call and the webhook
 * both call this, in either order and possibly repeatedly; only the first call does anything.
 * An order whose earlier attempt failed can still be paid by a later attempt.
 */
export async function fulfill(db: D1Database, orderId: string, paymentId: string, now: number): Promise<Paid | null> {
  const order = await db
    .prepare(
      `UPDATE orders SET status = 'paid', payment_id = ?, paid_at = ?
       WHERE id = ? AND status IN ('created', 'failed') RETURNING user_id, product_id, amount`,
    )
    .bind(paymentId, now, orderId)
    .first<{ user_id: number; product_id: string; amount: number }>()
  if (!order) return null
  await db.batch([
    ...grantsOf(order.product_id).map((courseId) =>
      db
        .prepare(
          `INSERT INTO enrollments(user_id, course_id, source, granted_at) VALUES(?, ?, ?, ?)
           ON CONFLICT(user_id, course_id) DO UPDATE SET source = excluded.source, granted_at = excluded.granted_at, revoked_at = NULL
           WHERE enrollments.revoked_at IS NOT NULL`,
        )
        .bind(order.user_id, courseId, `order:${orderId}`, now),
    ),
    db.prepare(`INSERT INTO events(user_id, type, data, at) VALUES(?, 'order_paid', ?, ?)`).bind(order.user_id, JSON.stringify({ orderId, paymentId }), now),
  ])
  return { userId: order.user_id, productId: order.product_id, amount: order.amount }
}

/** Only a still-unpaid order can fail; a late failure event never downgrades a paid one. */
export async function markFailed(db: D1Database, orderId: string, paymentId: string, now: number): Promise<void> {
  const order = await db
    .prepare(`UPDATE orders SET status = 'failed' WHERE id = ? AND status = 'created' RETURNING user_id`)
    .bind(orderId)
    .first<{ user_id: number }>()
  if (order) {
    await db.prepare(`INSERT INTO events(user_id, type, data, at) VALUES(?, 'order_failed', ?, ?)`).bind(order.user_id, JSON.stringify({ orderId, paymentId }), now).run()
  }
}

/**
 * Full refund: revoke what this order granted, unless another paid order of the same user also
 * grants that course (then hand the enrollment over to that order). Admin grants are never touched.
 */
export async function refund(db: D1Database, paymentId: string, now: number): Promise<void> {
  const order = await db
    .prepare(`UPDATE orders SET status = 'refunded' WHERE payment_id = ? AND status = 'paid' RETURNING id, user_id, product_id`)
    .bind(paymentId)
    .first<{ id: string; user_id: number; product_id: string }>()
  if (!order) return
  const { results: others } = await db
    .prepare(`SELECT id, product_id FROM orders WHERE user_id = ? AND status = 'paid'`)
    .bind(order.user_id)
    .all<{ id: string; product_id: string }>()
  const source = `order:${order.id}`
  await db.batch([
    ...grantsOf(order.product_id).map((courseId) => {
      const keeper = others.find((o) => grantsOf(o.product_id).includes(courseId))
      return keeper
        ? db.prepare(`UPDATE enrollments SET source = ? WHERE user_id = ? AND course_id = ? AND source = ?`).bind(`order:${keeper.id}`, order.user_id, courseId, source)
        : db
            .prepare(`UPDATE enrollments SET revoked_at = ? WHERE user_id = ? AND course_id = ? AND source = ? AND revoked_at IS NULL`)
            .bind(now, order.user_id, courseId, source)
    }),
    db.prepare(`INSERT INTO events(user_id, type, data, at) VALUES(?, 'refund', ?, ?)`).bind(order.user_id, JSON.stringify({ orderId: order.id, paymentId }), now),
  ])
}

/** Applies one verified Razorpay webhook event. Returns the fulfilled order, if this event fulfilled it. */
export async function applyEvent(db: D1Database, evt: RazorpayEvent, now: number): Promise<Paid | null> {
  const { order, payment, refund: refunded } = evt.payload
  if (evt.event === 'order.paid' && order && payment) return fulfill(db, order.entity.id, payment.entity.id, now)
  if (evt.event === 'payment.failed' && payment) await markFailed(db, payment.entity.order_id, payment.entity.id, now)
  // Partial refunds (goodwill, price adjustments) keep access.
  if (evt.event === 'refund.processed' && refunded && payment?.entity.refund_status === 'full') await refund(db, refunded.entity.payment_id, now)
  return null
}

async function sendReceipt(env: Env, origin: string, paid: Paid): Promise<void> {
  const user = await env.DB.prepare(`SELECT email FROM users WHERE id = ?`).bind(paid.userId).first<{ email: string }>()
  const product = lookup(PRODUCTS, paid.productId)
  if (!user || !product) return
  await sendEmail(
    env,
    user.email,
    `You're enrolled: ${product.title}`,
    `Thank you for enrolling in ${product.title} (${formatINR(paid.amount)}, incl. GST).\n\n` +
      `Start learning: ${origin}/dashboard\nLog in with ${user.email}.\n\nQuestions? Write to ${SUPPORT_EMAIL}.`,
  ).catch((err) => console.error(JSON.stringify({ msg: 'receipt email failed', userId: paid.userId, err: String(err) })))
}

// ---- Routes ----

export async function checkout(req: Request, env: Env): Promise<Response> {
  const session = await requireSession(req, env)
  const product = lookup(PRODUCTS, (await readJson(req)).productId)
  if (!product) throw new HttpError(404, 'Unknown product')
  if (await ownsAll(env.DB, session.userId, product.grants)) throw new HttpError(409, 'You already have access to this course')

  const now = Date.now()
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      authorization: `Basic ${btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`)}`,
      'content-type': 'application/json',
    },
    // Amount always comes from the catalog, never from the request.
    body: JSON.stringify({
      amount: product.pricePaise,
      currency: 'INR',
      receipt: `u${session.userId}-${now}`,
      notes: { userId: String(session.userId), productId: product.id },
    }),
  })
  if (!res.ok) {
    console.error(JSON.stringify({ msg: 'razorpay order failed', status: res.status, body: await res.text() }))
    throw new HttpError(502, 'Could not start the payment. Please try again.')
  }
  const order = (await res.json()) as { id: string; amount: number }
  await env.DB.prepare(`INSERT INTO orders(id, user_id, product_id, amount, status, created_at) VALUES(?, ?, ?, ?, 'created', ?)`)
    .bind(order.id, session.userId, product.id, order.amount, now)
    .run()
  return json({
    orderId: order.id,
    amount: order.amount,
    keyId: env.RAZORPAY_KEY_ID,
    name: product.title,
    prefill: { email: session.email, name: session.name ?? '' },
  })
}

export async function checkoutVerify(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  await requireSession(req, env)
  const body = await readJson(req)
  const orderId = String(body.razorpay_order_id ?? '')
  const paymentId = String(body.razorpay_payment_id ?? '')
  const signature = String(body.razorpay_signature ?? '')
  if (!(await hmacVerify(env.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`, signature))) {
    throw new HttpError(400, 'Payment could not be verified')
  }
  const paid = await fulfill(env.DB, orderId, paymentId, Date.now())
  if (paid) ctx.waitUntil(sendReceipt(env, new URL(req.url).origin, paid))
  const row = await env.DB.prepare(`SELECT status FROM orders WHERE id = ?`).bind(orderId).first<{ status: string }>()
  return json({ status: row?.status ?? 'unknown' })
}

export async function webhook(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const raw = await req.text()
  if (!(await hmacVerify(env.RAZORPAY_WEBHOOK_SECRET, raw, req.headers.get('x-razorpay-signature') ?? ''))) {
    return json({ error: 'Bad signature' }, 400)
  }
  const evt = JSON.parse(raw) as RazorpayEvent
  console.log(JSON.stringify({ msg: 'razorpay webhook', id: req.headers.get('x-razorpay-event-id'), event: evt.event }))
  const paid = await applyEvent(env.DB, evt, Date.now())
  if (paid) ctx.waitUntil(sendReceipt(env, new URL(req.url).origin, paid))
  return json({ ok: true })
}
```

- [ ] **Step 4: Wire the routes**

In `worker/index.ts`:
- Add `import { checkout, checkoutVerify, webhook } from './pay.ts'`.
- Change `async fetch(req, env)` to `async fetch(req, env, ctx)`.
- Add these cases to the `switch`, before its closing brace:

```ts
        case 'POST /api/checkout':
          return await checkout(req, env)
        case 'POST /api/checkout/verify':
          return await checkoutVerify(req, env, ctx)
        case 'POST /api/razorpay/webhook':
          return await webhook(req, env, ctx)
```

- [ ] **Step 5: Run the tests and the typecheck**

Run: `npm test` → all pass. Run: `npx tsc -p tsconfig.worker.json` → no errors.

- [ ] **Step 6: Try it by hand** (Razorpay test keys in `.dev.vars`; `<TOKEN>` from Task 5 Step 8)

```bash
npm run dev
# 1. Create an order: expect {"orderId":"order_…","amount":299900,…}
curl -s -X POST localhost:5173/api/checkout -H 'content-type: application/json' -H 'cookie: ypm_s=<TOKEN>' -d '{"productId":"foundations"}'
# 2. Tampered product id: expect 404
curl -s -X POST localhost:5173/api/checkout -H 'content-type: application/json' -H 'cookie: ypm_s=<TOKEN>' -d '{"productId":"__proto__"}'
# 3. Simulate the client verify with a locally computed signature (stands in for a real checkout)
SIG=$(node -e "console.log(require('crypto').createHmac('sha256', process.argv[1]).update(process.argv[2]+'|pay_test1').digest('hex'))" "<RAZORPAY_KEY_SECRET>" "<ORDER_ID>")
curl -s -X POST localhost:5173/api/checkout/verify -H 'content-type: application/json' -H 'cookie: ypm_s=<TOKEN>' \
  -d "{\"razorpay_order_id\":\"<ORDER_ID>\",\"razorpay_payment_id\":\"pay_test1\",\"razorpay_signature\":\"$SIG\"}"
# expect {"status":"paid"}; the dev console logs the receipt email
curl -s localhost:5173/api/me -H 'cookie: ypm_s=<TOKEN>'   # enrollments: ["foundations"]
# 4. Buying again: expect 409 "You already have access to this course"
curl -s -X POST localhost:5173/api/checkout -H 'content-type: application/json' -H 'cookie: ypm_s=<TOKEN>' -d '{"productId":"foundations"}'
# 5. Webhook with a bad signature: expect 400
curl -s -X POST localhost:5173/api/razorpay/webhook -H 'x-razorpay-signature: 00' -d '{}'
```

- [ ] **Step 7: Commit**

```bash
git add worker/pay.ts worker/index.ts worker/lib.test.ts
git commit -m "feat: Razorpay checkout, signature verify, idempotent webhook fulfilment"
```

---
## Task 8: Lecture encoding pipeline (ffmpeg → HLS → R2)

**Files:**
- Create: `scripts/encode.sh`, `scripts/upload-local.sh`
- Modify: `src/data/catalog.ts` (durations for the dev lectures)

**Interfaces:**
- Produces this R2 layout per lecture, which Task 9 serves and Task 10 plays:

```
<lectureId>/master.m3u8
<lectureId>/720p/index.m3u8, <lectureId>/720p/seg_0000.ts …
<lectureId>/360p/index.m3u8, <lectureId>/360p/seg_0000.ts …
```

- `encode.sh` prints one catalog line to stdout, for example `  L("foundations-04", "User Research Fundamentals", false, 1834),`

- [ ] **Step 1: Create `scripts/encode.sh`**

```bash
#!/usr/bin/env bash
# Encode one lecture into 720p + 360p HLS (6s chunks) under media/<lecture-id>/ and print its catalog line.
# Usage: scripts/encode.sh <source-video> <lecture-id> "<title>"
#        CLIP=120 scripts/encode.sh …   # first 120s only, for local dev
set -euo pipefail
src=$1 id=$2 title=$3
[[ $id =~ ^[a-z0-9-]+$ ]] || { echo "lecture id must match [a-z0-9-]+" >&2; exit 1; }
out="media/$id"
rm -rf "$out" && mkdir -p "$out"

ffmpeg -hide_banner -loglevel error -stats -y ${CLIP:+-t "$CLIP"} -i "$src" \
  -filter_complex "[0:v]split=2[a][b];[a]scale=-2:720[v720];[b]scale=-2:360[v360]" \
  -map "[v720]" -map 0:a:0 -map "[v360]" -map 0:a:0 \
  -c:v libx264 -preset slow -profile:v main -crf 23 \
  -maxrate:v:0 1500k -bufsize:v:0 3000k -maxrate:v:1 400k -bufsize:v:1 800k \
  -force_key_frames "expr:gte(t,n_forced*6)" -sc_threshold 0 \
  -c:a aac -b:a 96k -ac 1 -ar 48000 \
  -f hls -hls_time 6 -hls_playlist_type vod -hls_flags independent_segments \
  -hls_segment_filename "$out/%v/seg_%04d.ts" \
  -master_pl_name master.m3u8 \
  -var_stream_map "v:0,a:0,name:720p v:1,a:1,name:360p" \
  "$out/%v/index.m3u8"

# Duration of what was actually encoded (so CLIP runs get the clip length).
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out/720p/index.m3u8")
node -e 'const [id, t, d] = process.argv.slice(1); console.log(`  L(${JSON.stringify(id)}, ${JSON.stringify(t)}, false, ${Math.round(+d)}),`)' "$id" "$title" "$dur"
```

- [ ] **Step 2: Create `scripts/upload-local.sh`**

```bash
#!/usr/bin/env bash
# Copy one encoded lecture (media/<lecture-id>/) into the local R2 that `npm run dev` reads.
# ponytail: one wrangler call per file (~1s each) — fine for dev clips; production uses rclone (README).
# Usage: scripts/upload-local.sh <lecture-id>
set -euo pipefail
id=$1
cd media
find "$id" -type f | while read -r f; do
  npx wrangler r2 object put "ypm-media/$f" --file "$f" --local >/dev/null
  echo "uploaded $f"
done
```

```bash
chmod +x scripts/encode.sh scripts/upload-local.sh
```

- [ ] **Step 3: Encode two dev clips, one free and one paid**

Pick any two real lecture files. Example:

```bash
CLIP=120 scripts/encode.sh ~/Downloads/lectures/foundations-01.mp4 foundations-01 "What is Product Management?"
CLIP=120 scripts/encode.sh ~/Downloads/lectures/foundations-04.mp4 foundations-04 "User Research Fundamentals"
ls media/foundations-01            # expect: 360p  720p  master.m3u8
cat media/foundations-01/master.m3u8
# expect two #EXT-X-STREAM-INF entries pointing at 720p/index.m3u8 and 360p/index.m3u8
```

If your ffmpeg build writes `master.m3u8` anywhere other than `media/<id>/`, move it there. Then confirm its variant paths are `720p/index.m3u8` and `360p/index.m3u8` (relative), and fix `encode.sh`'s `-master_pl_name` path accordingly.

- [ ] **Step 4: Put the durations in the catalog**

In `src/data/catalog.ts`, replace the `foundations-01` and `foundations-04` `L(...)` entries with the lines the script printed. Keep `true` as the third argument for `foundations-01`, since it's a free preview.

These clip durations are for dev only. Task 13 re-encodes every lecture at full length before deploy.

- [ ] **Step 5: Seed local R2 and check the files are there**

```bash
scripts/upload-local.sh foundations-01
scripts/upload-local.sh foundations-04
npx wrangler r2 object get ypm-media/foundations-01/master.m3u8 --local --pipe | head -3   # expect #EXTM3U
```

- [ ] **Step 6: Commit** (`media/` is git-ignored; videos never go in git)

```bash
git add scripts/ src/data/catalog.ts
git commit -m "feat: ffmpeg HLS encode script and local R2 seeding"
```

---

## Task 9: Gated media streaming and progress API

**Files:**
- Create: `worker/media.ts`
- Modify: `worker/index.ts`, `worker/lib.test.ts`

**Interfaces:**
- Consumes: `LECTURES`, `COURSES`, `COMPLETE_PCT`, `lookup` (Task 3); `mediaKey`, `CONTENT_TYPES`, `sha256Hex` (Task 4); bitmap functions (Task 4); `requireSession`, `getCookie`, `readJson`, `SESSION_COOKIE` (Task 5); the R2 layout (Task 8).
- Produces, from `worker/media.ts`:

```ts
hasAccess(db: D1Database, sid: string, courseId: string, now: number): Promise<boolean>
parseProgress(body: Record<string, unknown>, lectures?: Record<string, TrackedLecture>):
  { lecture: TrackedLecture; positionS: number; watched: string }   // throws HttpError 404/400
recordProgress(db: D1Database, userId: number, lecture: { id: string; durationS: number }, positionS: number, watched: string, now: number):
  Promise<{ pct: number; completed: boolean }>
media(req, env, pathname), saveProgress(req, env), getProgress(req, env, courseId)   // route handlers
```

- HTTP contract:

| Request | Body | Response |
|---|---|---|
| `GET /media/<lectureId>/<file>` | — | 200 stream; 401 (not logged in, paid lecture), 403 (no access), 404 |
| `POST /api/progress` | `{lectureId, positionS, watched}` | `{pct, completed}` |
| `GET /api/progress/:courseId` | — | `{lectures: {[lectureId]: {positionS, pct, completed, updatedAt}}}` |

- [ ] **Step 1: Write the failing tests**

Add to the top of `worker/lib.test.ts`:

```ts
import { hasAccess, parseProgress, recordProgress } from './media.ts'
```

Append:

```ts
test('media: access needs a live session and an unrevoked enrollment in that course', async () => {
  const db = testDb()
  const uid = await upsertUser(db, { email: 'a@b.co' }, 0)
  const sid = await sha256Hex(await createSession(db, uid, 0))
  assert.equal(await hasAccess(db, sid, 'foundations', 1), false) // not enrolled
  await db.prepare(`INSERT INTO enrollments(user_id, course_id, source, granted_at) VALUES(?, 'foundations', 'admin', 0)`).bind(uid).run()
  assert.equal(await hasAccess(db, sid, 'foundations', 1), true)
  assert.equal(await hasAccess(db, sid, 'ai-product', 1), false) // a different course
  assert.equal(await hasAccess(db, sid, 'foundations', SESSION_IDLE_MS + 1), false) // session expired mid-video
  await db.prepare(`UPDATE enrollments SET revoked_at = 5`).run()
  assert.equal(await hasAccess(db, sid, 'foundations', 6), false) // refunded / revoked mid-video
})

test('progress: rejects lectures without video and malformed bitmaps; clamps position', () => {
  const lectures = {
    live: { id: 'live', title: 'L', free: false, durationS: 100, courseId: 'foundations' },
    soon: { id: 'soon', title: 'S', free: false, durationS: 0, courseId: 'foundations' },
  }
  assert.throws(() => parseProgress({ lectureId: 'soon', watched: '' }, lectures), { status: 404 })
  assert.throws(() => parseProgress({ lectureId: '__proto__', watched: '' }, lectures), { status: 404 })
  assert.throws(() => parseProgress({ lectureId: 'live', watched: 'zz' }, lectures), { status: 400 })
  assert.throws(() => parseProgress({ lectureId: 'live', watched: 'ff'.repeat(50) }, lectures), { status: 400 })
  assert.equal(parseProgress({ lectureId: 'live', watched: 'ff03', positionS: 9999 }, lectures).positionS, 100)
  assert.equal(parseProgress({ lectureId: 'live', watched: 'ff03', positionS: 'x' }, lectures).positionS, 0)
})

test('progress: completes once at 85% across sessions; seeking adds nothing; resume follows the latest beat', async () => {
  const db = testDb()
  const uid = await upsertUser(db, { email: 'a@b.co' }, 0)
  const lec = { id: 'foundations-01', durationS: 100 }
  assert.deepEqual(await recordProgress(db, uid, lec, 50, fromRanges([[0, 50]], 100), 1), { pct: 50, completed: false })
  assert.deepEqual(await recordProgress(db, uid, lec, 95, fromRanges([[0, 5], [95, 100]], 100), 2), { pct: 50, completed: false })
  assert.deepEqual(await recordProgress(db, uid, lec, 90, fromRanges([[50, 90]], 100), 3), { pct: 90, completed: true })
  assert.deepEqual(await recordProgress(db, uid, lec, 10, fromRanges([[0, 10]], 100), 4), { pct: 90, completed: true })
  const { n } = (await db.prepare(`SELECT COUNT(*) AS n FROM events WHERE type = 'lecture_done'`).first()) as { n: number }
  assert.equal(n, 1)
  const { position_s } = (await db.prepare(`SELECT position_s FROM progress`).first()) as { position_s: number }
  assert.equal(position_s, 10)
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test`
Expected: FAIL, `Cannot find module '.../worker/media.ts'`

- [ ] **Step 3: Create `worker/media.ts`**

```ts
import { COMPLETE_PCT, COURSES, LECTURES, lookup } from '../src/data/catalog.ts'
import { bucketCount, countHex, isHexBitmap, orHex } from '../src/lib/bitmap.ts'
import { getCookie, HttpError, json, readJson, requireSession, SESSION_COOKIE } from './http.ts'
import { CONTENT_TYPES, mediaKey, sha256Hex } from './lib.ts'

type TrackedLecture = { id: string; courseId: string; durationS: number; free: boolean }

// ---- DB logic (exported for tests) ----

/** Live session whose user holds an unrevoked enrollment in the course. */
export async function hasAccess(db: D1Database, sid: string, courseId: string, now: number): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT 1 AS ok FROM sessions s JOIN enrollments e ON e.user_id = s.user_id
       WHERE s.id = ? AND s.expires_at > ? AND e.course_id = ? AND e.revoked_at IS NULL`,
    )
    .bind(sid, now, courseId)
    .first()
  return row !== null
}

/** Validates a heartbeat body. Lectures without a video yet (durationS 0) can't be tracked. */
export function parseProgress(
  body: Record<string, unknown>,
  lectures: Record<string, TrackedLecture> = LECTURES,
): { lecture: TrackedLecture; positionS: number; watched: string } {
  const lecture = lookup(lectures, body.lectureId)
  if (!lecture || lecture.durationS <= 0) throw new HttpError(404, 'Unknown lecture')
  if (typeof body.watched !== 'string' || !isHexBitmap(body.watched, bucketCount(lecture.durationS))) {
    throw new HttpError(400, 'Invalid progress')
  }
  const positionS = Math.min(lecture.durationS, Math.max(0, Math.floor(Number(body.positionS) || 0)))
  return { lecture, positionS, watched: body.watched }
}

/** ORs the new buckets into the stored ones; completion is set once and never undone. */
export async function recordProgress(
  db: D1Database,
  userId: number,
  lecture: { id: string; durationS: number },
  positionS: number,
  watched: string,
  now: number,
): Promise<{ pct: number; completed: boolean }> {
  const n = bucketCount(lecture.durationS)
  const prev = await db
    .prepare(`SELECT watched, completed_at FROM progress WHERE user_id = ? AND lecture_id = ?`)
    .bind(userId, lecture.id)
    .first<{ watched: string; completed_at: number | null }>()
  const merged = orHex(prev?.watched ?? '', watched, n)
  const pct = Math.floor((countHex(merged, n) * 100) / n)
  const newlyDone = !prev?.completed_at && pct >= COMPLETE_PCT
  const completedAt = prev?.completed_at ?? (newlyDone ? now : null)
  const stmts = [
    db
      .prepare(
        `INSERT INTO progress(user_id, lecture_id, position_s, watched, pct, completed_at, updated_at) VALUES(?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, lecture_id) DO UPDATE SET position_s = excluded.position_s, watched = excluded.watched,
           pct = excluded.pct, completed_at = excluded.completed_at, updated_at = excluded.updated_at`,
      )
      .bind(userId, lecture.id, positionS, merged, pct, completedAt, now),
  ]
  if (newlyDone) {
    stmts.push(db.prepare(`INSERT INTO events(user_id, type, data, at) VALUES(?, 'lecture_done', ?, ?)`).bind(userId, JSON.stringify({ lectureId: lecture.id }), now))
  }
  await db.batch(stmts)
  return { pct, completed: completedAt !== null }
}

// ---- Routes ----

export async function media(req: Request, env: Env, pathname: string): Promise<Response> {
  const parsed = mediaKey(pathname)
  const lecture = parsed ? lookup(LECTURES, parsed.lectureId) : undefined
  if (!parsed || !lecture) return json({ error: 'Not found' }, 404)
  if (!lecture.free) {
    const token = getCookie(req, SESSION_COOKIE)
    if (!token) return json({ error: 'Please log in' }, 401)
    // ponytail: one D1 read per video chunk; switch to a signed short-lived media cookie if latency or read volume ever matters.
    if (!(await hasAccess(env.DB, await sha256Hex(token), lecture.courseId, Date.now()))) {
      return json({ error: 'No access to this lecture' }, 403)
    }
  }
  const obj = await env.MEDIA.get(parsed.key)
  if (!obj) return json({ error: 'Not found' }, 404)
  return new Response(obj.body, {
    headers: {
      'content-type': CONTENT_TYPES[parsed.ext],
      etag: obj.httpEtag,
      // private: chunks must never sit in a shared cache where a non-student could fetch them.
      'cache-control': parsed.ext === 'm3u8' ? 'private, no-cache' : 'private, max-age=86400',
    },
  })
}

export async function saveProgress(req: Request, env: Env): Promise<Response> {
  const session = await requireSession(req, env)
  const { lecture, positionS, watched } = parseProgress(await readJson(req))
  const now = Date.now()
  if (!lecture.free && !(await hasAccess(env.DB, session.sid, lecture.courseId, now))) {
    throw new HttpError(403, 'No access to this lecture')
  }
  return json(await recordProgress(env.DB, session.userId, lecture, positionS, watched, now))
}

export async function getProgress(req: Request, env: Env, courseId: string): Promise<Response> {
  const session = await requireSession(req, env)
  if (!lookup(COURSES, courseId)) throw new HttpError(404, 'Unknown course')
  const { results } = await env.DB.prepare(`SELECT lecture_id, position_s, pct, completed_at, updated_at FROM progress WHERE user_id = ?`)
    .bind(session.userId)
    .all<{ lecture_id: string; position_s: number; pct: number; completed_at: number | null; updated_at: number }>()
  const lectures: Record<string, { positionS: number; pct: number; completed: boolean; updatedAt: number }> = {}
  for (const r of results) {
    if (lookup(LECTURES, r.lecture_id)?.courseId !== courseId) continue
    lectures[r.lecture_id] = { positionS: r.position_s, pct: r.pct, completed: r.completed_at !== null, updatedAt: r.updated_at }
  }
  return json({ lectures })
}
```

- [ ] **Step 4: Wire the routes**

In `worker/index.ts`:
- Add `import { getProgress, media, saveProgress } from './media.ts'`.
- Inside `try {`, before the `switch`, add:

```ts
      if (req.method === 'GET' && url.pathname.startsWith('/media/')) return await media(req, env, url.pathname)
      if (req.method === 'GET' && url.pathname.startsWith('/api/progress/')) {
        return await getProgress(req, env, url.pathname.slice('/api/progress/'.length))
      }
```

- Add this case to the `switch`:

```ts
        case 'POST /api/progress':
          return await saveProgress(req, env)
```

- [ ] **Step 5: Run the tests and the typecheck**

Run: `npm test` → all pass. Run: `npx tsc -p tsconfig.worker.json` → no errors.

- [ ] **Step 6: Try it by hand** (dev clips from Task 8; `<TOKEN>` for a user who doesn't own Foundations yet)

```bash
npm run dev
curl -si localhost:5173/media/foundations-01/master.m3u8 | head -1                           # 200 — free preview, no login
curl -si localhost:5173/media/foundations-04/master.m3u8 | head -1                           # 401 — paid, no cookie
curl -si localhost:5173/media/foundations-04/master.m3u8 -H 'cookie: ypm_s=<TOKEN>' | head -1 # 403 — not enrolled
npx wrangler d1 execute ypm --local --command "INSERT INTO enrollments(user_id, course_id, source, granted_at) SELECT id, 'foundations', 'admin', unixepoch()*1000 FROM users WHERE email = 'me@example.com' ON CONFLICT(user_id, course_id) DO UPDATE SET revoked_at = NULL"
curl -si localhost:5173/media/foundations-04/720p/seg_0000.ts -H 'cookie: ypm_s=<TOKEN>' | head -3 # 200, content-type: video/mp2t
curl -si 'localhost:5173/media/foundations-04/..%2Fx.ts' | head -1                            # 404
curl -s -X POST localhost:5173/api/progress -H 'content-type: application/json' -H 'cookie: ypm_s=<TOKEN>' \
  -d '{"lectureId":"foundations-04","positionS":30,"watched":"07"}'                          # {"pct":…,"completed":false}
curl -s localhost:5173/api/progress/foundations -H 'cookie: ypm_s=<TOKEN>'                     # {"lectures":{"foundations-04":{…}}}
```

- [ ] **Step 7: Commit**

```bash
git add worker/media.ts worker/index.ts worker/lib.test.ts
git commit -m "feat: enrollment-gated HLS streaming and anti-skip progress tracking"
```

---

## Task 10: Lecture player, course player page, student dashboard

**Files:**
- Create: `src/components/VideoPlayer.tsx`, `src/pages/Learn.tsx`, `src/pages/Dashboard.tsx`
- Modify: `src/lib/me.ts`, `src/App.tsx`, `src/pages/CourseContent.tsx` (the "Watch Free" link), `package.json` (`hls.js`)

**Interfaces:**
- Consumes: `/api/progress*` and `/media/*` (Task 9); `useMe` and `api` (Task 6); `fromRanges` (Task 4); the catalog (Task 3).
- Produces, from `src/lib/me.ts`:

```ts
type LectureProgress = { positionS: number; pct: number; completed: boolean; updatedAt: number }
type Progress = { lectures: Record<string, LectureProgress> }
useProgress(courseId: string, enabled: boolean): UseQueryResult<Progress>   // query key ['progress', courseId]
resumeLecture(courseId: string, progress: Progress | undefined): Lecture
```

- Produces routes `/dashboard`, `/learn/:courseId` (redirects to the lecture to resume) and `/learn/:courseId/:lectureId`.

- [ ] **Step 1: Install hls.js**

```bash
npm i hls.js
```

- [ ] **Step 2: Extend `src/lib/me.ts`**

Change the imports to:

```ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { courseLectures, type Lecture } from '@/data/catalog'
```

Append:

```ts
export type LectureProgress = { positionS: number; pct: number; completed: boolean; updatedAt: number }
export type Progress = { lectures: Record<string, LectureProgress> }

export const useProgress = (courseId: string, enabled: boolean) =>
  useQuery({ queryKey: ['progress', courseId], queryFn: () => api<Progress>(`/api/progress/${courseId}`), enabled })

/** The most recently watched unfinished lecture, else the first unfinished, else the first. */
export function resumeLecture(courseId: string, progress: Progress | undefined): Lecture {
  const lectures = courseLectures(courseId)
  const p = progress?.lectures ?? {}
  const unfinished = lectures.filter((l) => !p[l.id]?.completed)
  const recent = unfinished.filter((l) => p[l.id]).sort((a, b) => p[b.id].updatedAt - p[a.id].updatedAt)[0]
  return recent ?? unfinished[0] ?? lectures[0]
}
```

- [ ] **Step 3: Create `src/components/VideoPlayer.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'
import { fromRanges } from '@/lib/bitmap'

type Result = { pct: number; completed: boolean }

/** Mount with `key={lectureId}`: start position and source are read once per lecture. */
export function VideoPlayer({
  lectureId,
  durationS,
  startAt,
  track,
  watermark,
  onProgress,
}: {
  lectureId: string
  durationS: number
  startAt: number
  track: boolean
  watermark?: string
  onProgress: (r: Result) => void
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState('')
  const startAtRef = useRef(startAt)
  const onProgressRef = useRef(onProgress)
  useEffect(() => {
    onProgressRef.current = onProgress
  })

  // Declared before the source effect so that on unmount the final heartbeat is sent
  // before hls.js tears the media down.
  useEffect(() => {
    if (!track) return
    const video = ref.current!
    const send = (keepalive = false) => {
      const ranges: Array<[number, number]> = []
      for (let i = 0; i < video.played.length; i++) ranges.push([video.played.start(i), video.played.end(i)])
      if (!ranges.length) return
      fetch('/api/progress', {
        method: 'POST',
        keepalive,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lectureId, positionS: Math.floor(video.currentTime), watched: fromRanges(ranges, durationS) }),
      })
        .then((res) => (res.ok ? (res.json() as Promise<Result>) : null))
        .then((r) => {
          if (r) onProgressRef.current(r)
        })
        .catch(() => {}) // A missed beat is recovered by the next one: played ranges accumulate.
    }
    const timer = setInterval(() => {
      if (!video.paused) send()
    }, 20_000)
    const onPause = () => send()
    const onHide = () => {
      if (document.visibilityState === 'hidden') send(true)
    }
    video.addEventListener('pause', onPause)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      clearInterval(timer)
      video.removeEventListener('pause', onPause)
      document.removeEventListener('visibilitychange', onHide)
      send(true)
    }
  }, [lectureId, durationS, track])

  useEffect(() => {
    const video = ref.current!
    const src = `/media/${lectureId}/master.m3u8`
    let cancelled = false
    let destroy = () => {}
    const resume = () => {
      if (startAtRef.current > 0 && startAtRef.current < durationS - 5) video.currentTime = startAtRef.current
    }
    const fail = (status?: number) =>
      setError(
        status === 401 || status === 403
          ? 'Your session has ended or your access has changed. Log in again to keep watching.'
          : 'This video could not be loaded. Please refresh the page.',
      )
    video.addEventListener('loadedmetadata', resume, { once: true })
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari plays HLS natively (it can't tell us the HTTP status).
      video.src = src
      video.addEventListener('error', () => fail(), { once: true })
    } else {
      import('hls.js')
        .then(({ default: Hls }) => {
          if (cancelled) return
          const hls = new Hls()
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) fail(data.response?.code)
          })
          hls.loadSource(src)
          hls.attachMedia(video)
          destroy = () => hls.destroy()
        })
        .catch(() => fail())
    }
    return () => {
      cancelled = true
      destroy()
      video.removeEventListener('loadedmetadata', resume)
    }
  }, [lectureId, durationS])

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <video
        ref={ref}
        className="h-full w-full"
        controls
        playsInline
        controlsList="nodownload"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
      />
      {/* Deterrent against re-sharing screen recordings. ponytail: hidden in native fullscreen; a custom fullscreen container would keep it. */}
      {watermark ? (
        <span className="pointer-events-none absolute right-3 top-3 select-none text-xs text-white/25">{watermark}</span>
      ) : null}
      {error ? (
        <div role="alert" className="absolute inset-0 flex items-center justify-center bg-black/85 p-6 text-center text-sm text-white/80">
          {error}
        </div>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 4: Create `src/pages/Learn.tsx`**

```tsx
import type { ReactNode } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, CirclePlay, Lock } from 'lucide-react'
import { COURSES, courseLectures, lookup } from '@/data/catalog'
import { resumeLecture, useMe, useProgress, type Progress } from '@/lib/me'
import { VideoPlayer } from '@/components/VideoPlayer'
import { btnGhost, btnPrimary } from '@/components/ui'

function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-card p-6 text-center">
      {children}
    </div>
  )
}

export default function Learn() {
  const { courseId = '', lectureId } = useParams()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { data: me, isPending: mePending } = useMe()
  const enrolled = !!me?.enrollments.includes(courseId)
  const { data: progress, isPending: progressPending } = useProgress(courseId, enrolled)

  const course = lookup(COURSES, courseId)
  if (!course) return <Navigate to="/courses" replace />
  const lectures = courseLectures(courseId)
  // Wait for login state (and the saved position) before picking a lecture or a lock screen.
  const ready = !mePending && (!enrolled || !progressPending)

  if (!lectureId) {
    if (!ready) return <div className="min-h-[60vh] bg-black" />
    const target = enrolled ? resumeLecture(courseId, progress) : lectures[0]
    return <Navigate to={`/learn/${courseId}/${target.id}`} replace />
  }
  const lecture = lectures.find((l) => l.id === lectureId)
  if (!lecture) return <Navigate to={`/learn/${courseId}`} replace />

  const index = lectures.indexOf(lecture)
  const nextLecture = lectures[index + 1]
  const p = progress?.lectures
  const canWatch = lecture.free || enrolled

  function onProgress(r: { pct: number; completed: boolean }) {
    queryClient.setQueryData<Progress>(['progress', courseId], (old) => ({
      lectures: {
        ...old?.lectures,
        [lecture!.id]: { positionS: old?.lectures[lecture!.id]?.positionS ?? 0, updatedAt: Date.now(), ...r },
      },
    }))
  }

  return (
    <div className="bg-black px-4 pt-28 pb-24 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          {!ready ? (
            <div className="aspect-video w-full rounded-xl bg-white/5" />
          ) : !canWatch ? (
            <Panel>
              <Lock className="text-white/50" />
              <p className="max-w-sm text-white/70">This lecture is part of the full course.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link to={`/courses/${courseId}`} className={btnPrimary}>
                  Enroll to unlock
                </Link>
                {!me?.user ? (
                  <Link to={`/login?next=${encodeURIComponent(location.pathname)}`} className={btnGhost}>
                    Already enrolled? Log in
                  </Link>
                ) : null}
              </div>
            </Panel>
          ) : lecture.durationS === 0 ? (
            <Panel>
              <p className="text-white/70">Video coming soon.</p>
            </Panel>
          ) : (
            <VideoPlayer
              key={lecture.id}
              lectureId={lecture.id}
              durationS={lecture.durationS}
              startAt={p?.[lecture.id]?.positionS ?? 0}
              track={!!me?.user}
              watermark={me?.user?.email}
              onProgress={onProgress}
            />
          )}

          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-white/50">
                {course.title} · Lecture {index + 1} of {lectures.length}
              </p>
              <h1 className="mt-1 text-2xl font-bold">{lecture.title}</h1>
              {p?.[lecture.id]?.completed ? (
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                  <CheckCircle2 size={16} /> Completed
                </p>
              ) : null}
            </div>
            {nextLecture ? (
              <Link to={`/learn/${courseId}/${nextLecture.id}`} className={btnPrimary}>
                Next lecture
              </Link>
            ) : null}
          </div>
        </section>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">Course content</h2>
          <div className="mt-4 max-h-[70vh] space-y-6 overflow-y-auto pr-1">
            {course.modules.map((m) => (
              <div key={m.title}>
                <h3 className="text-sm font-semibold text-white/80">{m.title}</h3>
                <ol className="mt-2 space-y-1">
                  {m.lectures.map((l) => {
                    const lp = p?.[l.id]
                    const current = l.id === lecture.id
                    return (
                      <li key={l.id}>
                        <Link
                          to={`/learn/${courseId}/${l.id}`}
                          aria-current={current ? 'page' : undefined}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                            current ? 'bg-primary/15 text-white' : 'text-white/70 hover:bg-white/5'
                          }`}
                        >
                          {lp?.completed ? (
                            <CheckCircle2 size={16} className="shrink-0 text-accent" aria-label="Completed" />
                          ) : l.free || enrolled ? (
                            <CirclePlay size={16} className="shrink-0 text-white/50" />
                          ) : (
                            <Lock size={16} className="shrink-0 text-white/30" aria-label="Locked" />
                          )}
                          <span className="min-w-0 flex-1 truncate">{l.title}</span>
                          {!lp?.completed && lp?.pct ? <span className="text-xs text-white/40">{lp.pct}%</span> : null}
                          {l.free && !enrolled ? <span className="text-xs text-green-400">Free</span> : null}
                        </Link>
                      </li>
                    )
                  })}
                </ol>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create `src/pages/Dashboard.tsx`**

```tsx
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { COURSES, courseLectures, lookup } from '@/data/catalog'
import { api } from '@/lib/api'
import { resumeLecture, useMe, useProgress, type Me } from '@/lib/me'
import { btnGhost, btnPrimary } from '@/components/ui'

function CourseCard({ courseId }: { courseId: string }) {
  const { data: progress } = useProgress(courseId, true)
  const course = lookup(COURSES, courseId)
  if (!course) return null
  const lectures = courseLectures(courseId)
  const done = lectures.filter((l) => progress?.lectures[l.id]?.completed).length
  const pct = lectures.length ? Math.round((done * 100) / lectures.length) : 0
  const next = resumeLecture(courseId, progress)

  return (
    <div className="rounded-2xl border border-white/10 bg-card p-6">
      <h2 className="text-xl font-semibold">{course.title}</h2>
      <p className="mt-1 text-sm text-white/60">
        {done} of {lectures.length} lectures completed
      </p>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-label={`${course.title} progress`}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      {pct === 100 ? <p className="mt-4 text-sm font-semibold text-accent">Course completed</p> : null}
      <Link to={`/learn/${courseId}/${next.id}`} className={`${btnPrimary} mt-6 w-full`}>
        <span className="truncate">
          {done ? 'Continue' : 'Start'}: {next.title}
        </span>
      </Link>
    </div>
  )
}

export default function Dashboard() {
  const { data: me, isPending } = useMe()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  if (isPending) return <div className="min-h-[60vh] bg-black" />
  if (!me?.user) return <Navigate to="/login?next=/dashboard" replace />

  async function logout() {
    await api('/api/auth/logout', {})
    queryClient.setQueryData<Me>(['me'], { user: null, enrollments: [] })
    queryClient.removeQueries({ queryKey: ['progress'] })
    navigate('/')
  }

  return (
    <div className="bg-black px-4 pt-32 pb-24 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-white/60">Welcome back</p>
            <h1 className="text-3xl font-bold">{me.user.name ?? me.user.email}</h1>
          </div>
          <button type="button" onClick={logout} className={btnGhost}>
            Log out
          </button>
        </div>

        {me.enrollments.length ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {me.enrollments.map((id) => (
              <CourseCard key={id} courseId={id} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-white/10 bg-card p-8 text-center">
            <p className="text-white/70">You haven't enrolled in a course yet.</p>
            <Link to="/courses" className={`${btnPrimary} mt-6`}>
              Browse courses
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Routes and the "Watch Free" link**

In `src/App.tsx`, add the lazy imports:

```ts
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Learn = lazy(() => import('@/pages/Learn'))
```

and the routes, after `/login`:

```tsx
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/learn/:courseId" element={<Learn />} />
              <Route path="/learn/:courseId/:lectureId" element={<Learn />} />
```

In `src/pages/CourseContent.tsx`, change `LectureRow` to take the course id and link the free button to the player:
- Change its signature to `function LectureRow({ courseId, lecture }: { courseId: string; lecture: Lecture })`.
- Replace the free `<button …>Watch Free</button>` with:

```tsx
        <Link
          to={`/learn/${courseId}/${lecture.id}`}
          className="btn-purple-animated shrink-0 inline-flex items-center justify-center px-5 h-10 rounded-full text-primary-foreground font-bold"
        >
          Watch Free
        </Link>
```

- Update the call site to `<LectureRow key={lecture.id} courseId={course.id} lecture={lecture} />`.

- [ ] **Step 7: Verify in Chrome** (dev clips from Task 8; the user enrolled in Foundations in Task 9)

1. `npm run build` passes. Then run `npm run dev`.
2. **Logged out:**
   - `/courses/foundations` → "Watch Free" on lecture 1 opens `/learn/foundations/foundations-01` and the clip plays. In the Network tab, `seg_*.ts` requests return 200.
   - `/learn/foundations/foundations-04` shows the lock panel with "Enroll to unlock" and "Already enrolled? Log in".
   - `/learn/foundations/foundations-02` (a free preview with no video yet, durationS 0) shows "Video coming soon".
3. **Logged in and enrolled:**
   - `/dashboard` lists Foundations with "Start: …" and logout works.
   - On lecture 4, play ~30s, pause, and reload. It resumes near where you paused.
   - Drag the scrubber to the end and let it finish. The sidebar does **not** tick it complete.
   - Play the clip through (or most of it). It ticks Completed and the dashboard count goes up.
   - The email watermark shows in the top-right corner.
4. **Paid lecture with no video:** logged in and enrolled, `/learn/foundations/foundations-05` shows "Video coming soon" (not the lock panel).
5. **Revoked mid-video:** while lecture 4 plays, run `npx wrangler d1 execute ypm --local --command "UPDATE enrollments SET revoked_at = 1"`, then seek to an unbuffered spot. The overlay says the session/access changed. Restore access with `UPDATE enrollments SET revoked_at = NULL`.
6. `/learn/foundations` (no lecture id) redirects to the lecture to resume.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/components/VideoPlayer.tsx src/pages/Learn.tsx src/pages/Dashboard.tsx src/lib/me.ts src/App.tsx src/pages/CourseContent.tsx
git commit -m "feat: course player with resume and progress, and student dashboard"
```

---

## Task 11: Enroll and pay on the course page

**Files:**
- Modify: `src/pages/CourseContent.tsx`

**Interfaces:**
- Consumes: `POST /api/checkout` and `POST /api/checkout/verify` (Task 7); `api`, `ApiError`, `loadScript` and `useMe` (Task 6); the `/learn/:courseId` route (Task 10).

- [ ] **Step 1: Add the `EnrollButton` component**

In `src/pages/CourseContent.tsx`, change the imports at the top to:

```tsx
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CheckCircle2, CirclePlay, Lock, Star } from 'lucide-react'
import { COURSES, PRODUCTS, courseLectures, formatINR, lookup, type Lecture } from '@/data/catalog'
import { api, ApiError, loadScript } from '@/lib/api'
import { useMe } from '@/lib/me'
```

Add above `export default function CourseContent()`:

```tsx
type CheckoutOrder = { orderId: string; amount: number; keyId: string; name: string; prefill: { email: string; name: string } }
type RazorpayResult = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
type RazorpayCheckout = { open: () => void; on: (event: 'payment.failed', cb: () => void) => void }
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout
  }
}

const ENROLL_CLASS =
  'btn-purple-animated mt-6 inline-flex w-full h-12 items-center justify-center rounded-xl text-primary-foreground font-bold hover:opacity-90 transition-opacity disabled:opacity-60'

function EnrollButton({ courseId }: { courseId: string }) {
  const { data: me, isPending } = useMe()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (me?.enrollments.includes(courseId)) {
    return (
      <Link to={`/learn/${courseId}`} className={ENROLL_CLASS}>
        Go to course
      </Link>
    )
  }

  async function enroll() {
    if (!me?.user) {
      navigate(`/login?next=${encodeURIComponent(`/courses/${courseId}`)}`)
      return
    }
    setBusy(true)
    setError('')
    try {
      const [order] = await Promise.all([
        api<CheckoutOrder>('/api/checkout', { productId: courseId }),
        loadScript('https://checkout.razorpay.com/v1/checkout.js'),
      ])
      if (!window.Razorpay) throw new Error('Checkout unavailable')
      const checkout = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: 'INR',
        name: 'Your Product Manager',
        description: order.name,
        prefill: order.prefill,
        theme: { color: '#8b5cf6' },
        handler: async (result: RazorpayResult) => {
          try {
            const { status } = await api<{ status: string }>('/api/checkout/verify', result)
            if (status !== 'paid') throw new Error(status)
            await queryClient.invalidateQueries({ queryKey: ['me'] })
            navigate(`/learn/${courseId}`)
          } catch {
            setError('Payment received, but access is still being set up. Refresh in a minute; if it persists, contact support with your payment ID.')
            setBusy(false)
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      })
      checkout.on('payment.failed', () => setError('The payment did not go through. Please try again or use another method.'))
      checkout.open()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start checkout. Please try again.')
      setBusy(false)
    }
  }

  return (
    <>
      <button type="button" onClick={enroll} disabled={busy || isPending} className={ENROLL_CLASS}>
        {busy ? 'Opening checkout…' : 'Enroll in Course'}
      </button>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </>
  )
}
```

- [ ] **Step 2: Use it in the enroll card**

In `CourseContent()`, replace:

```tsx
                <button className="btn-purple-animated mt-6 w-full h-12 rounded-xl text-primary-foreground font-bold hover:opacity-90 transition-opacity">
                  Enroll in Course
                </button>
```

with:

```tsx
                <EnrollButton courseId={course.id} />
```

- [ ] **Step 3: Verify the whole purchase in Chrome** (Razorpay **test** keys in `.dev.vars`)

1. `npm run build` passes. Then run `npm run dev`.
2. **Logged out:** "Enroll in Course" on `/courses/foundations` sends you to `/login?next=/courses/foundations`, and you come back there after logging in.
3. **New user:** "Enroll in Course" opens Razorpay Checkout showing ₹2,999 and your email prefilled. Pay with UPI `success@razorpay`, or a test card from Razorpay's "Test Card Details" docs page. Expect:
   - You land on `/learn/foundations/…`.
   - The dev console logs the receipt email.
   - `/dashboard` lists Foundations.
   - The button now reads "Go to course".
4. On `/courses/ai-product` (same user), the button still offers to enroll, since this is the upgrade path.
5. In a new checkout, pay with UPI `failure@razorpay`. Expect the error message, and that you can retry in the same modal.
6. Close the modal without paying. The button resets.
7. `npx wrangler d1 execute ypm --local --command "SELECT id, product_id, amount, status FROM orders"` → the paid order is `paid` with amount `299900`, and the abandoned one is `created`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/CourseContent.tsx
git commit -m "feat: enroll with Razorpay checkout from the course page"
```

---

## Task 12: Policy pages Razorpay requires, 404, dead links

**Files:**
- Create: `src/pages/RefundPolicy.tsx`, `src/pages/DeliveryPolicy.tsx`, `src/pages/NotFound.tsx`
- Modify: `src/App.tsx`, `src/components/layout/Footer.tsx`

**Interfaces:**
- Consumes: `LegalPage` / `LegalSection` from `src/components/LegalPage.tsx` (existing).

- [ ] **Step 1: Create `src/pages/RefundPolicy.tsx`**

The wording follows the existing Terms (courses are non-refundable). The owner must confirm it before the Razorpay submission (spec §10, question 8).

```tsx
import { LegalPage, type LegalSection } from '@/components/LegalPage'

const SECTIONS: LegalSection[] = [
  {
    heading: 'Course Enrollments',
    body: [
      'Course content is digital and becomes available immediately after payment. Course enrollments are therefore non-refundable once access has been granted, unless stated otherwise on the specific course page.',
      'Please watch the free preview lectures before enrolling to make sure the course is right for you.',
    ],
  },
  {
    heading: 'Duplicate or Unfulfilled Payments',
    body: [
      'If you were charged more than once for the same course, or your payment succeeded but you did not receive access, write to us with your registered email address and payment reference. Verified duplicate or unfulfilled payments are refunded in full.',
    ],
  },
  {
    heading: 'Coaching and Mock Interview Sessions',
    body: [
      'Sessions can be rescheduled with at least 24 hours’ notice. Fees for sessions that have taken place, or that are missed without notice, are non-refundable.',
    ],
  },
  {
    heading: 'Cancellations',
    body: [
      'A course purchase cannot be cancelled once access has been granted. If you cancel a payment before it completes, no amount is charged and no access is granted.',
    ],
  },
  {
    heading: 'Refund Processing',
    body: [
      'Approved refunds are issued to the original payment method within 5–7 working days. The time taken for the amount to reflect in your account depends on your bank or card issuer.',
    ],
  },
]

export default function RefundPolicy() {
  return (
    <LegalPage
      title="Refund & Cancellation Policy"
      updated="3 October 2026"
      intro="This policy explains when payments made to YPM (Your Product Manager) can be refunded or cancelled. Please read it together with our Terms & Conditions."
      sections={SECTIONS}
    />
  )
}
```

- [ ] **Step 2: Create `src/pages/DeliveryPolicy.tsx`**

```tsx
import { LegalPage, type LegalSection } from '@/components/LegalPage'

const SECTIONS: LegalSection[] = [
  {
    heading: 'Digital Delivery',
    body: [
      'YPM provides digital services only: recorded online courses and live one-to-one online sessions. Nothing is shipped physically.',
      'Course access is delivered online, immediately after successful payment, to the account of the email address you purchased with. A confirmation email is sent to the same address.',
    ],
  },
  {
    heading: 'Accessing Your Course',
    body: [
      'Log in at any time with your registered email address to open your dashboard and watch your lectures. Access is personal to you and may not be shared.',
    ],
  },
  {
    heading: 'Delays',
    body: [
      'If your payment succeeded but the course does not appear in your dashboard within 24 hours, write to us with your registered email address and payment reference and we will resolve it.',
    ],
  },
  {
    heading: 'Coaching Sessions',
    body: ['One-to-one sessions take place online at the booked time. The meeting link is shared by email after booking.'],
  },
]

export default function DeliveryPolicy() {
  return (
    <LegalPage
      title="Shipping & Delivery Policy"
      updated="3 October 2026"
      intro="How YPM (Your Product Manager) delivers the courses and sessions you purchase."
      sections={SECTIONS}
    />
  )
}
```

- [ ] **Step 3: Create `src/pages/NotFound.tsx`**

```tsx
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
```

- [ ] **Step 4: Routes**

In `src/App.tsx`:
- Change the router import to `import { Routes, Route, Navigate, useLocation } from 'react-router-dom'`.
- Add the lazy imports:

```ts
const RefundPolicy = lazy(() => import('@/pages/RefundPolicy'))
const DeliveryPolicy = lazy(() => import('@/pages/DeliveryPolicy'))
const NotFound = lazy(() => import('@/pages/NotFound'))
```

- Add these routes as the **last** children of `<Routes>`:

```tsx
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/delivery-policy" element={<DeliveryPolicy />} />
              {/* Home links to these; real pages arrive in Phase 2 / the UI overhaul. */}
              <Route path="/coaching" element={<Navigate to="/contact" replace />} />
              <Route path="/apply" element={<Navigate to="/courses" replace />} />
              <Route path="*" element={<NotFound />} />
```

- [ ] **Step 5: Footer links**

In `src/components/layout/Footer.tsx`, in the `Legal` column's `links`, add after the Terms entry:

```ts
      { href: '/refund-policy', label: 'Refund & Cancellation' },
      { href: '/delivery-policy', label: 'Shipping & Delivery' },
```

- [ ] **Step 6: Verify**

Run `npm run build`, which should pass. Then run `npm run dev` and check:
- `/refund-policy` and `/delivery-policy` render with a table of contents on desktop.
- The footer shows both links.
- `/does-not-exist` shows the 404 page.
- Home's "Schedule 1:1 Call" goes to `/contact`, and "Apply Now" goes to `/courses`.

- [ ] **Step 7: Commit**

```bash
git add src/pages/RefundPolicy.tsx src/pages/DeliveryPolicy.tsx src/pages/NotFound.tsx src/App.tsx src/components/layout/Footer.tsx
git commit -m "feat: refund and delivery policies, 404 page, fix dead CTA routes"
```

---

## Task 13: Deploy to production, README, go-live gates

**Files:**
- Create: `README.md`, `.env.production`
- Modify: `src/data/catalog.ts` (full-length durations), `worker/lib.test.ts` (remove the `todo`)

- [ ] **Step 1: Content gates (all must hold before deploying)**

1. **Lecture lists complete.**
   - Both full lecture lists are in the catalog (Task 3 Step 5).
   - The `{ todo: … }` option is removed from the 50-lecture test.
   - `npm test` passes with **0 todo**.
2. **Every lecture encoded at full length.** Run `scripts/encode.sh` with no `CLIP` for each recording, and paste every printed `L(...)` line into the catalog, keeping the `free` flags. A lecture still at `durationS: 0` shows "Video coming soon"; allowed, but only on purpose.
3. **Owner sign-off** on the Refund and Delivery policy wording, and on `SUPPORT_EMAIL` in `src/lib/links.ts`.
4. **Build:** `npm run build` passes.

- [ ] **Step 2: Create `README.md`**

````markdown
# Your Product Manager (YPM)

React SPA + one Cloudflare Worker (API and gated video) + D1 + R2.
Design: `docs/superpowers/specs/2026-10-03-ypm-platform-design.md`.

## Develop

```bash
cp .dev.vars.example .dev.vars   # fill in Razorpay test keys etc.
npm install
npm run db:migrate:local
npm run dev                      # http://localhost:5173 — use Chrome (Safari drops Secure cookies on http)
npm test
```

With `RESEND_API_KEY` empty, emails (login codes, receipts) print to the dev-server console.

## Lectures

```bash
scripts/encode.sh <source.mp4> <lecture-id> "<title>"    # → media/<id>/, prints the catalog line
CLIP=120 scripts/encode.sh …                             # 2-minute clip for local dev
scripts/upload-local.sh <lecture-id>                     # seed local R2
rclone copy media r2:ypm-media --transfers 32 --progress # upload to production R2
```

Lecture ids are permanent (R2 keys and progress rows use them). Never renumber after upload.

## Deploy

```bash
npm run db:migrate:remote
npm run deploy
```

## Manual admin (until the admin panel exists)

```bash
q() { npx wrangler d1 execute ypm --remote --command "$1"; }
# Grant a course
q "INSERT INTO enrollments(user_id, course_id, source, granted_at) SELECT id, 'foundations', 'admin', unixepoch()*1000 FROM users WHERE email = 'student@example.com' ON CONFLICT(user_id, course_id) DO UPDATE SET revoked_at = NULL, source = 'admin'"
# Revoke a course
q "UPDATE enrollments SET revoked_at = unixepoch()*1000 WHERE course_id = 'foundations' AND user_id = (SELECT id FROM users WHERE email = 'student@example.com')"
# Recent payments
q "SELECT o.id, u.email, o.product_id, o.amount / 100.0 AS inr, o.status, datetime(o.created_at / 1000, 'unixepoch') AS at FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC LIMIT 20"
# A student's progress
q "SELECT lecture_id, pct, completed_at IS NOT NULL AS done FROM progress WHERE user_id = (SELECT id FROM users WHERE email = 'student@example.com') ORDER BY lecture_id"
```
````

- [ ] **Step 3: Production config and secrets**

Create `.env.production` with the real Turnstile **site** key (it's public):

```bash
VITE_TURNSTILE_SITE_KEY=<production site key>
```

```bash
npm run db:migrate:remote
for k in RAZORPAY_KEY_ID RAZORPAY_KEY_SECRET RAZORPAY_WEBHOOK_SECRET RESEND_API_KEY TURNSTILE_SECRET GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET; do
  npx wrangler secret put "$k"
done
npx wrangler secret list   # all 7 present; RESEND_API_KEY must be set or login codes end up in logs
```

Start with the Razorpay **test** keys. Live keys come in Step 7.

- [ ] **Step 4: Upload the lectures and deploy to workers.dev**

```bash
rclone copy media r2:ypm-media --transfers 32 --checkers 32 --progress
rclone size r2:ypm-media          # expect roughly 20–25 GB for ~25 h of lectures
npm run deploy                    # prints https://ypm.<account-subdomain>.workers.dev
```

- [ ] **Step 5: Wire the external services to the workers.dev URL**

1. **Razorpay** (Test mode) → Webhooks → Add:
   - URL `https://ypm.<sub>.workers.dev/api/razorpay/webhook`
   - The secret is the value of `RAZORPAY_WEBHOOK_SECRET`.
   - Events: `order.paid`, `payment.failed`, `refund.processed`.
2. **Google OAuth client** → add the redirect URI `https://ypm.<sub>.workers.dev/api/auth/google/callback`.
3. **Turnstile widget** → add the workers.dev hostname.

- [ ] **Step 6: Run the full verification on workers.dev**

1. Log in with a real email OTP (it arrives through Resend) and with Google.
2. Buy Foundations in test mode.
   - Razorpay Dashboard → Webhooks shows `order.paid` delivered with 200.
   - The receipt email arrives.
3. The video plays with resume, and the completion rules hold (Task 10 Step 7).
4. Redeliver the same `order.paid` from the Razorpay dashboard. `q "SELECT COUNT(*) FROM events WHERE type='order_paid'"` is unchanged.
5. Refund the test payment **fully** from the Razorpay dashboard. Within a minute the course disappears from `/dashboard`, and its chunks return 403.
6. Open `npx wrangler tail`, or the Workers Logs tab, during the run. There should be no `unhandled` errors.

- [ ] **Step 7: Domain cut-over and going live**

1. Cloudflare dashboard → the old **Pages** project → Custom domains → remove the domain.
2. **Workers** → `ypm` → Settings → Domains & Routes → Add custom domain (the same domain).
3. Repeat Step 5 for the real domain. Remove the workers.dev entries if you like.
4. CI: **Workers** → `ypm` → Settings → Builds → connect the GitHub repo, build command `npm run build`, deploy command `npx wrangler deploy`. Disconnect Git from the old Pages project, and delete that project once the domain has served from the Worker for a few days.
5. Razorpay → submit the website for activation. The required pages now exist: About, Contact, Terms, Privacy, Refund & Cancellation, Shipping & Delivery, and the course pages with prices.
6. After approval:
   - `npx wrangler secret put RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` with the **live** keys.
   - Create a **live-mode** webhook (same URL and events) with a new secret, and run `npx wrangler secret put RAZORPAY_WEBHOOK_SECRET`.
   - Make one real ₹2,999 purchase with your own card, then refund it.

- [ ] **Step 8: Commit**

```bash
git add README.md .env.production src/data/catalog.ts worker/lib.test.ts
git commit -m "docs: README with dev, deploy and admin runbook; production config"
```
