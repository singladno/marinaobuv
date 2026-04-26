-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('WRONG_SIZE', 'WRONG_ITEM', 'AGREE_REPLACEMENT');

-- CreateTable
CREATE TABLE "OrderItemFeedback" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feedbackType" "FeedbackType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "refusalReason" TEXT,

    CONSTRAINT "OrderItemFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderItemFeedback_orderItemId_idx" ON "OrderItemFeedback"("orderItemId");

-- CreateIndex
CREATE INDEX "OrderItemFeedback_userId_idx" ON "OrderItemFeedback"("userId");

-- AddForeignKey
ALTER TABLE "OrderItemFeedback" ADD CONSTRAINT "OrderItemFeedback_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderItemFeedback" ADD CONSTRAINT "OrderItemFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
