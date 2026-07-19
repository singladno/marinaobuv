-- Multi-channel Telegram: unique per (chatId, tgMessageId)

-- Backfill null/empty chatId so we can enforce NOT NULL + composite unique
UPDATE "TelegramMessage"
SET "chatId" = 'legacy-tg'
WHERE "chatId" IS NULL OR "chatId" = '';

DROP INDEX IF EXISTS "TelegramMessage_tgMessageId_key";

ALTER TABLE "TelegramMessage"
  ALTER COLUMN "chatId" SET NOT NULL;

CREATE UNIQUE INDEX "TelegramMessage_chatId_tgMessageId_key"
  ON "TelegramMessage"("chatId", "tgMessageId");
