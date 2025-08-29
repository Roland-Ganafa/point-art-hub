-- Create stationery_sales table for tracking daily sales
CREATE TABLE IF NOT EXISTS public.stationery_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.stationery(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  selling_price DECIMAL(10,2) NOT NULL CHECK (selling_price >= 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  profit DECIMAL(10,2) NOT NULL,
  sold_by UUID REFERENCES public.profiles(id),
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.stationery_sales ENABLE ROW LEVEL SECURITY;

-- Create policies for stationery_sales
CREATE POLICY "Anyone can view stationery_sales" 
ON public.stationery_sales FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert stationery_sales" 
ON public.stationery_sales FOR INSERT 
TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update stationery_sales" 
ON public.stationery_sales FOR UPDATE 
TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete stationery_sales" 
ON public.stationery_sales FOR DELETE 
TO authenticated USING (true);

-- Create indexes for better performance
CREATE INDEX idx_stationery_sales_item_id ON public.stationery_sales(item_id);
CREATE INDEX idx_stationery_sales_date ON public.stationery_sales(date);
CREATE INDEX idx_stationery_sales_sold_by ON public.stationery_sales(sold_by);

-- Create trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_stationery_sales_updated_at
  BEFORE UPDATE ON public.stationery_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();