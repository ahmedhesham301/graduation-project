-- Adds the data needed for GET /api/analytics/market-trends.
-- Run this on an existing database. Fresh databases already get these
-- objects from 1_schema.sql.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_contact_methods') THEN
    CREATE TYPE property_contact_methods AS ENUM ('phone', 'email', 'whatsapp');
  END IF;
END $$;

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

CREATE TABLE IF NOT EXISTS property_contact_events (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL,
  user_id INTEGER,
  contact_session_id VARCHAR,
  contact_method property_contact_methods NOT NULL,
  contacted_at timestamptz NOT NULL DEFAULT (now()),
  CHECK (user_id IS NOT NULL OR contact_session_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS properties_sold_at_idx ON properties (sold_at);
CREATE INDEX IF NOT EXISTS properties_sold_price_idx ON properties (sold_price);
CREATE INDEX IF NOT EXISTS properties_created_at_idx ON properties (created_at);

CREATE INDEX IF NOT EXISTS property_price_history_property_id_idx ON property_price_history (property_id);
CREATE INDEX IF NOT EXISTS property_price_history_changed_at_idx ON property_price_history (changed_at);

CREATE INDEX IF NOT EXISTS property_views_property_id_idx ON property_views (property_id);
CREATE INDEX IF NOT EXISTS property_views_user_id_idx ON property_views (user_id);
CREATE INDEX IF NOT EXISTS property_views_viewed_at_idx ON property_views (viewed_at);

CREATE INDEX IF NOT EXISTS property_contact_events_property_id_idx ON property_contact_events (property_id);
CREATE INDEX IF NOT EXISTS property_contact_events_user_id_idx ON property_contact_events (user_id);
CREATE INDEX IF NOT EXISTS property_contact_events_contact_method_idx ON property_contact_events (contact_method);
CREATE INDEX IF NOT EXISTS property_contact_events_contacted_at_idx ON property_contact_events (contacted_at);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'properties'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE properties DROP COLUMN status;
  END IF;

  DROP TYPE IF EXISTS property_statuses;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'properties_sold_state_check'
  ) THEN
    ALTER TABLE properties
      ADD CONSTRAINT properties_sold_state_check
      CHECK (
        (sold_at IS NULL AND sold_price IS NULL)
        OR
        (sold_at IS NOT NULL)
      );
  END IF;

  IF to_regclass('property_contacts') IS NOT NULL
     AND to_regclass('property_contact_events') IS NOT NULL THEN
    INSERT INTO property_contact_events (
      property_id,
      user_id,
      contact_session_id,
      contact_method,
      contacted_at
    )
    SELECT
      property_id,
      user_id,
      contact_session_id,
      contact_method,
      contacted_at
    FROM property_contacts
    ON CONFLICT DO NOTHING;

    DROP TABLE property_contacts;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'property_contact_events_property_id_fkey'
  ) THEN
    ALTER TABLE property_contact_events
      ADD CONSTRAINT property_contact_events_property_id_fkey
      FOREIGN KEY (property_id) REFERENCES properties (id)
      DEFERRABLE INITIALLY IMMEDIATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'property_contact_events_user_id_fkey'
  ) THEN
    ALTER TABLE property_contact_events
      ADD CONSTRAINT property_contact_events_user_id_fkey
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
