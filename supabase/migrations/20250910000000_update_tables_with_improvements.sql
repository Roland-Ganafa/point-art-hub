-- Update tables with improvements and additional features
-- This migration adds new columns, indexes, and constraints to improve performance and functionality

-- Add indexes for better performance on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_stationery_item ON public.stationery(item);
CREATE INDEX IF NOT EXISTS idx_gift_store_item ON public.gift_store(item);
CREATE INDEX IF NOT EXISTS idx_embroidery_date ON public.embroidery(date);
CREATE INDEX IF NOT EXISTS idx_machines_date ON public.machines(date);
CREATE INDEX IF NOT EXISTS idx_art_services_date ON public.art_services(date);

-- Add description column to stationery table if it doesn't exist
ALTER TABLE public.stationery 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add description column to gift_store table if it doesn't exist (already exists but ensuring)
ALTER TABLE public.gift_store 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add indexes for better performance on date columns
CREATE INDEX IF NOT EXISTS idx_stationery_date ON public.stationery(date);
CREATE INDEX IF NOT EXISTS idx_gift_store_date ON public.gift_store(date);

-- Add a new column for tracking last modified by user
ALTER TABLE public.stationery 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.gift_store 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.embroidery 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.machines 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.art_services 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

-- Add a status column to track item availability
ALTER TABLE public.stationery 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued'));

ALTER TABLE public.gift_store 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued'));

-- Add a category index for better performance
CREATE INDEX IF NOT EXISTS idx_stationery_status ON public.stationery(status);
CREATE INDEX IF NOT EXISTS idx_gift_store_status ON public.gift_store(status);

-- Add a function to update the updated_by column
CREATE OR REPLACE FUNCTION public.update_updated_by_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set updated_by if the user exists in the profiles table
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()) THEN
    NEW.updated_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_by columns
DROP TRIGGER IF EXISTS update_stationery_updated_by ON public.stationery;
CREATE TRIGGER update_stationery_updated_by 
    BEFORE UPDATE ON public.stationery 
    FOR EACH ROW 
    WHEN (auth.uid() IS NOT NULL)
    EXECUTE FUNCTION public.update_updated_by_column();

DROP TRIGGER IF EXISTS update_gift_store_updated_by ON public.gift_store;
CREATE TRIGGER update_gift_store_updated_by 
    BEFORE UPDATE ON public.gift_store 
    FOR EACH ROW 
    WHEN (auth.uid() IS NOT NULL)
    EXECUTE FUNCTION public.update_updated_by_column();

-- Update existing policies to ensure proper access control
DROP POLICY IF EXISTS "Authenticated users can insert stationery" ON public.stationery;
CREATE POLICY "Authenticated users can insert stationery" 
ON public.stationery FOR INSERT 
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update stationery" ON public.stationery;
CREATE POLICY "Authenticated users can update stationery" 
ON public.stationery FOR UPDATE 
TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete stationery" ON public.stationery;
CREATE POLICY "Authenticated users can delete stationery" 
ON public.stationery FOR DELETE 
TO authenticated USING (true);

-- Add a new table for product categories to improve organization
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  module TEXT NOT NULL CHECK (module IN ('stationery', 'gift_store', 'embroidery', 'machines', 'art_services')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view product_categories" ON public.product_categories;
DROP POLICY IF EXISTS "Authenticated users can insert product_categories" ON public.product_categories;
DROP POLICY IF EXISTS "Authenticated users can update product_categories" ON public.product_categories;
DROP POLICY IF EXISTS "Authenticated users can delete product_categories" ON public.product_categories;

-- Create policies for product_categories
CREATE POLICY "Anyone can view product_categories" 
ON public.product_categories FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert product_categories" 
ON public.product_categories FOR INSERT 
TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update product_categories" 
ON public.product_categories FOR UPDATE 
TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete product_categories" 
ON public.product_categories FOR DELETE 
TO authenticated USING (true);

-- Add indexes for product_categories
CREATE INDEX IF NOT EXISTS idx_product_categories_module ON public.product_categories(module);
CREATE INDEX IF NOT EXISTS idx_product_categories_name ON public.product_categories(name);

-- Create trigger for product_categories updated_at
CREATE OR REPLACE FUNCTION public.update_product_categories_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_product_categories_updated_at ON public.product_categories;
CREATE TRIGGER update_product_categories_updated_at 
    BEFORE UPDATE ON public.product_categories 
    FOR EACH ROW EXECUTE FUNCTION public.update_product_categories_updated_at_column();

-- Add category_id column to link products to categories
ALTER TABLE public.stationery 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.product_categories(id);

ALTER TABLE public.gift_store 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.product_categories(id);

-- Add indexes for category_id columns
CREATE INDEX IF NOT EXISTS idx_stationery_category_id ON public.stationery(category_id);
CREATE INDEX IF NOT EXISTS idx_gift_store_category_id ON public.gift_store(category_id);

-- Grant permissions
GRANT ALL ON public.product_categories TO authenticated;

-- Add a comment to describe the new table
COMMENT ON TABLE public.product_categories IS 'Product categories for organizing inventory items across all modules';

-- Notify completion
DO $$
BEGIN
    RAISE NOTICE '✅ Tables updated successfully with new features and improvements!';
    RAISE NOTICE '📋 Changes include:';
    RAISE NOTICE '   • Added description columns to stationery and gift_store tables';
    RAISE NOTICE '   • Added status tracking for inventory items';
    RAISE NOTICE '   • Added updated_by tracking for audit purposes';
    RAISE NOTICE '   • Created product_categories table for better organization';
    RAISE NOTICE '   • Added multiple indexes for improved query performance';
    RAISE NOTICE '   • Enhanced security policies';
END
$$;