-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaDraftProduct" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "article" TEXT,
    "pricePair" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "packPairs" INTEGER,
    "priceBox" INTEGER,
    "material" TEXT,
    "gender" "Gender",
    "season" "Season",
    "description" TEXT,
    "sizes" JSONB,
    "rawGptResponse" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaDraftProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaDraftProductImage" (
    "id" TEXT NOT NULL,
    "draftProductId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT,
    "alt" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaDraftProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Provider_name_key" ON "Provider"("name");

-- CreateIndex
CREATE INDEX "Provider_name_idx" ON "Provider"("name");

-- CreateIndex
CREATE INDEX "Provider_phone_idx" ON "Provider"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "WaDraftProduct_messageId_key" ON "WaDraftProduct"("messageId");

-- CreateIndex
CREATE INDEX "WaDraftProduct_providerId_idx" ON "WaDraftProduct"("providerId");

-- CreateIndex
CREATE INDEX "WaDraftProduct_status_idx" ON "WaDraftProduct"("status");

-- CreateIndex
CREATE INDEX "WaDraftProduct_createdAt_idx" ON "WaDraftProduct"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WaDraftProductImage_key_key" ON "WaDraftProductImage"("key");

-- CreateIndex
CREATE INDEX "WaDraftProductImage_draftProductId_sort_idx" ON "WaDraftProductImage"("draftProductId", "sort");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_providerId_idx" ON "WhatsAppMessage"("providerId");

-- AddForeignKey
ALTER TABLE "WaDraftProduct" ADD CONSTRAINT "WaDraftProduct_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "WhatsAppMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaDraftProduct" ADD CONSTRAINT "WaDraftProduct_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaDraftProductImage" ADD CONSTRAINT "WaDraftProductImage_draftProductId_fkey" FOREIGN KEY ("draftProductId") REFERENCES "WaDraftProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Note: WhatsAppMessage providerId foreign key will be added after data cleanup
