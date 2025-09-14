-- AlterTable
ALTER TABLE "WhatsAppMessage" ADD COLUMN     "fromMe" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mediaS3Key" TEXT,
ADD COLUMN     "mediaUrl" TEXT,
ADD COLUMN     "messageType" TEXT,
ADD COLUMN     "providerId" TEXT,
ADD COLUMN     "pushName" TEXT,
ADD COLUMN     "remoteJid" TEXT,
ADD COLUMN     "text" TEXT;

-- CreateIndex
CREATE INDEX "WhatsAppMessage_remoteJid_idx" ON "WhatsAppMessage"("remoteJid");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_messageType_idx" ON "WhatsAppMessage"("messageType");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_fromMe_idx" ON "WhatsAppMessage"("fromMe");
