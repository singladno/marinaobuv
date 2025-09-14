/*
  Warnings:

  - You are about to drop the column `providerId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `fromMe` on the `WhatsAppMessage` table. All the data in the column will be lost.
  - You are about to drop the column `mediaS3Key` on the `WhatsAppMessage` table. All the data in the column will be lost.
  - You are about to drop the column `mediaUrl` on the `WhatsAppMessage` table. All the data in the column will be lost.
  - You are about to drop the column `messageType` on the `WhatsAppMessage` table. All the data in the column will be lost.
  - You are about to drop the column `providerId` on the `WhatsAppMessage` table. All the data in the column will be lost.
  - You are about to drop the column `pushName` on the `WhatsAppMessage` table. All the data in the column will be lost.
  - You are about to drop the column `remoteJid` on the `WhatsAppMessage` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `WhatsAppMessage` table. All the data in the column will be lost.
  - You are about to drop the `ProductDraft` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Provider` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_providerId_fkey";

-- DropForeignKey
ALTER TABLE "ProductDraft" DROP CONSTRAINT "ProductDraft_messageId_fkey";

-- DropForeignKey
ALTER TABLE "WhatsAppMessage" DROP CONSTRAINT "WhatsAppMessage_providerId_fkey";

-- DropIndex
DROP INDEX "Product_providerId_idx";

-- DropIndex
DROP INDEX "WhatsAppMessage_providerId_idx";

-- DropIndex
DROP INDEX "WhatsAppMessage_remoteJid_idx";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "providerId";

-- AlterTable
ALTER TABLE "WhatsAppMessage" DROP COLUMN "fromMe",
DROP COLUMN "mediaS3Key",
DROP COLUMN "mediaUrl",
DROP COLUMN "messageType",
DROP COLUMN "providerId",
DROP COLUMN "pushName",
DROP COLUMN "remoteJid",
DROP COLUMN "text";

-- DropTable
DROP TABLE "ProductDraft";

-- DropTable
DROP TABLE "Provider";
