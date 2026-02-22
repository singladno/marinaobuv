-- Add sourceId to ParsingHistory for per-chat (WA) / per-source (TG) filtering (idempotent)
ALTER TABLE "ParsingHistory" ADD COLUMN IF NOT EXISTS "sourceId" TEXT;

-- Index for filtering by source (chat id, channel id, etc.)
CREATE INDEX IF NOT EXISTS "ParsingHistory_sourceId_idx" ON "ParsingHistory"("sourceId");
