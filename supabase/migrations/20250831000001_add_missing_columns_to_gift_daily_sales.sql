-- Add missing columns to gift_daily_sales table to match the required structure
-- Adding description and sold_by columns

ALTER TABLE public.gift_daily_sales 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.gift_daily_sales 
ADD COLUMN IF NOT EXISTS sold_by UUID REFERENCES public.profiles(id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gift_daily_sales_sold_by ON public.gift_daily_sales(sold_by);