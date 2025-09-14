/*
  Warnings:

  - You are about to drop the column `messageType` on the `WhatsAppMessage` table. All the data in the column will be lost.
  - You are about to drop the column `pushName` on the `WhatsAppMessage` table. All the data in the column will be lost.
  - You are about to drop the column `remoteJid` on the `WhatsAppMessage` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "WhatsAppMessage_messageType_idx";

-- DropIndex
DROP INDEX "WhatsAppMessage_remoteJid_idx";

-- AlterTable
ALTER TABLE "WhatsAppMessage" DROP COLUMN "messageType",
DROP COLUMN "pushName",
DROP COLUMN "remoteJid",
ADD COLUMN     "chatId" TEXT,
ADD COLUMN     "from" TEXT,
ADD COLUMN     "fromName" TEXT,
ADD COLUMN     "mediaFileSize" INTEGER,
ADD COLUMN     "mediaHeight" INTEGER,
ADD COLUMN     "mediaId" TEXT,
ADD COLUMN     "mediaLink" TEXT,
ADD COLUMN     "mediaMimeType" TEXT,
ADD COLUMN     "mediaPreview" TEXT,
ADD COLUMN     "mediaSha256" TEXT,
ADD COLUMN     "mediaWidth" INTEGER,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "timestamp" BIGINT,
ADD COLUMN     "type" TEXT;

-- CreateIndex
CREATE INDEX "WhatsAppMessage_from_idx" ON "WhatsAppMessage"("from");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_type_idx" ON "WhatsAppMessage"("type");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_chatId_idx" ON "WhatsAppMessage"("chatId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_timestamp_idx" ON "WhatsAppMessage"("timestamp");
