-- Set by an admin when a learner finishes the 1:1 Coaching Programme; it earns the certificate on its own.
ALTER TABLE users ADD COLUMN coaching_completed_at INTEGER;
