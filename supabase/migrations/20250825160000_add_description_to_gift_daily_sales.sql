-- Add description column to gift_daily_sales table
ALTER TABLE public.gift_daily_sales 
ADD COLUMN IF NOT EXISTS description TEXT;