CREATE TYPE "verification_status" AS ENUM (
  'unverified',
  'pending',
  'verified',
  'rejected',
  'banned'
);

CREATE TABLE "buyers" (
  "id" SERIAL PRIMARY KEY,
  "full_name" VARCHAR NOT NULL,
  "email" VARCHAR UNIQUE,
  "phone" VARCHAR UNIQUE,
  "password_hash" VARCHAR NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT (now())
);

CREATE TABLE "saved" (
  "id" SERIAL PRIMARY KEY,
  "buyer_id" INTEGER,
  "propertiy_id" INTEGER
);

CREATE TABLE "sellers" (
  "id" SERIAL PRIMARY KEY,
  "company_id" INTEGER,
  "full_name" VARCHAR,
  "email" VARCHAR UNIQUE,
  "phone" VARCHAR UNIQUE,
  "password_hash" VARCHAR,
  "status" verification_status NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT (now())
);

CREATE TABLE "companies" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR UNIQUE,
  "address" VARCHAR NOT NULL,
  "manager" INTEGER UNIQUE NOT NULL,
  "status" verification_status NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT (now())
);

CREATE TABLE "properties" (
  "id" SERIAL PRIMARY KEY,
  "seller_id" INTEGER NOT NULL,
  "type" VARCHAR NOT NULL,
  "location" VARCHAR NOT NULL,
  "area" smallint NOT NULL CHECK (area > 0),
  "floors" smallint NOT NULL CHECK (floors > 0),
  "rooms" smallint NOT NULL CHECK (rooms > 0),
  "bathrooms" smallint NOT NULL CHECK (bathrooms > 0),
  "city" VARCHAR NOT NULL,
  "district" VARCHAR NOT NULL,
  "description" VARCHAR,
  "price" INTEGER NOT NULL CHECK (price > 0),
  "status" VARCHAR,
  "created_at" TIMESTAMPTZ DEFAULT (now())
);

CREATE TABLE "property_media" (
  "id" SERIAL PRIMARY KEY,
  "property_id" INTEGER,
  "url" VARCHAR NOT NULL,
  "media_type" VARCHAR NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT (now())
);

CREATE TABLE "features" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR UNIQUE
);

CREATE TABLE "property_features" (
  "id" SERIAL PRIMARY KEY,
  "property_id" INTEGER,
  "feature_id" INTEGER
);

CREATE INDEX ON "saved" ("buyer_id");

CREATE INDEX ON "property_media" ("property_id");

ALTER TABLE "saved" ADD FOREIGN KEY ("buyer_id") REFERENCES "buyers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "saved" ADD FOREIGN KEY ("propertiy_id") REFERENCES "properties" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "sellers" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "companies" ADD FOREIGN KEY ("manager") REFERENCES "sellers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "properties" ADD FOREIGN KEY ("seller_id") REFERENCES "sellers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "property_media" ADD FOREIGN KEY ("property_id") REFERENCES "properties" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "property_features" ADD FOREIGN KEY ("property_id") REFERENCES "properties" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "property_features" ADD FOREIGN KEY ("feature_id") REFERENCES "features" ("id") DEFERRABLE INITIALLY IMMEDIATE;
