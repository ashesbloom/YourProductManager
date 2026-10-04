# YPM (Your Product Manager): Site Audit + Backend / Hosting Plan

## Context

YPM is Khushbu Sharma's founder-led Product Management education brand. The site sells:
- recorded, self-paced courses: AI PM at ₹11,999 launch price (50 lectures), Foundations at ₹2,999 (15–16 lectures), with a third course later;
- paid 1:1 coaching and mock interviews;
- completion certificates with public verification.

Today the site is a static React SPA on Cloudflare Pages with **no backend**. There is no login, no payments, no video player, and no lead capture. Certificate verification is faked: one hardcoded ID that reports "authentic". The UI reads as gimmicky, not as a premium academy.

Source of truth for intent: `~/Downloads/YPM Final Content.md`. It holds the copy edits, the prices, the LMS requirements, the admin dashboard spec, coupons, Meta-ads lead tracking, the book section and tawk.to support.

Goal of this plan:
1. Audit the site.
2. Design the backend: storage, video, logging and analytics, Razorpay.
3. Keep hosting cost near zero.
4. Phase the work so we can start the backend now.

---

## 1. Audit: what's broken today

### Functional
- No backend, no `fetch`, no env vars. Every "conversion" path is fake:
  - `/coaching`, `/apply`, `/login` have no routes, so those links show a blank page. There is no catch-all route and no 404 page.
  - `src/lib/links.ts` still has the `REPLACE_ME` Calendly link and a `91XXXXXXXXXX` WhatsApp number.
  - The home lead form (`Home.tsx:646-681`) has no submit handler, so the page just reloads.
  - "Enroll" and "Watch Free" on `CourseContent.tsx` have no click handlers.
- `Verify.tsx:10-12` has a hardcoded `YPM0000000` entry that shows "Verified — authentic". Home links real visitors to it. This is a credibility risk.
- The numbers contradict each other across pages:
  - Foundations has 16, 19 or 20 lectures; 1 or 3 free lectures; and is called both "PM BASICS" and "FOUNDATIONS".
  - Students are counted as 500+, 300+, 200+, 120+ and "thousands" on different pages.
  - The AI course says "no 1:1 support" in one place and "3 free mock interviews" in another.
  - Three wrong currency symbols (`Home.tsx:226-234`).
- Razorpay won't activate live payments without **Refund/Cancellation** and **Shipping/Delivery** policy pages. Neither exists.

### Styling (root causes, not taste)
- `styles.css` holds about 250 lines of hand-copied Tailwind classes, many with `!important`. They sit outside Tailwind's layers, so they **override every responsive variant**: desktop grids collapse, headings never scale, `rounded-3xl` becomes 0.
- A leftover shadcn `.dark` block turns `--primary` grey, so `*-primary/xx` utilities render grey instead of purple.
- `tailwind.config.js` is never loaded (Tailwind v4 needs `@config`). About 900 of the 1,571 CSS lines are dead.
- Two animation libraries, GSAP and framer-motion, overlap. CurvedLoop re-renders 60×/s. The home page ships ~180 KB of gzipped JS.
- An 8.3 MB mp4 downloads on every home visit, and a duplicate copy is committed in `src/assets`.
- Unused dependencies: `@tanstack/react-query`, `cva`, `clsx`, `tailwind-merge`, `tailwindcss-animate`, plus `components.json` with no `ui/` folder.
- "AI slop" signals: rotating headline (it reads "Think Like a Manager"), orbs and glows, spinning flag orbit, ✦ marquee, emoji badges, pink accents, CourseContent's white theme, ~30 inline hex colors.

### Positioning and copy (from the research)
- Credible PM educators (SVPG, Product Talk, Shreyas on Maven, Reforge) earn trust with: the founder's photo and specific credentials, named testimonials linked to LinkedIn, the full curriculum with durations, a free sample lecture, a certificate preview, an explicit "who this is not for", and a plain refund policy.
- **Risk:** the doc asks for "LIMITED SLOTS" urgency and salary-figure hero cards. India's CCPA Dark Patterns Guidelines (2023) prohibit false urgency, and edtechs have been penalised. Recommend: keep urgency only if slots are genuinely limited, and replace salary cards with neutral copy.

### SEO and accessibility
- One title and description for every route. No OG tags, robots.txt or sitemap. The favicon is the Vite logo. A JS-only SPA with soft 404s.
- Placeholder-only inputs. FAQ items are `div`s with no keyboard support. `<Link>` wraps `<button>`. Small 35–45% white text likely fails contrast.

