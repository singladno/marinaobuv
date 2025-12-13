-- Recalculate priceBox for all order items based on product sizes
-- This fixes order items that were created with incorrect priceBox calculations
-- The new calculation correctly sums all pairs from sizes: pricePair * SUM(count from all sizes)

-- Function to calculate total pairs from JSON sizes array
CREATE OR REPLACE FUNCTION calculate_total_pairs_from_sizes(sizes_json JSONB) RETURNS INTEGER AS $$
DECLARE
  total_pairs INTEGER := 0;
  size_item JSONB;
BEGIN
  -- If sizes is null or not an array, return 1 (default)
  IF sizes_json IS NULL OR jsonb_typeof(sizes_json) != 'array' THEN
    RETURN 1;
  END IF;

  -- Iterate through sizes array and sum up count values
  FOR size_item IN SELECT * FROM jsonb_array_elements(sizes_json)
  LOOP
    -- Try to get count from different possible field names
    total_pairs := total_pairs + COALESCE(
      (size_item->>'count')::INTEGER,
      (size_item->>'quantity')::INTEGER,
      (size_item->>'stock')::INTEGER,
      (size_item->>'qty')::INTEGER,
      0
    );
  END LOOP;

  -- If no pairs found, default to 1
  RETURN GREATEST(total_pairs, 1);
END;
$$ LANGUAGE plpgsql;

-- Update priceBox for all order items
UPDATE "OrderItem" oi
SET "priceBox" = (
  SELECT
    CAST(p."pricePair" AS DECIMAL) * calculate_total_pairs_from_sizes(p."sizes"::JSONB)
  FROM "Product" p
  WHERE p."id" = oi."productId"
)
WHERE EXISTS (
  SELECT 1
  FROM "Product" p
  WHERE p."id" = oi."productId"
    AND p."sizes" IS NOT NULL
);

-- Recalculate order totals after updating priceBox
UPDATE "Order" o
SET
  "total" = COALESCE(
    (
      SELECT SUM(CAST(oi."priceBox" AS DECIMAL) * oi."qty")
      FROM "OrderItem" oi
      WHERE oi."orderId" = o."id"
        AND NOT EXISTS (
          SELECT 1
          FROM "OrderItemFeedback" oif
          WHERE oif."orderItemId" = oi."id"
            AND oif."feedbackType" IN ('WRONG_SIZE', 'WRONG_ITEM')
        )
    ),
    0
  ),
  "subtotal" = COALESCE(
    (
      SELECT SUM(CAST(oi."priceBox" AS DECIMAL) * oi."qty")
      FROM "OrderItem" oi
      WHERE oi."orderId" = o."id"
        AND NOT EXISTS (
          SELECT 1
          FROM "OrderItemFeedback" oif
          WHERE oif."orderItemId" = oi."id"
            AND oif."feedbackType" IN ('WRONG_SIZE', 'WRONG_ITEM')
        )
    ),
    0
  )
WHERE EXISTS (
  SELECT 1
  FROM "OrderItem" oi
  WHERE oi."orderId" = o."id"
);

-- Drop the helper function as it's no longer needed
DROP FUNCTION IF EXISTS calculate_total_pairs_from_sizes(JSONB);














