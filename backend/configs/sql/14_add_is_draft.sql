ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT FALSE;

-- Make columns nullable for drafts
ALTER TABLE properties ALTER COLUMN type_id DROP NOT NULL;
ALTER TABLE properties ALTER COLUMN coordinates DROP NOT NULL;
ALTER TABLE properties ALTER COLUMN area DROP NOT NULL;
ALTER TABLE properties ALTER COLUMN floors DROP NOT NULL;
ALTER TABLE properties ALTER COLUMN rooms DROP NOT NULL;
ALTER TABLE properties ALTER COLUMN bathrooms DROP NOT NULL;
ALTER TABLE properties ALTER COLUMN city_id DROP NOT NULL;
ALTER TABLE properties ALTER COLUMN district_id DROP NOT NULL;
ALTER TABLE properties ALTER COLUMN price DROP NOT NULL;
ALTER TABLE properties ALTER COLUMN condition DROP NOT NULL;

-- Existing properties with pending_media=true and no media are drafts
UPDATE properties SET is_draft = true WHERE pending_media = true AND NOT EXISTS (
    SELECT 1 FROM property_media pm WHERE pm.property_id = properties.id AND pm.uploaded_at IS NOT NULL
);