---

## 2. Does the doc fit the site? Conflicts to resolve

The doc mostly fits: prices, the two courses, the LMS requirements, and the admin first-version priorities. Where it conflicts or needs a decision:

| Doc says | Problem | Resolution |
|---|---|---|
| "Book Mock Interview → Calendly, pay via Razorpay" | Calendly and Cal.com only take Stripe/PayPal | Pay on site with Razorpay, **then** show the private booking link (chosen) |
| "LIMITED SLOTS" badge; salary cards (₹25L+, $120K+) | Counts as a dark pattern under the CCPA rules; reads like a coaching institute | Keep only if slots are really capped; soften salary copy in the UI phase |
| Admin can "upload videos" | Videos are on R2 + HLS, encoded locally (chosen) | Mayank uploads by script; admin upload comes later or not at all |
| "Prevent video download" | Only DRM truly prevents it | Basic protection: login-gated video chunks, HLS (no single file), no-download controls, faint email watermark, max 3 sessions per account |
| AI PM includes "2 h free mock interview" | Courses page says "No 1:1 support" | Khushbu confirms; fix copy (`Courses.tsx:49`) |
| Meta ads: cost per lead, ROAS | Needs ad spend from Meta | Capture UTM/fbclid from day 1; enter spend manually later |
| LMS UI: "clean white background" | Rest of site is dark; CourseContent is already white | Decide in the UI phase; the backend doesn't depend on it |
| Terms: no refunds; payments may go to Khushbu's personal account | Razorpay needs dedicated Refund/Cancellation and Delivery pages; payout account must match KYC | Add 2 policy pages (Phase 1); align the Terms wording |
| Privacy/Terms "Email id:" blank; code uses `support@yourpm.in` | Domain mismatch | Khushbu provides the official email |

## 3. Decisions (made by you)

| Area | Choice |
|---|---|
| Video | Cloudflare R2 + HLS encoded with ffmpeg, gated by the Worker |
| Login | Email OTP (Resend) + Google sign-in |
| 1:1 calls | Razorpay checkout on site → private Calendly/Cal.com link |
| First slice | **Sell + watch**: login → buy → access → gated player with resume and progress |

## 4. Architecture

```
Browser (React SPA)
   │  same origin, HttpOnly session cookie
   ▼
Cloudflare Worker "ypm"  (Workers + static assets, replaces the Pages project)
   ├─ static SPA (dist/)           free; not_found_handling = single-page-application
   ├─ /api/*   router (plain switch, no framework)
   │     auth · checkout · webhook · progress · me
   ├─ /media/* gated HLS streaming
   ├─ D1  "ypm"  (SQLite, location apac)  users, sessions, orders, enrollments, progress, events
   ├─ R2  "ypm-media" (apac)               <lectureId>/master.m3u8, 720p/, 360p/ segments
   └─ outbound: Razorpay API · Resend · Google OAuth · Turnstile
```

**Why Workers + static assets, not Pages Functions.** It's still one deploy. The `@cloudflare/vite-plugin` runs the SPA, the Worker and a local D1 under a single `npm run dev`. `run_worker_first: ["/api/*", "/media/*"]` keeps every page load free. Cloudflare ships new platform features to Workers first.

**No router, ORM or validation library.** There are about 11 endpoints, written as plain `switch` statements, raw D1 SQL and hand-written input checks. Add Hono if it grows past ~20 routes.

### Course catalog = one shared file
`src/data/catalog.ts` is imported by both the SPA and the Worker. It holds:
- **Products:** `ai-pm` (₹11,999, grants `ai-pm` + `foundations`), `foundations` (₹2,999), `coaching-60`, `mock-interview`. Prices are in paise, final and GST-inclusive.
- **Courses → modules → lectures:** `{ id, title, durationS, free }`.

This file replaces the conflicting duplicates in `Home.tsx`, `Courses.tsx` and `CourseContent.tsx`. The server **always** takes the price from this file, never from the client. It moves into D1 only when the admin course editor is built.

