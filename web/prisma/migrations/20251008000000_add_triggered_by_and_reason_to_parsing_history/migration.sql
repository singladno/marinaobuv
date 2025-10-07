-- Add triggeredBy and reason columns to ParsingHistory table
ALTER TABLE "ParsingHistory" ADD COLUMN "triggeredBy" TEXT;
ALTER TABLE "ParsingHistory" ADD COLUMN "reason" TEXT;

-- Create index for triggeredBy column for better query performance
CREATE INDEX "ParsingHistory_triggeredBy_idx" ON "ParsingHistory"("triggeredBy");
