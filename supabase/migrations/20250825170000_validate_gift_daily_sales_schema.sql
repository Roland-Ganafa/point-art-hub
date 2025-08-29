-- Validate and ensure gift_daily_sales table has all required columns
-- This migration ensures the schema matches what the application expects

-- Add description column if it doesn't exist
ALTER TABLE public.gift_daily_sales 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add sold_by column if it doesn't exist
ALTER TABLE public.gift_daily_sales 
ADD COLUMN IF NOT EXISTS sold_by UUID REFERENCES public.profiles(id);

-- Ensure all existing columns have correct types
ALTER TABLE public.gift_daily_sales 
ALTER COLUMN date TYPE date USING date::date;

ALTER TABLE public.gift_daily_sales 
ALTER COLUMN item TYPE text;

ALTER TABLE public.gift_daily_sales 
ALTER COLUMN code TYPE text;

ALTER TABLE public.gift_daily_sales 
ALTER COLUMN quantity TYPE integer USING quantity::integer;

ALTER TABLE public.gift_daily_sales 
ALTER COLUMN unit TYPE text;

ALTER TABLE public.gift_daily_sales 
ALTER COLUMN bpx TYPE numeric USING bpx::numeric;

ALTER TABLE public.gift_daily_sales 
ALTER COLUMN spx TYPE numeric USING spx::numeric;

-- Ensure date has a default value
ALTER TABLE public.gift_daily_sales 
ALTER COLUMN date SET DEFAULT CURRENT_DATE;

-- Ensure quantity has a default value
ALTER TABLE public.gift_daily_sales 
ALTER COLUMN quantity SET DEFAULT 1;

-- Ensure unit has a default value
ALTER TABLE public.gift_daily_sales 
ALTER COLUMN unit SET DEFAULT 'Pc';