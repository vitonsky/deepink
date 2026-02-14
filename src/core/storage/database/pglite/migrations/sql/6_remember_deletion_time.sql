ALTER TABLE "notes" 
ADD COLUMN "deleted_at" TIMESTAMP WITH TIME ZONE DEFAULT null;

-- Migrate deletion status
UPDATE notes
SET deleted_at = COALESCE(updated_at, now())
WHERE deleted IS true;

ALTER TABLE "notes"
DROP COLUMN "deleted";