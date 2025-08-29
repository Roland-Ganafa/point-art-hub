-- Add stock column to stationery table (calculated as quantity * rate)
ALTER TABLE public.stationery 
ADD COLUMN stock numeric GENERATED ALWAYS AS (quantity::numeric * rate::numeric) STORED;

-- Add index for better performance on stock queries
CREATE INDEX idx_stationery_stock ON public.stationery(stock);

-- Add index for low stock alerts
CREATE INDEX idx_stationery_low_stock ON public.stationery(stock, low_stock_threshold) WHERE stock <= low_stock_threshold;