-- Add missing columns to gift_daily_sales table to match the required structure
-- Adding description and sold_by columns

-- First, let's check if the table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'gift_daily_sales'
    ) THEN
        -- Create the table if it doesn't exist
        CREATE TABLE public.gift_daily_sales (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            item TEXT NOT NULL,
            code TEXT,
            quantity INTEGER NOT NULL DEFAULT 1,
            unit TEXT NOT NULL DEFAULT 'Pc',
            bpx DECIMAL(10,2) NOT NULL,
            spx DECIMAL(10,2) NOT NULL,
            date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- Enable Row Level Security
        ALTER TABLE public.gift_daily_sales ENABLE ROW LEVEL SECURITY;
        
        -- Create basic policies
        CREATE POLICY "Anyone can view gift_daily_sales" 
        ON public.gift_daily_sales FOR SELECT USING (true);
        
        CREATE POLICY "Authenticated users can insert gift_daily_sales" 
        ON public.gift_daily_sales FOR INSERT 
        TO authenticated WITH CHECK (true);
        
        CREATE POLICY "Authenticated users can update gift_daily_sales" 
        ON public.gift_daily_sales FOR UPDATE 
        TO authenticated USING (true);
        
        CREATE POLICY "Authenticated users can delete gift_daily_sales" 
        ON public.gift_daily_sales FOR DELETE 
        TO authenticated USING (true);
    END IF;
END
$$;

-- Now add the missing columns if they don't exist
ALTER TABLE public.gift_daily_sales 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.gift_daily_sales 
ADD COLUMN IF NOT EXISTS sold_by UUID REFERENCES public.profiles(id);

-- Add indexes for better performance
DROP INDEX IF EXISTS idx_gift_daily_sales_sold_by;
CREATE INDEX idx_gift_daily_sales_sold_by ON public.gift_daily_sales(sold_by);

-- Create or replace trigger function for updating the updated_at column
CREATE OR REPLACE FUNCTION public.update_gift_daily_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_gift_daily_sales_updated_at ON public.gift_daily_sales;
CREATE TRIGGER trigger_gift_daily_sales_updated_at
  BEFORE UPDATE ON public.gift_daily_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gift_daily_sales_updated_at();