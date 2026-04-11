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

CREATE TYPE "property_status" AS ENUM (
  'active',
  'sold',
  'archived'
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
  "company_id" INTEGER,
  "status" verification_status NOT NULL DEFAULT 'unverified'
);

CREATE TABLE "saved" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "property_id" INTEGER NOT NULL
);

CREATE TABLE "companies" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR UNIQUE NOT NULL,
  "address" VARCHAR NOT NULL,
  "manager" INTEGER UNIQUE NOT NULL,
  "status" verification_status NOT NULL DEFAULT 'unverified',
  "created_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE "properties" (
  "id" SERIAL PRIMARY KEY,
  "seller_id" INTEGER NOT NULL,
  "type" VARCHAR NOT NULL,
  "coordinates" geometry(Point, 4326) NOT NULL,
  "area" INTEGER NOT NULL CHECK (area > 0),
  "floors" SMALLINT NOT NULL CHECK (floors > 0),
  "rooms" SMALLINT NOT NULL CHECK (rooms > 0),
  "bathrooms" SMALLINT NOT NULL CHECK (bathrooms > 0),
  "city_id" INTEGER NOT NULL,
  "district_id" INTEGER NOT NULL,
  "description" VARCHAR,
  "price" BIGINT NOT NULL CHECK (price > 0),
  "status" property_status NOT NULL DEFAULT 'active',
  "created_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE "cities" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR UNIQUE NOT NULL
);

CREATE TABLE "districts" (
  "id" SERIAL PRIMARY KEY,
  "city_id" INTEGER NOT NULL,
  "name" VARCHAR NOT NULL
);

CREATE TABLE "property_media" (
  "id" SERIAL PRIMARY KEY,
  "property_id" INTEGER NOT NULL,
  "url" VARCHAR NOT NULL,
  "media_type" VARCHAR NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE "features" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR UNIQUE NOT NULL
);

CREATE TABLE "property_features" (
  "id" SERIAL PRIMARY KEY,
  "property_id" INTEGER NOT NULL,
  "feature_id" INTEGER NOT NULL
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

CREATE INDEX ON "properties" ("status");

CREATE UNIQUE INDEX ON "districts" ("city_id", "name");

CREATE INDEX ON "property_media" ("property_id");

CREATE INDEX ON "property_features" ("feature_id");

CREATE UNIQUE INDEX ON "property_features" ("property_id", "feature_id");

ALTER TABLE "seller_profile" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "seller_profile" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "saved" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "saved" ADD FOREIGN KEY ("property_id") REFERENCES "properties" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "companies" ADD FOREIGN KEY ("manager") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "properties" ADD FOREIGN KEY ("seller_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "properties" ADD FOREIGN KEY ("city_id") REFERENCES "cities" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "properties" ADD FOREIGN KEY ("district_id") REFERENCES "districts" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "districts" ADD FOREIGN KEY ("city_id") REFERENCES "cities" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "property_media" ADD FOREIGN KEY ("property_id") REFERENCES "properties" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "property_features" ADD FOREIGN KEY ("property_id") REFERENCES "properties" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "property_features" ADD FOREIGN KEY ("feature_id") REFERENCES "features" ("id") DEFERRABLE INITIALLY IMMEDIATE;
