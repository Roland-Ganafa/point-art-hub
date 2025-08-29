-- Fix for gift_daily_sales table schema issues
-- This migration ensures the table has only the required columns for the form to work

-- First, let's get the current table structure
DO $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'gift_daily_sales'
  ) INTO table_exists;

  -- If the table doesn't exist, create it with the correct structure
  IF NOT table_exists THEN
    CREATE TABLE public.gift_daily_sales (
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
    
    -- Enable Row Level Security
    ALTER TABLE public.gift_daily_sales ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Anyone can view gift_daily_sales" 
      ON public.gift_daily_sales 
      FOR SELECT USING (true);
      
    CREATE POLICY "Authenticated users can insert gift_daily_sales" 
      ON public.gift_daily_sales 
      FOR INSERT TO authenticated 
      WITH CHECK (true);
      
    CREATE POLICY "Authenticated users can update gift_daily_sales" 
      ON public.gift_daily_sales 
      FOR UPDATE TO authenticated 
      USING (true);
      
    CREATE POLICY "Authenticated users can delete gift_daily_sales" 
      ON public.gift_daily_sales 
      FOR DELETE TO authenticated 
      USING (true);
      
    -- Create trigger for updated_at
    CREATE TRIGGER update_gift_daily_sales_updated_at 
      BEFORE UPDATE ON public.gift_daily_sales 
      FOR EACH ROW 
      EXECUTE FUNCTION public.update_updated_at_column();
  ELSE
    -- Drop problematic columns if they exist
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'gift_daily_sales' 
      AND column_name = 'description'
    ) THEN
      ALTER TABLE public.gift_daily_sales DROP COLUMN description;
    END IF;
    
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'gift_daily_sales' 
      AND column_name = 'sold_by'
    ) THEN
      ALTER TABLE public.gift_daily_sales DROP COLUMN sold_by;
    END IF;
    
    -- Ensure required columns exist with correct types
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'gift_daily_sales' 
      AND column_name = 'item'
    ) THEN
      ALTER TABLE public.gift_daily_sales ADD COLUMN item text NOT NULL;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'gift_daily_sales' 
      AND column_name = 'code'
    ) THEN
      ALTER TABLE public.gift_daily_sales ADD COLUMN code text;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'gift_daily_sales' 
      AND column_name = 'quantity'
    ) THEN
      ALTER TABLE public.gift_daily_sales ADD COLUMN quantity integer NOT NULL DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'gift_daily_sales' 
      AND column_name = 'unit'
    ) THEN
      ALTER TABLE public.gift_daily_sales ADD COLUMN unit text NOT NULL DEFAULT 'Pc';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'gift_daily_sales' 
      AND column_name = 'bpx'
    ) THEN
      ALTER TABLE public.gift_daily_sales ADD COLUMN bpx numeric NOT NULL;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'gift_daily_sales' 
      AND column_name = 'spx'
    ) THEN
      ALTER TABLE public.gift_daily_sales ADD COLUMN spx numeric NOT NULL;
    END IF;
  END IF;
END $$;