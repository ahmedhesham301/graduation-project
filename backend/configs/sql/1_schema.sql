CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE "user_roles" AS ENUM (
  'seller',
  'buyer',
  'admin'
);

CREATE TYPE "verification_status" AS ENUM (
  'unverified',
  'pending',
  'verified',
  'rejected',
  'banned'
);

CREATE TYPE "media_types" AS ENUM (
  'jpeg',
  'jpg',
  'png',
  'webp'
);

CREATE TYPE "property_conditions" AS ENUM (
  'not finished',
  'semi finished',
  'fully finished',
  'luxury finished'
);

CREATE TYPE "property_contact_methods" AS ENUM (
  'phone',
  'email',
  'whatsapp'
);

CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "full_name" VARCHAR NOT NULL,
  "email" citext UNIQUE,
  "phone" VARCHAR UNIQUE,
  "password_hash" VARCHAR NOT NULL,
  "role" user_roles NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE TABLE "seller_profile" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER UNIQUE NOT NULL,
  "status" verification_status NOT NULL DEFAULT 'unverified'
);

CREATE TABLE "saved" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "property_id" INTEGER NOT NULL
);

CREATE TABLE "properties" (
  "id" SERIAL PRIMARY KEY,
  "seller_id" INTEGER NOT NULL,
  "type_id" INTEGER NOT NULL,
  "coordinates" geometry(Point,4326) NOT NULL,
  "area" INTEGER NOT NULL CHECK (area > 0),
  "floors" SMALLINT NOT NULL CHECK (floors > 0),
  "rooms" SMALLINT NOT NULL CHECK (rooms > 0),
  "bathrooms" SMALLINT NOT NULL CHECK (bathrooms > 0),
  "city_id" INTEGER NOT NULL,
  "district_id" INTEGER NOT NULL,
  "description" VARCHAR,
  "price" BIGINT NOT NULL CHECK (price > 0),
  "pending_media" bool NOT NULL DEFAULT true,
  "condition" property_conditions NOT NULL,
  "deleted_at" timestamptz,
  "sold_at" timestamptz ,
  "sold_price" BIGINT CHECK (sold_price IS NULL OR sold_price > 0),
  "created_at" timestamptz NOT NULL DEFAULT (now())
  
);

CREATE TABLE "cities" (
  "id" SERIAL PRIMARY KEY,
  "name" citext UNIQUE NOT NULL
);

CREATE TABLE "districts" (
  "id" SERIAL PRIMARY KEY,
  "city_id" INTEGER NOT NULL,
  "name" citext NOT NULL
);

CREATE TABLE "property_media" (
  "id" SERIAL PRIMARY KEY,
  "property_id" INTEGER NOT NULL,
  "s3_key" uuid UNIQUE NOT NULL,
  "extension" media_types NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "uploaded_at" timestamptz
);

CREATE TABLE "property_types" (
  "id" SERIAL PRIMARY KEY,
  "name" citext UNIQUE NOT NULL
);

CREATE TABLE "features" (
  "id" SERIAL PRIMARY KEY,
  "name" citext UNIQUE NOT NULL
);

CREATE TABLE "property_features" (
  "id" SERIAL PRIMARY KEY,
  "property_id" INTEGER NOT NULL,
  "feature_id" INTEGER NOT NULL
);

CREATE TABLE "property_price_history" (
  "id" SERIAL PRIMARY KEY,
  "property_id" INTEGER NOT NULL,
  "old_price" BIGINT,
  "new_price" BIGINT NOT NULL CHECK (new_price > 0),
  "changed_at" timestamptz NOT NULL DEFAULT (now()),
  CHECK (old_price IS NULL OR old_price > 0)
);

CREATE TABLE "property_views" (
  "id" SERIAL PRIMARY KEY,
  "property_id" INTEGER NOT NULL,
  "user_id" INTEGER,
  "viewer_session_id" VARCHAR,
  "viewed_at" timestamptz NOT NULL DEFAULT (now()),
  CHECK (user_id IS NOT NULL OR viewer_session_id IS NOT NULL)
);

CREATE TABLE "property_contact_events" (
  "id" SERIAL PRIMARY KEY,
  "property_id" INTEGER NOT NULL,
  "user_id" INTEGER,
  "contact_session_id" VARCHAR,
  "contact_method" property_contact_methods NOT NULL,
  "contacted_at" timestamptz NOT NULL DEFAULT (now()),
  CHECK (user_id IS NOT NULL OR contact_session_id IS NOT NULL)
);

CREATE INDEX ON "saved" ("user_id");

CREATE UNIQUE INDEX ON "saved" ("user_id", "property_id");

CREATE INDEX ON "properties" ("seller_id");

CREATE INDEX ON "properties" ("area");

CREATE INDEX ON "properties" ("floors");

CREATE INDEX ON "properties" ("rooms");

CREATE INDEX ON "properties" ("bathrooms");

CREATE INDEX ON "properties" ("city_id");

CREATE INDEX ON "properties" ("district_id");

CREATE INDEX ON "properties" ("price");

CREATE INDEX ON "properties" ("deleted_at");

CREATE INDEX ON "properties" ("pending_media");

CREATE INDEX ON "properties" ("sold_at");

CREATE INDEX ON "properties" ("sold_price");

CREATE INDEX ON "properties" ("created_at");

CREATE INDEX ON "properties" USING GIST ("coordinates");

CREATE UNIQUE INDEX ON "districts" ("city_id", "name");

CREATE INDEX ON "property_media" ("property_id");

CREATE INDEX ON "property_features" ("feature_id");

CREATE UNIQUE INDEX ON "property_features" ("property_id", "feature_id");

CREATE INDEX ON "property_price_history" ("property_id");

CREATE INDEX ON "property_price_history" ("changed_at");

CREATE INDEX ON "property_views" ("property_id");

CREATE INDEX ON "property_views" ("user_id");

CREATE INDEX ON "property_views" ("viewed_at");

CREATE INDEX ON "property_contact_events" ("property_id");

CREATE INDEX ON "property_contact_events" ("user_id");

CREATE INDEX ON "property_contact_events" ("contact_method");

CREATE INDEX ON "property_contact_events" ("contacted_at");

ALTER TABLE "seller_profile" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "saved" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "saved" ADD FOREIGN KEY ("property_id") REFERENCES "properties" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "properties" ADD FOREIGN KEY ("seller_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "properties" ADD FOREIGN KEY ("type_id") REFERENCES "property_types" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "properties" ADD FOREIGN KEY ("city_id") REFERENCES "cities" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "properties" ADD FOREIGN KEY ("district_id") REFERENCES "districts" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "districts" ADD FOREIGN KEY ("city_id") REFERENCES "cities" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "property_media" ADD FOREIGN KEY ("property_id") REFERENCES "properties" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "property_features" ADD FOREIGN KEY ("property_id") REFERENCES "properties" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "property_features" ADD FOREIGN KEY ("feature_id") REFERENCES "features" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "property_price_history" ADD FOREIGN KEY ("property_id") REFERENCES "properties" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "property_views" ADD FOREIGN KEY ("property_id") REFERENCES "properties" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "property_views" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "property_contact_events" ADD FOREIGN KEY ("property_id") REFERENCES "properties" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "property_contact_events" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;