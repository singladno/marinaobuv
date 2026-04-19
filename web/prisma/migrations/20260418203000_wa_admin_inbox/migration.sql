-- CreateTable
CREATE TABLE "WaAdminChat" (
    "chatId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "contactName" TEXT,
    "chatType" TEXT NOT NULL DEFAULT 'user',
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastPreview" TEXT,
    "lastWaMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaAdminChat_pkey" PRIMARY KEY ("chatId")
);

-- CreateTable
CREATE TABLE "WaAdminMessage" (
    "id" TEXT NOT NULL,
    "waMessageId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "typeMessage" TEXT,
    "textMessage" TEXT,
    "caption" TEXT,
    "senderName" TEXT,
    "senderId" TEXT,
    "isFromMe" BOOLEAN NOT NULL DEFAULT false,
    "statusMessage" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaAdminMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaAdminChatReadState" (
    "userId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "lastReadMessageTs" BIGINT NOT NULL DEFAULT 0,
    "lastReadWaMessageId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaAdminChatReadState_pkey" PRIMARY KEY ("userId","chatId")
);

-- CreateIndex
CREATE INDEX "WaAdminChat_lastActivityAt_idx" ON "WaAdminChat"("lastActivityAt");

-- CreateIndex
CREATE UNIQUE INDEX "WaAdminMessage_waMessageId_key" ON "WaAdminMessage"("waMessageId");

-- CreateIndex
CREATE INDEX "WaAdminMessage_chatId_timestamp_idx" ON "WaAdminMessage"("chatId", "timestamp");

-- CreateIndex
CREATE INDEX "WaAdminChatReadState_userId_idx" ON "WaAdminChatReadState"("userId");

-- AddForeignKey
ALTER TABLE "WaAdminMessage" ADD CONSTRAINT "WaAdminMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "WaAdminChat"("chatId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaAdminChatReadState" ADD CONSTRAINT "WaAdminChatReadState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaAdminChatReadState" ADD CONSTRAINT "WaAdminChatReadState_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "WaAdminChat"("chatId") ON DELETE CASCADE ON UPDATE CASCADE;
