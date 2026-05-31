CREATE TYPE "moderation_status" AS ENUM (
  'pending',
  'approved',
  'rejected'
);

ALTER TABLE properties ADD COLUMN IF NOT EXISTS moderation_status moderation_status NOT NULL DEFAULT 'pending';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE TABLE IF NOT EXISTS site_settings (
    key VARCHAR PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial settings
INSERT INTO site_settings (key, value) VALUES
('site_name', '3akarati'),
('contact_email', 'support@3akarati.com'),
('contact_phone', '+20 123 456 789'),
('maintenance_mode', 'false'),
('allow_new_registrations', 'true'),
('featured_properties_limit', '6')
ON CONFLICT (key) DO NOTHING;
