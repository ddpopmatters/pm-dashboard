-- Fix: teams_webhook_url is exposed to all authenticated users via guidelines table.
-- Move it to an admin-only secrets table.

-- Admin-only secrets table
CREATE TABLE IF NOT EXISTS app_secrets (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_secrets ENABLE ROW LEVEL SECURITY;

-- Only admins can read or write secrets
CREATE POLICY "secrets_admin_only" ON app_secrets
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Migrate existing webhook URL if present
INSERT INTO app_secrets (key, value, updated_at)
SELECT 'teams_webhook_url', teams_webhook_url, NOW()
FROM guidelines
WHERE id = 'default' AND teams_webhook_url IS NOT NULL AND teams_webhook_url != ''
ON CONFLICT (key) DO NOTHING;

-- Drop the column from guidelines so non-admins can't read it
ALTER TABLE guidelines DROP COLUMN IF EXISTS teams_webhook_url;
