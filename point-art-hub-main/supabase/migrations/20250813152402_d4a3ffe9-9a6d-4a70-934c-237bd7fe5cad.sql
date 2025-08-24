-- Add stock column to gift_store table (calculated as quantity * rate)
ALTER TABLE public.gift_store 
ADD COLUMN stock numeric GENERATED ALWAYS AS (quantity::numeric * rate::numeric) STORED;

-- Add index for better performance on stock queries for gift_store
CREATE INDEX idx_gift_store_stock ON public.gift_store(stock);

-- Add index for low stock alerts for gift_store
CREATE INDEX idx_gift_store_low_stock ON public.gift_store(stock, low_stock_threshold) WHERE stock <= low_stock_threshold;