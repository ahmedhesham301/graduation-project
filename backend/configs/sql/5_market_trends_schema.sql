-- Adds the data needed for GET /api/analytics/market-trends.
-- Run this on an existing database. Fresh databases already get these
-- objects from 1_schema.sql.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_statuses') THEN
    CREATE TYPE property_statuses AS ENUM ('listed', 'sold', 'withdrawn');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_contact_methods') THEN
    CREATE TYPE property_contact_methods AS ENUM ('phone', 'email', 'whatsapp', 'message');
  END IF;
END $$;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS status property_statuses NOT NULL DEFAULT 'listed';

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS sold_at timestamptz;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS sold_price BIGINT CHECK (sold_price IS NULL OR sold_price > 0);

CREATE TABLE IF NOT EXISTS property_price_history (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL,
  old_price BIGINT,
  new_price BIGINT NOT NULL CHECK (new_price > 0),
  changed_at timestamptz NOT NULL DEFAULT (now()),
  CHECK (old_price IS NULL OR old_price > 0)
);

CREATE TABLE IF NOT EXISTS property_views (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL,
  user_id INTEGER,
  viewer_session_id VARCHAR,
  viewed_at timestamptz NOT NULL DEFAULT (now()),
  CHECK (user_id IS NOT NULL OR viewer_session_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS property_contacts (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL,
  user_id INTEGER,
  contact_session_id VARCHAR,
  contact_method property_contact_methods NOT NULL,
  contacted_at timestamptz NOT NULL DEFAULT (now()),
  CHECK (user_id IS NOT NULL OR contact_session_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS properties_status_idx ON properties (status);
CREATE INDEX IF NOT EXISTS properties_sold_at_idx ON properties (sold_at);
CREATE INDEX IF NOT EXISTS properties_sold_price_idx ON properties (sold_price);
CREATE INDEX IF NOT EXISTS properties_created_at_idx ON properties (created_at);

CREATE INDEX IF NOT EXISTS property_price_history_property_id_idx ON property_price_history (property_id);
CREATE INDEX IF NOT EXISTS property_price_history_changed_at_idx ON property_price_history (changed_at);

CREATE INDEX IF NOT EXISTS property_views_property_id_idx ON property_views (property_id);
CREATE INDEX IF NOT EXISTS property_views_user_id_idx ON property_views (user_id);
CREATE INDEX IF NOT EXISTS property_views_viewed_at_idx ON property_views (viewed_at);

CREATE INDEX IF NOT EXISTS property_contacts_property_id_idx ON property_contacts (property_id);
CREATE INDEX IF NOT EXISTS property_contacts_user_id_idx ON property_contacts (user_id);
CREATE INDEX IF NOT EXISTS property_contacts_contact_method_idx ON property_contacts (contact_method);
CREATE INDEX IF NOT EXISTS property_contacts_contacted_at_idx ON property_contacts (contacted_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'properties_sold_state_check'
  ) THEN
    ALTER TABLE properties
      ADD CONSTRAINT properties_sold_state_check
      CHECK (
        (status = 'sold' AND sold_at IS NOT NULL)
        OR
        (status <> 'sold' AND sold_at IS NULL AND sold_price IS NULL)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'property_contacts_property_id_fkey'
  ) THEN
    ALTER TABLE property_contacts
      ADD CONSTRAINT property_contacts_property_id_fkey
      FOREIGN KEY (property_id) REFERENCES properties (id)
      DEFERRABLE INITIALLY IMMEDIATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'property_contacts_user_id_fkey'
  ) THEN
    ALTER TABLE property_contacts
      ADD CONSTRAINT property_contacts_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users (id)
      DEFERRABLE INITIALLY IMMEDIATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'property_price_history_property_id_fkey'
  ) THEN
    ALTER TABLE property_price_history
      ADD CONSTRAINT property_price_history_property_id_fkey
      FOREIGN KEY (property_id) REFERENCES properties (id)
      DEFERRABLE INITIALLY IMMEDIATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'property_views_property_id_fkey'
  ) THEN
    ALTER TABLE property_views
      ADD CONSTRAINT property_views_property_id_fkey
      FOREIGN KEY (property_id) REFERENCES properties (id)
      DEFERRABLE INITIALLY IMMEDIATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'property_views_user_id_fkey'
  ) THEN
    ALTER TABLE property_views
      ADD CONSTRAINT property_views_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users (id)
      DEFERRABLE INITIALLY IMMEDIATE;
  END IF;
END $$;
