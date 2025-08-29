-- Ensure the gift_daily_sales table has the sold_by column
DO $$
BEGIN
  -- Check if the sold_by column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'gift_daily_sales' 
    AND column_name = 'sold_by'
  ) THEN
    -- Add the sold_by column if it doesn't exist
    ALTER TABLE public.gift_daily_sales 
    ADD COLUMN sold_by UUID REFERENCES public.profiles(id);
  END IF;

  -- Also make sure the description column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'gift_daily_sales' 
    AND column_name = 'description'
  ) THEN
    -- Add the description column if it doesn't exist
    ALTER TABLE public.gift_daily_sales 
    ADD COLUMN description TEXT;
  END IF;
END $$;