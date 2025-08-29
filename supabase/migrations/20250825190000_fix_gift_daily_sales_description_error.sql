-- Fix for gift_daily_sales table schema issue
-- This migration removes the description column that's causing errors

-- Check if the description column exists and drop it if it does
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'gift_daily_sales' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.gift_daily_sales DROP COLUMN IF EXISTS description;
  END IF;
END $$;

-- Make sure the sold_by column exists
ALTER TABLE public.gift_daily_sales 
ADD COLUMN IF NOT EXISTS sold_by UUID REFERENCES public.profiles(id);

-- Ensure the item column exists and is NOT NULL
ALTER TABLE public.gift_daily_sales 
ALTER COLUMN item SET NOT NULL;