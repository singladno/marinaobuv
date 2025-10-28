-- CreateTable
CREATE TABLE "OrderTransportOption" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "transportId" TEXT NOT NULL,
    "transportName" TEXT NOT NULL,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderTransportOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderTransportOption_orderId_idx" ON "OrderTransportOption"("orderId");

-- CreateIndex
CREATE INDEX "OrderTransportOption_transportId_idx" ON "OrderTransportOption"("transportId");

-- AddForeignKey
ALTER TABLE "OrderTransportOption" ADD CONSTRAINT "OrderTransportOption_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
