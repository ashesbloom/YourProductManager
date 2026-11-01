-- Programme line on an admin-issued certificate; NULL = the default programme.
ALTER TABLE users ADD COLUMN cert_title TEXT;
-- When the "your certificate is ready" email last went out; the automatic one is sent only while this is NULL.
ALTER TABLE users ADD COLUMN cert_emailed_at INTEGER;
