-- CreateEnum
CREATE TYPE "ProductSource" AS ENUM ('WA', 'AG');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "source" "ProductSource" NOT NULL DEFAULT 'WA';

