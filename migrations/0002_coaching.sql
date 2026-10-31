-- Set by an admin when a learner finishes the 1:1 Coaching Programme; it earns the certificate on its own.
ALTER TABLE users ADD COLUMN coaching_completed_at INTEGER;
-- Random public certificate ID, assigned the first time the certificate is earned. Random, not the user id,
-- so the verify page can't be walked to list every certified learner.
ALTER TABLE users ADD COLUMN cert_id TEXT;
CREATE UNIQUE INDEX users_cert_id ON users(cert_id);
