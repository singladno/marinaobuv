-- AlterTable
ALTER TABLE "ProductImage"
ADD COLUMN     "key" TEXT,
ADD COLUMN     "width" INTEGER,
ADD COLUMN     "height" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ProductImage_key_key" ON "ProductImage"("key");

