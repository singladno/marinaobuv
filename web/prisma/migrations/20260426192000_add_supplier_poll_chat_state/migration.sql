-- CreateTable
CREATE TABLE "SupplierPollChatState" (
    "id" TEXT NOT NULL,
    "pollRunId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "lastSupplierInboundAt" TIMESTAMP(3),
    "lastSchedulerFollowupSentAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierPollChatState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupplierPollChatState_pollRunId_chatId_key" ON "SupplierPollChatState"("pollRunId", "chatId");

-- CreateIndex
CREATE INDEX "SupplierPollChatState_pollRunId_idx" ON "SupplierPollChatState"("pollRunId");

-- CreateIndex
CREATE INDEX "SupplierPollChatState_chatId_idx" ON "SupplierPollChatState"("chatId");

-- AddForeignKey
ALTER TABLE "SupplierPollChatState" ADD CONSTRAINT "SupplierPollChatState_pollRunId_fkey" FOREIGN KEY ("pollRunId") REFERENCES "SupplierPollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
