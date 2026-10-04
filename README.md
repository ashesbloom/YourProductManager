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