### D1 schema (`migrations/0001_init.sql`)
```sql
users(id INTEGER PK, email TEXT UNIQUE NOT NULL, name, phone, google_sub TEXT UNIQUE,
      is_admin INTEGER DEFAULT 0, utm TEXT /*first-touch JSON*/, created_at, last_seen_at)
sessions(id TEXT PK /*sha256(token)*/, user_id, created_at, expires_at)
otps(email TEXT PK, code_hash, expires_at, attempts, sent_at)
orders(id TEXT PK /*razorpay order_id*/, user_id, product_id, amount INTEGER /*paise*/,
       status TEXT /*created|paid|failed|refunded*/, payment_id, created_at, paid_at)
enrollments(user_id, course_id, source TEXT /*order:<id>|admin*/, granted_at, revoked_at,
            PRIMARY KEY(user_id, course_id))
progress(user_id, lecture_id, position_s, watched TEXT /*hex bitmap of 10s buckets*/,
         pct INTEGER, completed_at, updated_at, PRIMARY KEY(user_id, lecture_id))
events(id INTEGER PK, user_id, type /*login|order_paid|order_failed|refund|lecture_done*/,
       data TEXT, at)
```
Tables are added in later phases as needed: `certificates`, `coupons`, `leads`, and an `enrollments.expires_at` column for limited-time access.

## 5. Key flows

### Auth
- **Email OTP:**
  1. `POST /api/auth/otp` takes `{email, turnstileToken}`. Checks: Turnstile token is valid, and no OTP was sent to that email in the last 60 s.
  2. Store `sha256(code+email)` with a 10-minute expiry, then send via Resend.
  3. `POST /api/auth/verify` checks the code (max 5 attempts), upserts the user, and saves first-touch UTM on signup.
- **Google:**
  1. `GET /api/auth/google` redirects to Google with `state` in a short-lived cookie.
  2. The callback exchanges the code server-side and reads `email`, `email_verified` and `sub` from the id_token. The token came straight from Google's token endpoint over TLS, so no JWKS check is needed.
  3. Link the account by email.
- **Session:**
  - A random 32-byte token in the cookie `ypm_s` (HttpOnly, Secure, SameSite=Lax). Only its sha256 is stored.
  - 14-day idle timeout. It is extended at most once a day, so roughly one write per user per day.
  - Max 3 sessions per user; the oldest is deleted. This is the basic anti-sharing measure.
- **CSRF:** SameSite=Lax, plus every state-changing `POST` must have `content-type: application/json`. The webhook is exempt because it is signature-verified instead.

### Purchase (Razorpay, Web Crypto, no SDK)
1. `POST /api/checkout {productId}` (logged in): price comes from the catalog. Call `POST /v1/orders` with Basic auth and notes `{userId, productId}`, insert the `orders` row, and return `{orderId, amount, keyId, prefill}`.
2. The SPA loads `checkout.js` only when it's needed, then opens it.
3. On success, `POST /api/checkout/verify` checks `HMAC_SHA256(order_id|payment_id, key_secret)` with `crypto.subtle.verify`, which is constant-time. Then it calls `fulfill()`.
4. `POST /api/razorpay/webhook` verifies `X-Razorpay-Signature` over the **raw body** with the webhook secret:
   - `order.paid` → `fulfill()`
   - `payment.failed` → mark the order failed
   - `refund.processed` → mark the order refunded and revoke access
5. `fulfill(orderId, paymentId)` is **idempotent**:
   - `UPDATE orders SET status='paid' … WHERE id=? AND status='created'`, and only proceed if a row actually changed.
   - Then `INSERT OR IGNORE` the enrollments for each course the product grants.
   - Write an event and send the receipt email (with the booking link for service products).
   - Both step 3 and step 4 call it, and whichever arrives first wins.

### Video gating (R2 + HLS)
- **Encoding:** `scripts/encode.sh` turns each source video into HLS with two quality levels, 720p (~1.5 Mbps) and 360p (~400 kbps), 6 s chunks, a `master.m3u8`, and printed `durationS`. `rclone sync` uploads to R2 through its S3 API.
- **Size:** ~25 h comes to roughly 20–25 GB and ~30k files, which fits inside the free Class A operations.
- **Serving:** `GET /media/<lectureId>/<path>`:
  - Look up the lecture in the catalog. If it's free, serve it.
  - Otherwise run **one** D1 query: session joined with enrollment, not expired, not revoked.
  - Then stream from R2 with the right content type and `Cache-Control: private`.
  - Every chunk is checked, so access ends at logout or revoke.
  - `ponytail:` per-chunk D1 lookup; switch to a signed short-lived media cookie if latency or read volume ever matters.
- **Player:**
  - `hls.js`, loaded only on the lecture page; Safari plays HLS natively.
  - `controlsList="nodownload"`, right-click disabled, and a faint email watermark overlay.

