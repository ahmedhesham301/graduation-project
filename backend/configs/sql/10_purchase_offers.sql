
CREATE TYPE "offer_status" AS ENUM ('pending', 'accepted', 'rejected', 'cancelled', 'countered', 'completed');

CREATE TABLE "purchase_offers" (
  "id" SERIAL PRIMARY KEY,
  "property_id" INTEGER NOT NULL,
  "buyer_id" INTEGER NOT NULL,
  "offer_price" BIGINT NOT NULL CHECK (offer_price > 0),
  "counter_price" BIGINT,
  "status" offer_status NOT NULL DEFAULT 'pending',
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE INDEX ON "purchase_offers" ("property_id");
CREATE INDEX ON "purchase_offers" ("buyer_id");
CREATE INDEX ON "purchase_offers" ("status");

ALTER TABLE "purchase_offers" ADD FOREIGN KEY ("property_id") REFERENCES "properties" ("id") ON DELETE CASCADE;
ALTER TABLE "purchase_offers" ADD FOREIGN KEY ("buyer_id") REFERENCES "users" ("id") ON DELETE CASCADE;
