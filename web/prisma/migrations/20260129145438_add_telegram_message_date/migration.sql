-- AlterTable: Add date field to TelegramMessage to store original Telegram timestamp
ALTER TABLE "TelegramMessage" ADD COLUMN "date" BIGINT;

-- CreateIndex: Add index on date field for efficient sorting
CREATE INDEX "TelegramMessage_date_idx" ON "TelegramMessage"("date");
