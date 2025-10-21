-- Add triggeredBy and reason columns to ParsingHistory table (idempotent)
ALTER TABLE "ParsingHistory" ADD COLUMN IF NOT EXISTS "triggeredBy" TEXT;
ALTER TABLE "ParsingHistory" ADD COLUMN IF NOT EXISTS "reason" TEXT;

-- Create index for triggeredBy column (idempotent)
CREATE INDEX IF NOT EXISTS "ParsingHistory_triggeredBy_idx" ON "ParsingHistory"("triggeredBy");
