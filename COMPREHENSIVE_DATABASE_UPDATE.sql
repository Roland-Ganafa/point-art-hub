-- COMPREHENSIVE DATABASE UPDATE SCRIPT
-- Part 1: Fix Stationery Stock and Profit Calculation
-- Part 2: Apply Table Improvements and Schema Updates
-- Part 3: Apply Admin Security Policies

-- ==========================================
-- PART 1: FIX STATIONERY STOCK
-- ==========================================

-- Add stock column if it doesn't exist
ALTER TABLE public.stationery ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0;

-- Add index for better performance on stock column
CREATE INDEX IF NOT EXISTS idx_stationery_stock ON public.stationery(stock);

-- Add low stock threshold index for better performance
CREATE INDEX IF NOT EXISTS idx_stationery_low_stock ON public.stationery(stock, low_stock_threshold) WHERE stock <= low_stock_threshold;

-- Update existing records to ensure stock column has values equal to quantity
UPDATE public.stationery SET stock = quantity WHERE stock = 0 OR stock IS NULL;

-- Ensure the profit calculation function exists and is up to date
CREATE OR REPLACE FUNCTION public.calculate_stationery_profit()
RETURNS TRIGGER AS $$
BEGIN
    NEW.profit_per_unit := COALESCE(NEW.selling_price, 0) - COALESCE(NEW.rate, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the profit calculation trigger exists
DROP TRIGGER IF EXISTS trigger_calculate_stationery_profit ON public.stationery;

CREATE TRIGGER trigger_calculate_stationery_profit
BEFORE INSERT OR UPDATE ON public.stationery
FOR EACH ROW
EXECUTE FUNCTION public.calculate_stationery_profit();

-- ==========================================
-- PART 2: TABLE IMPROVEMENTS
-- ==========================================

-- Add indexes for better performance on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_stationery_item ON public.stationery(item);
CREATE INDEX IF NOT EXISTS idx_gift_store_item ON public.gift_store(item);
CREATE INDEX IF NOT EXISTS idx_embroidery_date ON public.embroidery(date);
CREATE INDEX IF NOT EXISTS idx_machines_date ON public.machines(date);
CREATE INDEX IF NOT EXISTS idx_art_services_date ON public.art_services(date);

-- Add description column to stationery table if it doesn't exist
ALTER TABLE public.stationery 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add description column to gift_store table if it doesn't exist
ALTER TABLE public.gift_store 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add indexes for better performance on date columns
CREATE INDEX IF NOT EXISTS idx_stationery_date ON public.stationery(date);
CREATE INDEX IF NOT EXISTS idx_gift_store_date ON public.gift_store(date);

-- Add a new column for tracking last modified by user
ALTER TABLE public.stationery ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.gift_store ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.embroidery ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.art_services ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

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

-- Add a new table for product categories
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


-- ==========================================
-- PART 3: ADMIN SECURITY POLICIES
-- ==========================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the is_admin function to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Grant permissions for product_categories
GRANT ALL ON public.product_categories TO authenticated;

-- ----------------------------------------------------------------
-- PROFILES POLICY
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admins can delete profiles" 
ON public.profiles FOR DELETE 
TO authenticated 
USING (is_admin());

-- ----------------------------------------------------------------
-- STATIONERY POLICY
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can insert stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated users can update stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated users can delete stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated update access" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated delete access" ON public.stationery;

-- Insert: Allow authenticated users (staff)
CREATE POLICY "Authenticated users can insert stationery" 
ON public.stationery FOR INSERT 
TO authenticated WITH CHECK (true);

-- Update: Allow authenticated users
CREATE POLICY "Authenticated users can update stationery" 
ON public.stationery FOR UPDATE 
TO authenticated 
USING (true);

-- Delete: ONLY ADMINS
CREATE POLICY "Authenticated users can delete stationery" 
ON public.stationery FOR DELETE 
TO authenticated 
USING (is_admin());

-- ----------------------------------------------------------------
-- GIFT STORE POLICY
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can update gift_store" ON public.gift_store;
DROP POLICY IF EXISTS "Authenticated users can delete gift_store" ON public.gift_store;

CREATE POLICY "Authenticated users can update gift_store" 
ON public.gift_store FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete gift_store" 
ON public.gift_store FOR DELETE 
TO authenticated 
USING (is_admin());

-- ----------------------------------------------------------------
-- EMBROIDERY POLICY
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can update embroidery" ON public.embroidery;
DROP POLICY IF EXISTS "Authenticated users can delete embroidery" ON public.embroidery;

CREATE POLICY "Authenticated users can update embroidery" 
ON public.embroidery FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete embroidery" 
ON public.embroidery FOR DELETE 
TO authenticated 
USING (is_admin());

-- ----------------------------------------------------------------
-- MACHINES POLICY
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can update machines" ON public.machines;
DROP POLICY IF EXISTS "Authenticated users can delete machines" ON public.machines;

CREATE POLICY "Authenticated users can update machines" 
ON public.machines FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete machines" 
ON public.machines FOR DELETE 
TO authenticated 
USING (is_admin());

-- ----------------------------------------------------------------
-- ART SERVICES POLICY
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can update art_services" ON public.art_services;
DROP POLICY IF EXISTS "Authenticated users can delete art_services" ON public.art_services;

CREATE POLICY "Authenticated users can update art_services" 
ON public.art_services FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete art_services" 
ON public.art_services FOR DELETE 
TO authenticated 
USING (is_admin());

-- ----------------------------------------------------------------
-- PRODUCT CATEGORIES POLICY
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view product_categories" ON public.product_categories;
DROP POLICY IF EXISTS "Authenticated users can insert product_categories" ON public.product_categories;
DROP POLICY IF EXISTS "Authenticated users can update product_categories" ON public.product_categories;
DROP POLICY IF EXISTS "Authenticated users can delete product_categories" ON public.product_categories;

CREATE POLICY "Anyone can view product_categories" 
ON public.product_categories FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert product_categories" 
ON public.product_categories FOR INSERT 
TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update product_categories" 
ON public.product_categories FOR UPDATE 
TO authenticated USING (is_admin());

CREATE POLICY "Authenticated users can delete product_categories" 
ON public.product_categories FOR DELETE 
TO authenticated USING (is_admin());


-- Notify completion
DO $$
BEGIN
    RAISE NOTICE '✅ Comprehensive database update completed successfully!';
    RAISE NOTICE '📋 Includes:';
    RAISE NOTICE '   • Stationery stock fix';
    RAISE NOTICE '   • New columns and indexes';
    RAISE NOTICE '   • Product categories table';
    RAISE NOTICE '   • STRICT ADMIN SECURITY policies';
END
$$;
