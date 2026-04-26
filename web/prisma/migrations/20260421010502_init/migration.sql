/*
  Warnings:

  - The values [UNISEX] on the enum `Gender` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[analysisBatchId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[colorBatchId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ReplacementStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterEnum
BEGIN;
CREATE TYPE "Gender_new" AS ENUM ('FEMALE', 'MALE');
ALTER TABLE "Product" ALTER COLUMN "gender" TYPE "Gender_new" USING ("gender"::text::"Gender_new");
ALTER TABLE "WaDraftProduct" ALTER COLUMN "gender" TYPE "Gender_new" USING ("gender"::text::"Gender_new");
ALTER TYPE "Gender" RENAME TO "Gender_old";
ALTER TYPE "Gender_new" RENAME TO "Gender";
DROP TYPE "Gender_old";
COMMIT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "seoCanonical" TEXT,
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoH1" TEXT,
ADD COLUMN     "seoIntroHtml" TEXT,
ADD COLUMN     "seoNoindex" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "seoTitle" TEXT,
ADD COLUMN     "seoUpdatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "comment" TEXT,
ALTER COLUMN "status" SET DEFAULT 'Новый';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "isAvailable" BOOLEAN;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "activeUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "analysisBatchId" TEXT,
ADD COLUMN     "batchProcessingStatus" TEXT DEFAULT 'pending',
ADD COLUMN     "colorBatchId" TEXT,
ADD COLUMN     "gptRequest" TEXT,
ADD COLUMN     "gptResponse" TEXT,
ADD COLUMN     "providerId" TEXT,
ALTER COLUMN "buyPrice" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email" TEXT,
ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "image" TEXT,
ADD COLUMN     "label" TEXT,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3),
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WaDraftProduct" ADD COLUMN     "gptResponse1" JSONB,
ADD COLUMN     "gptResponse2" JSONB;

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "OrderItemMessage" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT,
    "isService" BOOLEAN NOT NULL DEFAULT false,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItemMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItemMessageRead" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItemMessageRead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MigrationHistory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MigrationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GptBatchJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "batchId" TEXT,
    "inputFileId" TEXT,
    "outputFileId" TEXT,
    "totalRequests" INTEGER DEFAULT 0,
    "completed" INTEGER DEFAULT 0,
    "failed" INTEGER DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GptBatchJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchHistory" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItemReplacement" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "replacementImageUrl" TEXT,
    "replacementImageKey" TEXT,
    "status" "ReplacementStatus" NOT NULL DEFAULT 'PENDING',
    "adminComment" TEXT,
    "clientComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItemReplacement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookStatus" (
    "id" TEXT NOT NULL,
    "isConnected" BOOLEAN NOT NULL,
    "lastCheck" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "errorMessage" TEXT,
    "instanceStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "OrderItemMessage_orderItemId_idx" ON "OrderItemMessage"("orderItemId");

-- CreateIndex
CREATE INDEX "OrderItemMessage_userId_idx" ON "OrderItemMessage"("userId");

-- CreateIndex
CREATE INDEX "OrderItemMessage_createdAt_idx" ON "OrderItemMessage"("createdAt");

-- CreateIndex
CREATE INDEX "OrderItemMessageRead_messageId_idx" ON "OrderItemMessageRead"("messageId");

-- CreateIndex
CREATE INDEX "OrderItemMessageRead_userId_idx" ON "OrderItemMessageRead"("userId");

-- CreateIndex
CREATE INDEX "OrderItemMessageRead_readAt_idx" ON "OrderItemMessageRead"("readAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItemMessageRead_messageId_userId_key" ON "OrderItemMessageRead"("messageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MigrationHistory_name_key" ON "MigrationHistory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GptBatchJob_batchId_key" ON "GptBatchJob"("batchId");

-- CreateIndex
CREATE INDEX "GptBatchJob_status_idx" ON "GptBatchJob"("status");

-- CreateIndex
CREATE INDEX "GptBatchJob_type_idx" ON "GptBatchJob"("type");

-- CreateIndex
CREATE INDEX "SearchHistory_userId_idx" ON "SearchHistory"("userId");

-- CreateIndex
CREATE INDEX "SearchHistory_query_idx" ON "SearchHistory"("query");

-- CreateIndex
CREATE INDEX "SearchHistory_createdAt_idx" ON "SearchHistory"("createdAt");

-- CreateIndex
CREATE INDEX "OrderItemReplacement_orderItemId_idx" ON "OrderItemReplacement"("orderItemId");

-- CreateIndex
CREATE INDEX "OrderItemReplacement_adminUserId_idx" ON "OrderItemReplacement"("adminUserId");

-- CreateIndex
CREATE INDEX "OrderItemReplacement_clientUserId_idx" ON "OrderItemReplacement"("clientUserId");

-- CreateIndex
CREATE INDEX "WebhookStatus_lastCheck_idx" ON "WebhookStatus"("lastCheck");

-- CreateIndex
CREATE INDEX "WebhookStatus_isConnected_idx" ON "WebhookStatus"("isConnected");

-- CreateIndex
CREATE UNIQUE INDEX "Product_analysisBatchId_key" ON "Product"("analysisBatchId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_colorBatchId_key" ON "Product"("colorBatchId");

-- CreateIndex
CREATE INDEX "Product_activeUpdatedAt_idx" ON "Product"("activeUpdatedAt");

-- CreateIndex
CREATE INDEX "Product_providerId_idx" ON "Product"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemMessage" ADD CONSTRAINT "OrderItemMessage_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemMessage" ADD CONSTRAINT "OrderItemMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemMessageRead" ADD CONSTRAINT "OrderItemMessageRead_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "OrderItemMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemMessageRead" ADD CONSTRAINT "OrderItemMessageRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchHistory" ADD CONSTRAINT "SearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemReplacement" ADD CONSTRAINT "OrderItemReplacement_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemReplacement" ADD CONSTRAINT "OrderItemReplacement_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemReplacement" ADD CONSTRAINT "OrderItemReplacement_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
