-- AlterEnum
ALTER TYPE "ProductSource" ADD VALUE 'TG';

-- CreateTable
CREATE TABLE "TelegramMessage" (
    "id" TEXT NOT NULL,
    "tgMessageId" INTEGER NOT NULL,
    "chatId" TEXT,
    "fromId" INTEGER,
    "fromUsername" TEXT,
    "fromFirstName" TEXT,
    "fromLastName" TEXT,
    "type" TEXT,
    "text" TEXT,
    "caption" TEXT,
    "mediaUrl" TEXT,
    "mediaFileId" TEXT,
    "mediaWidth" INTEGER,
    "mediaHeight" INTEGER,
    "mediaMimeType" TEXT,
    "mediaFileSize" INTEGER,
    "providerId" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "rawPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramMessage_tgMessageId_key" ON "TelegramMessage"("tgMessageId");

-- CreateIndex
CREATE INDEX "TelegramMessage_createdAt_idx" ON "TelegramMessage"("createdAt");

-- CreateIndex
CREATE INDEX "TelegramMessage_fromId_idx" ON "TelegramMessage"("fromId");

-- CreateIndex
CREATE INDEX "TelegramMessage_fromUsername_idx" ON "TelegramMessage"("fromUsername");

-- CreateIndex
CREATE INDEX "TelegramMessage_chatId_idx" ON "TelegramMessage"("chatId");

-- CreateIndex
CREATE INDEX "TelegramMessage_processed_idx" ON "TelegramMessage"("processed");

-- CreateIndex
CREATE INDEX "TelegramMessage_providerId_idx" ON "TelegramMessage"("providerId");

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "telegramUsername" TEXT,
ADD COLUMN     "telegramId" INTEGER;

-- CreateIndex
CREATE INDEX "Provider_telegramUsername_idx" ON "Provider"("telegramUsername");

-- CreateIndex
CREATE INDEX "Provider_telegramId_idx" ON "Provider"("telegramId");

-- AddForeignKey
ALTER TABLE "TelegramMessage" ADD CONSTRAINT "TelegramMessage_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
