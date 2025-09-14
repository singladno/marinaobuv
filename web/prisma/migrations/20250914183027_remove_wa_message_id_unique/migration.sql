-- DropIndex
DROP INDEX "WhatsAppMessage_waMessageId_key";

-- AlterTable
ALTER TABLE "WhatsAppMessage" ALTER COLUMN "waMessageId" DROP NOT NULL;
