-- Ensure gift_daily_sales has description column
ALTER TABLE public.gift_daily_sales ADD COLUMN IF NOT EXISTS description TEXT;

-- Index for date for better performance
CREATE INDEX IF NOT EXISTS idx_gift_daily_sales_date ON public.gift_daily_sales(date);
