-- CreateTable
CREATE TABLE "WhatsAppChat" (
    "chatId" TEXT NOT NULL,
    "name" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppChat_pkey" PRIMARY KEY ("chatId")
);
