-- Fix gift_daily_sales table by recreating it without the description column
-- This is a simple approach that avoids schema cache issues

-- Drop and recreate the table with the correct columns
DROP TABLE IF EXISTS gift_daily_sales;

CREATE TABLE gift_daily_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  item TEXT NOT NULL,
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