### Progress (anti-skip, and it gives drop-off analytics for free)
- Each lecture is split into 10 s buckets.
- **Client:**
  - Builds a bitmap of buckets covered by `video.played`. The browser's own TimeRanges only include what was actually played, so seeking adds nothing.
  - Every 20 s while playing, and on pause, end and tab-hide (`sendBeacon`), it sends `POST /api/progress {lectureId, positionS, watched}`.
- **Server:**
  - Checks access, then ORs the new bitmap into the stored one, so viewing across multiple sessions adds up.
  - `pct = set bits / total buckets`. Sets `completed_at` once at ≥85% and logs a `lecture_done` event.
- **Resume:** `GET /api/progress/:courseId` returns `positionS`, `pct` and `completed` per lecture.
  - Lecture status is derived: no row = Not Started, below 85% = In Progress, otherwise Completed.
- **For later admin views, from the same data:** total watch time (set bits × 10 s) and per-lecture drop-off (bucket counts aggregated across users).
- **Load:** about 1 read and 1 write per 20 s of viewing. Even at 40 viewing-hours a day that's ~7k writes, well under D1's free 100k/day.

### Logging and observability
- **Business log in D1:**
  - `orders`: every payment state.
  - `events`: logins, purchases, failures, refunds, completions.
  - `progress`: viewing.

  This is collected from day 1, so the admin dashboards later have history.
- **Operational logs:** Workers Logs (`observability.enabled`; free tier 200k events/day, 3-day retention). Log `console.log(JSON)` on every error path, and log every webhook's `event.id` and type.

### Paid 1:1 calls
These use the same checkout with the `coaching-60` / `mock-interview` products. `fulfill()` emails and shows the private Calendly/Cal.com link, prefilled with name and email.

Known gap: the link itself is public. Khushbu matches bookings against the payments list. If that becomes a problem, switch to a scheduler that supports single-use links.

## 6. Hosting and cost

| Item | Free tier covers | Expected cost |
|---|---|---|
| Workers (SPA + API + media) | 100k req/day, 10 ms CPU; static assets unlimited | $0 → **$5/mo** when traffic or CPU demands it |
| D1 | 5 GB, 5M reads/day, 100k writes/day | $0 |
| R2 (~20–25 GB HLS) | 10 GB storage, free egress, 1M A / 10M B ops per month | **~$0.20/mo** |
| Resend (OTP + receipts) | 3k/mo, 100/day | $0 ($20/mo only past that) |
| Turnstile, Google OAuth, Workers Logs | free | $0 |
| Calendly free (1 event type) or Cal.com free (unlimited) | — | $0; prefer Cal.com if both coaching and mock-interview links are needed |
| Razorpay | — | **2% + 18% GST = 2.36%** domestic (₹283 on ₹11,999; ₹71 on ₹2,999); ~3% + GST international |
| Domain | already owned | existing |

**Total fixed cost: about $0–1/month in year one, plus Razorpay fees.** For comparison, Bunny Stream would be ~$3–15/mo and Cloudflare Stream ~$30/mo.

## 7. Roadmap

| Phase | Scope |
|---|---|
| **1 — Sell + watch (now)** | Details below |
| 2 — Trust and conversion | Real certificates: `certificates` table, issued at 100%, `/verify` calls the API, printable certificate page (browser print to PDF), remove the fake ID. Coaching and mock-interview product pages. Contact and lead forms saved to D1. tawk.to. Privacy policy updated (cookies, Razorpay, Google, Resend). Real Calendly and WhatsApp links. |
| 3 — Admin first version | `/admin` in the same SPA, gated by `is_admin`. Overview counts and revenue. Students list (+CSV) with lecture-wise progress. Payments list (+CSV). Manual grant/revoke. Coupons (server-side price math). Leads by UTM source. |
| 4 — UI overhaul (can run in parallel) | Apply the doc's copy edits, a calmer visual system, remove the GSAP/framer duplication, compress or lazy-load the reel mp4, per-page titles/OG tags, accessibility fixes |
| Later | Announcements (Resend), drop-off chart, live sessions, assignments/quizzes, limited-time access, Meta CAPI + ad-spend import, GST invoices |

## 8. Phase 1 — implementation outline

The detailed task-by-task plan will be written with `writing-plans` after you approve this. The order:

0. **Prep (manual, you):**
   - Commit the current uncommitted and untracked work first. About, Verify, LegalPage and others are untracked.
   - Create D1 `ypm` with `--location apac`, R2 `ypm-media`, Razorpay **test** keys + webhook secret, Resend domain DNS, a Google OAuth client, and Turnstile keys.
   - `brew install ffmpeg rclone`.
