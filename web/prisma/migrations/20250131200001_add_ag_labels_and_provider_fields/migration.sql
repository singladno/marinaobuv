-- AlterTable
ALTER TABLE "Product" ADD COLUMN "agLabels" JSONB;

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN "link" TEXT;
ALTER TABLE "Provider" ADD COLUMN "location" TEXT;

-- CreateIndex
CREATE INDEX "Provider_link_idx" ON "Provider"("link");
