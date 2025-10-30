-- Add optional color field to OrderItem
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "color" TEXT;

-- Optional index if filtering by color is expected (safe to skip if not needed)
-- CREATE INDEX IF NOT EXISTS "OrderItem_color_idx" ON "OrderItem" ("color");


