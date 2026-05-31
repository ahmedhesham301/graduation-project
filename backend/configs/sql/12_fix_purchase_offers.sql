ALTER TYPE offer_status ADD VALUE IF NOT EXISTS 'countered';
ALTER TYPE offer_status ADD VALUE IF NOT EXISTS 'completed';

ALTER TABLE purchase_offers ADD COLUMN IF NOT EXISTS counter_price BIGINT;
