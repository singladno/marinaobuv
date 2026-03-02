-- Add legacySectionId to Category (ID раздела на старом портале, for leaf categories, used in exports)
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "legacySectionId" TEXT;
