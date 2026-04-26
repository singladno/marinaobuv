-- CreateEnum
CREATE TYPE "SupplierPollMode" AS ENUM ('STOCK_ONLY', 'STOCK_AND_INVOICE');

CREATE TYPE "SupplierPollRunStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');

CREATE TYPE "SupplierPollWaKind" AS ENUM ('OUT_IMAGE', 'OUT_QUESTION', 'OUT_FOLLOWUP_REPLACEMENT');

-- CreateTable
CREATE TABLE "SupplierPollRun" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "mode" "SupplierPollMode" NOT NULL,
    "status" "SupplierPollRunStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierPollRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierPollWaMessage" (
    "id" TEXT NOT NULL,
    "waMessageId" TEXT NOT NULL,
    "pollRunId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "kind" "SupplierPollWaKind" NOT NULL,
    "orderItemId" TEXT,
    "orderItemIdsJson" JSONB,
    "sequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SupplierPollWaMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierPollGptTrigger" (
    "id" TEXT NOT NULL,
    "pollRunId" TEXT NOT NULL,
    "triggerWaMessageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierPollGptTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupplierPollWaMessage_waMessageId_key" ON "SupplierPollWaMessage"("waMessageId");

CREATE INDEX "SupplierPollWaMessage_pollRunId_chatId_idx" ON "SupplierPollWaMessage"("pollRunId", "chatId");

CREATE INDEX "SupplierPollWaMessage_chatId_idx" ON "SupplierPollWaMessage"("chatId");

CREATE INDEX "SupplierPollWaMessage_pollRunId_idx" ON "SupplierPollWaMessage"("pollRunId");

CREATE UNIQUE INDEX "SupplierPollGptTrigger_pollRunId_triggerWaMessageId_key" ON "SupplierPollGptTrigger"("pollRunId", "triggerWaMessageId");

CREATE INDEX "SupplierPollGptTrigger_pollRunId_idx" ON "SupplierPollGptTrigger"("pollRunId");

CREATE INDEX "SupplierPollRun_orderId_idx" ON "SupplierPollRun"("orderId");

CREATE INDEX "SupplierPollRun_status_idx" ON "SupplierPollRun"("status");

CREATE INDEX "SupplierPollRun_createdAt_idx" ON "SupplierPollRun"("createdAt");

-- AddForeignKey
ALTER TABLE "SupplierPollRun" ADD CONSTRAINT "SupplierPollRun_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupplierPollRun" ADD CONSTRAINT "SupplierPollRun_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupplierPollWaMessage" ADD CONSTRAINT "SupplierPollWaMessage_pollRunId_fkey" FOREIGN KEY ("pollRunId") REFERENCES "SupplierPollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupplierPollWaMessage" ADD CONSTRAINT "SupplierPollWaMessage_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupplierPollWaMessage" ADD CONSTRAINT "SupplierPollWaMessage_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SupplierPollGptTrigger" ADD CONSTRAINT "SupplierPollGptTrigger_pollRunId_fkey" FOREIGN KEY ("pollRunId") REFERENCES "SupplierPollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
