-- Convert price fields from kopecks (INT) to rubles (DECIMAL)
-- This migration converts existing price data from kopecks to rubles by dividing by 100

-- First, add new columns with DECIMAL type
ALTER TABLE "Product" ADD COLUMN "pricePairNew" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN "priceBoxNew" DECIMAL(10,2);
ALTER TABLE "WaDraftProduct" ADD COLUMN "pricePairNew" DECIMAL(10,2);
ALTER TABLE "WaDraftProduct" ADD COLUMN "priceBoxNew" DECIMAL(10,2);
ALTER TABLE "WaDraftProduct" ADD COLUMN "providerDiscountNew" DECIMAL(10,2);

-- Convert existing data from kopecks to rubles (divide by 100)
UPDATE "Product" SET "pricePairNew" = "pricePair" / 100.0 WHERE "pricePair" IS NOT NULL;
UPDATE "Product" SET "priceBoxNew" = "priceBox" / 100.0 WHERE "priceBox" IS NOT NULL;
UPDATE "WaDraftProduct" SET "pricePairNew" = "pricePair" / 100.0 WHERE "pricePair" IS NOT NULL;
UPDATE "WaDraftProduct" SET "priceBoxNew" = "priceBox" / 100.0 WHERE "priceBox" IS NOT NULL;
UPDATE "WaDraftProduct" SET "providerDiscountNew" = "providerDiscount" / 100.0 WHERE "providerDiscount" IS NOT NULL;

-- Drop old columns
ALTER TABLE "Product" DROP COLUMN "pricePair";
ALTER TABLE "Product" DROP COLUMN "priceBox";
ALTER TABLE "WaDraftProduct" DROP COLUMN "pricePair";
ALTER TABLE "WaDraftProduct" DROP COLUMN "priceBox";
ALTER TABLE "WaDraftProduct" DROP COLUMN "providerDiscount";

-- Rename new columns to original names
ALTER TABLE "Product" RENAME COLUMN "pricePairNew" TO "pricePair";
ALTER TABLE "Product" RENAME COLUMN "priceBoxNew" TO "priceBox";
ALTER TABLE "WaDraftProduct" RENAME COLUMN "pricePairNew" TO "pricePair";
ALTER TABLE "WaDraftProduct" RENAME COLUMN "priceBoxNew" TO "priceBox";
ALTER TABLE "WaDraftProduct" RENAME COLUMN "providerDiscountNew" TO "providerDiscount";

-- Update column types to DECIMAL
ALTER TABLE "Product" ALTER COLUMN "pricePair" TYPE DECIMAL(10,2);
ALTER TABLE "Product" ALTER COLUMN "priceBox" TYPE DECIMAL(10,2);
ALTER TABLE "WaDraftProduct" ALTER COLUMN "pricePair" TYPE DECIMAL(10,2);
ALTER TABLE "WaDraftProduct" ALTER COLUMN "priceBox" TYPE DECIMAL(10,2);
ALTER TABLE "WaDraftProduct" ALTER COLUMN "providerDiscount" TYPE DECIMAL(10,2);
