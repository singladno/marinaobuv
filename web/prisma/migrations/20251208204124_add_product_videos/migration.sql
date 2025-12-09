-- CreateTable
CREATE TABLE "ProductVideo" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT,
    "alt" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProductVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductVideo_key_key" ON "ProductVideo"("key");

-- CreateIndex
CREATE INDEX "ProductVideo_productId_sort_idx" ON "ProductVideo"("productId", "sort");

-- AddForeignKey
ALTER TABLE "ProductVideo" ADD CONSTRAINT "ProductVideo_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;


