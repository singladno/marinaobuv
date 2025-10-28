-- Create sequence for order numbers starting from 10000
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 10000;

-- Create function to get next order number (numbers only, no ORD prefix)
CREATE OR REPLACE FUNCTION get_next_order_number() RETURNS TEXT AS $$
BEGIN
    RETURN nextval('order_number_seq')::TEXT;
END;
$$ LANGUAGE plpgsql;
