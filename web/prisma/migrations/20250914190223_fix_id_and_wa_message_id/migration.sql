/*
  Warnings:

  - A unique constraint covering the columns `[waMessageId]` on the table `WhatsAppMessage` will be added. If there are existing duplicate values, this will fail.
  - Made the column `waMessageId` on table `WhatsAppMessage` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "WhatsAppMessage" ALTER COLUMN "waMessageId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppMessage_waMessageId_key" ON "WhatsAppMessage"("waMessageId");
