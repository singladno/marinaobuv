-- Create sequence for order item codes starting from 1
CREATE SEQUENCE IF NOT EXISTS order_item_code_seq START 1;

-- Create function to get next order item code
CREATE OR REPLACE FUNCTION get_next_order_item_id() RETURNS TEXT AS $$
BEGIN
    RETURN nextval('order_item_code_seq')::TEXT;
END;
$$ LANGUAGE plpgsql;
