-- CreateEnum
CREATE TYPE "MeasurementUnit" AS ENUM ('PAIRS', 'PIECES');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "measurementUnit" "MeasurementUnit" NOT NULL DEFAULT 'PAIRS';

-- Update all existing products to PAIRS (explicit, though default already does this)
UPDATE "Product" SET "measurementUnit" = 'PAIRS' WHERE "measurementUnit" IS NULL;