1. **Platform:**
   - Add the devDependencies `wrangler` and `@cloudflare/vite-plugin`.
   - Add `wrangler.jsonc`: assets `./dist`, SPA handling, `run_worker_first` for `/api/*` and `/media/*`, the `DB` and `MEDIA` bindings, observability on.
   - Add `cloudflare()` to `vite.config.ts`, and check that `manualChunks` only applies to the client build.
   - Delete `public/_redirects`.
   - Secrets go in `wrangler secret put`; `.dev.vars` is gitignored.
2. **Data:** `src/data/catalog.ts` and `migrations/0001_init.sql`.
3. **Worker:**
   - `worker/index.ts` (router + `json()`/`session()` helpers)
   - `worker/auth.ts`
   - `worker/pay.ts`
   - `worker/media.ts` (gated R2 + progress)
   - `worker/lib.ts` (HMAC verify, bitmap OR/count, cookie parse) with **one** `worker/lib.test.ts` run via `node --test`. Node 26 runs TypeScript directly.
4. **Video:**
   - `scripts/encode.sh` and an rclone remote. Prove the pipeline with 2–3 real lectures before encoding all ~50.
   - Fill in `durationS` in the catalog.
5. **CSS prerequisite:** delete the hand-copied utility block and the shadcn `.dark`/`@theme` leftovers in `src/styles.css`, so responsive layouts work on the new pages. Then do a visual pass over every existing page.
6. **Frontend:**
   - Pages:
     - `/login` (OTP + Google)
     - `/dashboard` (enrolled courses, continue watching)
     - `/learn/:courseId/:lectureId` (player + module list + next button)
     - `/refund-policy`, `/delivery-policy`, both reusing `src/components/LegalPage.tsx`
     - a 404 route
   - Hooks and wiring:
     - "Enroll" on `CourseContent.tsx` triggers checkout.
     - `Courses.tsx` and `CourseContent.tsx` read from the catalog.
     - First-touch UTM capture in `main.tsx`.
     - `src/lib/api.ts` (fetch wrapper).
   - Add the `hls.js` dependency, loaded only on the lecture page.
   - Remove the unused `@tanstack/react-query`, `cva`, `clsx`, `tailwind-merge`, `tailwindcss-animate` and `tailwind.config.js` only in Phase 4, to keep this change focused.
7. **Deploy:** first to `*.workers.dev` with Razorpay test mode. Then move the custom domain from the Pages project to the Worker, submit the site for Razorpay activation, and switch to live keys.

Manual admin until Phase 3: `wrangler d1 execute ypm --remote --command "INSERT INTO enrollments …"`. The common commands will be documented in the README.

## 9. Verification (Phase 1)
- `node --test worker/` covers:
  - valid and invalid Razorpay payment and webhook signatures
  - `fulfill()` running twice grants access once
  - bitmap merge: seeking adds nothing, and two partial sessions combine to ≥85%
- `npm run dev`, then walk through end to end:
  1. Log in with an OTP from the Resend test inbox, and with Google.
  2. Buy Foundations with a Razorpay test card or `success@razorpay` UPI. Check that the `orders` row is `paid` and the enrollment exists.
  3. The video plays and the progress row updates. Reload: it resumes at the saved position.
  4. Seek to the end: it does **not** complete. Watch through: it completes at 85%.
- **Negative checks:**
  - Logged out, or not enrolled → `/media/<paid lecture>/master.m3u8` returns 401/403.
  - A free lecture plays without logging in.
  - Tampering with the amount in the request body has no effect.
- **Webhook:** send a Razorpay test webhook to the `workers.dev` URL. Run it twice and confirm a single enrollment.
- `npm run build` passes, and every existing page still renders after the CSS cleanup (checked visually at 375 px and 1280 px).

## 10. Open questions for Khushbu (none block Phase 1)
1. Final Foundations lecture count, and which lectures are free previews (the site says 1 in one place and 3 in another).
2. Does AI PM include the 2 h mock interview?
3. Is she GST-registered (affects invoices)?
4. Official support email.
5. Coaching and mock-interview prices and durations.
6. Founder photo, real Calendly/Cal.com and WhatsApp links.
7. LMS pages: light or dark?
8. Exact wording of the refund policy.

## After approval
Save this spec to `docs/superpowers/specs/2026-10-03-ypm-platform-design.md`, then write the detailed Phase 1 implementation plan (`writing-plans`) and pick an execution method.
