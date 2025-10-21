-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PROVIDER', 'GRUZCHIK', 'CLIENT');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE', 'UNISEX');

-- CreateEnum
CREATE TYPE "Season" AS ENUM ('SPRING', 'SUMMER', 'AUTUMN', 'WINTER');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 500,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "article" TEXT,
    "categoryId" TEXT NOT NULL,
    "pricePair" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "packPairs" INTEGER,
    "priceBox" INTEGER,
    "material" TEXT,
    "gender" "Gender",
    "season" "Season",
    "description" TEXT,
    "availabilityCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT,
    "alt" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,
    "width" INTEGER,
    "height" INTEGER,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSize" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "perBox" INTEGER,
    "stock" INTEGER,
    "sku" TEXT,

    CONSTRAINT "ProductSize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "place" TEXT,
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
    "pricePair" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "packPairs" INTEGER,
    "priceBox" INTEGER,
    "material" TEXT,
    "gender" "Gender",
    "season" "Season",
    "description" TEXT,
    "sizes" JSONB,
    "providerDiscount" INTEGER,
    "rawGptResponse" JSONB,
    "gptRequest" TEXT,
    "rawGptResponse2" JSONB,
    "gptRequest2" TEXT,
    "source" JSONB,
    "color" TEXT,
    "categoryId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
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
    "mimeType" TEXT,
    "sha256" TEXT,
    "alt" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isFalseImage" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaDraftProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppMessage" (
    "id" TEXT NOT NULL,
    "waMessageId" TEXT NOT NULL,
    "from" TEXT,
    "type" TEXT,
    "source" TEXT,
    "chatId" TEXT,
    "fromMe" BOOLEAN NOT NULL DEFAULT false,
    "fromName" TEXT,
    "timestamp" BIGINT,
    "mediaId" TEXT,
    "mediaWidth" INTEGER,
    "mediaHeight" INTEGER,
    "mediaSha256" TEXT,
    "mediaPreview" TEXT,
    "mediaFileSize" INTEGER,
    "mediaMimeType" TEXT,
    "text" TEXT,
    "mediaS3Key" TEXT,
    "mediaUrl" TEXT,
    "providerId" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "rawPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "draftProductId" TEXT,

    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL,
    "providerId" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_path_key" ON "Category"("path");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_season_idx" ON "Product"("season");

-- CreateIndex
CREATE INDEX "Product_pricePair_idx" ON "Product"("pricePair");

-- CreateIndex
CREATE UNIQUE INDEX "ProductImage_key_key" ON "ProductImage"("key");

-- CreateIndex
CREATE INDEX "ProductImage_productId_sort_idx" ON "ProductImage"("productId", "sort");

-- CreateIndex
CREATE INDEX "ProductSize_size_idx" ON "ProductSize"("size");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSize_productId_size_key" ON "ProductSize"("productId", "size");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_name_key" ON "Provider"("name");

-- CreateIndex
CREATE INDEX "Provider_name_idx" ON "Provider"("name");

-- CreateIndex
CREATE INDEX "Provider_phone_idx" ON "Provider"("phone");

-- CreateIndex
CREATE INDEX "Provider_place_idx" ON "Provider"("place");

-- CreateIndex
CREATE UNIQUE INDEX "WaDraftProduct_messageId_key" ON "WaDraftProduct"("messageId");

-- CreateIndex
CREATE INDEX "WaDraftProduct_providerId_idx" ON "WaDraftProduct"("providerId");

-- CreateIndex
CREATE INDEX "WaDraftProduct_status_idx" ON "WaDraftProduct"("status");

-- CreateIndex
CREATE INDEX "WaDraftProduct_createdAt_idx" ON "WaDraftProduct"("createdAt");

-- CreateIndex
CREATE INDEX "WaDraftProduct_categoryId_idx" ON "WaDraftProduct"("categoryId");

-- CreateIndex
CREATE INDEX "WaDraftProduct_isDeleted_idx" ON "WaDraftProduct"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "WaDraftProductImage_key_key" ON "WaDraftProductImage"("key");

-- CreateIndex
CREATE INDEX "WaDraftProductImage_draftProductId_sort_idx" ON "WaDraftProductImage"("draftProductId", "sort");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppMessage_waMessageId_key" ON "WhatsAppMessage"("waMessageId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_createdAt_idx" ON "WhatsAppMessage"("createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_from_idx" ON "WhatsAppMessage"("from");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_type_idx" ON "WhatsAppMessage"("type");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_fromMe_idx" ON "WhatsAppMessage"("fromMe");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_chatId_idx" ON "WhatsAppMessage"("chatId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_timestamp_idx" ON "WhatsAppMessage"("timestamp");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_providerId_idx" ON "WhatsAppMessage"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_providerId_idx" ON "User"("providerId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSize" ADD CONSTRAINT "ProductSize_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaDraftProduct" ADD CONSTRAINT "WaDraftProduct_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "WhatsAppMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaDraftProduct" ADD CONSTRAINT "WaDraftProduct_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaDraftProduct" ADD CONSTRAINT "WaDraftProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaDraftProductImage" ADD CONSTRAINT "WaDraftProductImage_draftProductId_fkey" FOREIGN KEY ("draftProductId") REFERENCES "WaDraftProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
