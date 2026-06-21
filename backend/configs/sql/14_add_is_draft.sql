ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT FALSE;

-- Existing properties with pending_media=true and no media are drafts
UPDATE properties SET is_draft = true WHERE pending_media = true AND NOT EXISTS (
    SELECT 1 FROM property_media pm WHERE pm.property_id = properties.id AND pm.uploaded_at IS NOT NULL
);
