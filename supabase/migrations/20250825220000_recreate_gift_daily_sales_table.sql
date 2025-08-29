-- Final fix for gift_daily_sales table
-- This script completely recreates the table with the correct structure

-- First, check if the table exists
DO $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'gift_daily_sales'
  ) INTO table_exists;

  -- If the table exists, drop it (this is a last resort fix)
  IF table_exists THEN
    -- First, back up the data if there's any
    CREATE TABLE IF NOT EXISTS gift_daily_sales_backup AS
    SELECT * FROM gift_daily_sales;
    
    -- Then drop the problematic table
    DROP TABLE gift_daily_sales;
  END IF;
  
  -- Create the table with the correct structure
  CREATE TABLE gift_daily_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    item TEXT NOT NULL,
    description TEXT,
    code TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'Pc',
    bpx NUMERIC NOT NULL,
    spx NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
  
  -- Enable RLS
  ALTER TABLE gift_daily_sales ENABLE ROW LEVEL SECURITY;
  
  -- Create policies
  CREATE POLICY "Anyone can view gift_daily_sales" 
    ON gift_daily_sales 
    FOR SELECT USING (true);
    
  CREATE POLICY "Authenticated users can insert gift_daily_sales" 
    ON gift_daily_sales 
    FOR INSERT TO authenticated 
    WITH CHECK (true);
    
  CREATE POLICY "Authenticated users can update gift_daily_sales" 
    ON gift_daily_sales 
    FOR UPDATE TO authenticated 
    USING (true);
    
  CREATE POLICY "Authenticated users can delete gift_daily_sales" 
    ON gift_daily_sales 
    FOR DELETE TO authenticated 
    USING (true);
    
  -- Create trigger for updated_at
  CREATE TRIGGER update_gift_daily_sales_updated_at 
    BEFORE UPDATE ON gift_daily_sales 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();
    
  -- Try to restore data if there was any
  IF table_exists THEN
    INSERT INTO gift_daily_sales (
      id, date, item, description, code, quantity, unit, bpx, spx, created_at, updated_at
    )
    SELECT 
      id, 
      date, 
      item, 
      description,
      code, 
      quantity, 
      unit, 
      bpx, 
      spx, 
      created_at, 
      updated_at
    FROM gift_daily_sales_backup;
    
    -- Keep the backup table for reference
  END IF;
END $$;