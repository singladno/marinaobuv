-- Recalculate order totals for all existing orders
-- This fixes orders that were created with incorrect total calculations
-- The new calculation correctly sums priceBox * qty for all non-refused items

-- Update all orders with recalculated totals
-- Exclude items that have been refused (WRONG_SIZE or WRONG_ITEM feedback)
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
