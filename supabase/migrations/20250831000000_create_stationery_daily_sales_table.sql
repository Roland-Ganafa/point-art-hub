-- Create stationery_daily_sales table for tracking daily sales with the required structure

-- First, check if table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'stationery_daily_sales'
    ) THEN
        -- Create the table if it doesn't exist
        CREATE TABLE public.stationery_daily_sales (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          category TEXT NOT NULL,
          item TEXT NOT NULL,
          description TEXT,
          quantity INTEGER NOT NULL CHECK (quantity > 0),
          rate DECIMAL(10,2) NOT NULL CHECK (rate >= 0),
          selling_price DECIMAL(10,2) NOT NULL CHECK (selling_price >= 0),
          profit_per_unit DECIMAL(10,2) NOT NULL,
          total_value DECIMAL(10,2) NOT NULL,
          sold_by UUID REFERENCES public.profiles(id),
          date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        -- Enable Row Level Security
        ALTER TABLE public.stationery_daily_sales ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- Drop policies if they exist and recreate them to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view stationery_daily_sales" ON public.stationery_daily_sales;
DROP POLICY IF EXISTS "Authenticated users can insert stationery_daily_sales" ON public.stationery_daily_sales;
DROP POLICY IF EXISTS "Authenticated users can update stationery_daily_sales" ON public.stationery_daily_sales;
DROP POLICY IF EXISTS "Authenticated users can delete stationery_daily_sales" ON public.stationery_daily_sales;

-- Create policies for stationery_daily_sales
CREATE POLICY "Anyone can view stationery_daily_sales" 
ON public.stationery_daily_sales FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert stationery_daily_sales" 
ON public.stationery_daily_sales FOR INSERT 
TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update stationery_daily_sales" 
ON public.stationery_daily_sales FOR UPDATE 
TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete stationery_daily_sales" 
ON public.stationery_daily_sales FOR DELETE 
TO authenticated USING (true);

-- Create indexes for better performance
DROP INDEX IF EXISTS idx_stationery_daily_sales_date;
DROP INDEX IF EXISTS idx_stationery_daily_sales_sold_by;
DROP INDEX IF EXISTS idx_stationery_daily_sales_category;

CREATE INDEX idx_stationery_daily_sales_date ON public.stationery_daily_sales(date);
CREATE INDEX idx_stationery_daily_sales_sold_by ON public.stationery_daily_sales(sold_by);
CREATE INDEX idx_stationery_daily_sales_category ON public.stationery_daily_sales(category);

-- Create trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_stationery_daily_sales_updated_at ON public.stationery_daily_sales;

CREATE TRIGGER trigger_stationery_daily_sales_updated_at
  BEFORE UPDATE ON public.stationery_daily_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();