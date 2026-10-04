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
