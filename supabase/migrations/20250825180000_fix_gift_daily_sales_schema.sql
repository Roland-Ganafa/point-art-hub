-- Comprehensive fix for gift_daily_sales table structure
-- This ensures all columns needed by the application exist with correct types

-- First, check if the table exists and has the basic structure
CREATE TABLE IF NOT EXISTS public.gift_daily_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  item text NOT NULL,
  code text,
  quantity integer NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'Pc',
  bpx numeric NOT NULL,
  spx numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add description column if it doesn't exist
ALTER TABLE public.gift_daily_sales 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add sold_by column if it doesn't exist
ALTER TABLE public.gift_daily_sales 
ADD COLUMN IF NOT EXISTS sold_by UUID REFERENCES public.profiles(id);

-- Ensure all columns have correct types
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

-- Ensure default values are set correctly
ALTER TABLE public.gift_daily_sales 
ALTER COLUMN date SET DEFAULT CURRENT_DATE;

ALTER TABLE public.gift_daily_sales 
ALTER COLUMN quantity SET DEFAULT 1;

ALTER TABLE public.gift_daily_sales 
ALTER COLUMN unit SET DEFAULT 'Pc';

-- Enable Row Level Security if not already enabled
ALTER TABLE public.gift_daily_sales ENABLE ROW LEVEL SECURITY;

-- Ensure policies exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'gift_daily_sales' 
    AND policyname = 'Anyone can view gift_daily_sales'
  ) THEN
    CREATE POLICY "Anyone can view gift_daily_sales"
    ON public.gift_daily_sales
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'gift_daily_sales' 
    AND policyname = 'Authenticated users can insert gift_daily_sales'
  ) THEN
    CREATE POLICY "Authenticated users can insert gift_daily_sales"
    ON public.gift_daily_sales
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'gift_daily_sales' 
    AND policyname = 'Authenticated users can update gift_daily_sales'
  ) THEN
    CREATE POLICY "Authenticated users can update gift_daily_sales"
    ON public.gift_daily_sales
    FOR UPDATE
    TO authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'gift_daily_sales' 
    AND policyname = 'Authenticated users can delete gift_daily_sales'
  ) THEN
    CREATE POLICY "Authenticated users can delete gift_daily_sales"
    ON public.gift_daily_sales
    FOR DELETE
    TO authenticated
    USING (true);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gift_daily_sales_date ON public.gift_daily_sales(date);
CREATE INDEX IF NOT EXISTS idx_gift_daily_sales_sold_by ON public.gift_daily_sales(sold_by);

-- Ensure the update trigger exists
DROP TRIGGER IF EXISTS update_gift_daily_sales_updated_at ON public.gift_daily_sales;
CREATE TRIGGER update_gift_daily_sales_updated_at
BEFORE UPDATE ON public.gift_daily_sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();