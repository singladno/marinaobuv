-- Safe additive migration to support color-specific purchase items
-- This will NOT drop or rewrite existing tables. It only adds a nullable column and indexes.

-- 1) Add nullable color column if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'PurchaseItem'
      AND column_name = 'color'
  ) THEN
    ALTER TABLE "public"."PurchaseItem"
      ADD COLUMN "color" TEXT;
  END IF;
END$$;

-- 2) Create index on (purchaseId, productId, color) for fast lookups, if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'PurchaseItem_purchaseId_productId_color_idx'
  ) THEN
    CREATE INDEX "PurchaseItem_purchaseId_productId_color_idx"
    ON "public"."PurchaseItem" ("purchaseId", "productId", "color");
  END IF;
END$$;


