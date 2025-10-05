-- Point Art Hub Database Setup Script (Safe Version)
-- Run this script in your new Supabase project's SQL Editor
-- This version handles existing types and tables gracefully

-- =============================================================================
-- 1. CREATE ENUMS (IF NOT EXISTS)
-- =============================================================================

-- Create enum for frequency
DO $$ BEGIN
    CREATE TYPE public.frequency_type AS ENUM ('daily', 'weekly', 'monthly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for gift store categories
DO $$ BEGIN
    CREATE TYPE public.gift_category AS ENUM ('cleaning', 'kids_toys', 'birthday', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for machine types
DO $$ BEGIN
    CREATE TYPE public.machine_type AS ENUM ('printer', 'copier', 'scanner', 'binder', 'laminator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for user roles
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- 2. CREATE PROFILES TABLE (IF NOT EXISTS)
-- =============================================================================

-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role public.user_role DEFAULT 'user',
  sales_initials TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 3. CREATE INVENTORY TABLES (IF NOT EXISTS)
-- =============================================================================

-- Create stationery table
CREATE TABLE IF NOT EXISTS public.stationery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item TEXT NOT NULL,
  category TEXT,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  rate DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  selling_price DECIMAL(10,2) NOT NULL,
  profit_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  sales DECIMAL(10,2) DEFAULT 0,
  sold_by UUID REFERENCES public.profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create gift_store table
CREATE TABLE IF NOT EXISTS public.gift_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item TEXT NOT NULL,
  category gift_category NOT NULL DEFAULT 'custom',
  custom_category TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  rate DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  selling_price DECIMAL(10,2) DEFAULT 0,
  profit_per_unit DECIMAL(10,2) DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  sales DECIMAL(10,2) DEFAULT 0,
  sold_by UUID REFERENCES public.profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create embroidery table
CREATE TABLE IF NOT EXISTS public.embroidery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_description TEXT NOT NULL,
  quotation DECIMAL(10,2) NOT NULL,
  deposit DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) GENERATED ALWAYS AS (quotation - COALESCE(deposit, 0)) STORED,
  quantity INTEGER NOT NULL DEFAULT 1,
  rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  expenditure DECIMAL(10,2) NOT NULL DEFAULT 0,
  profit DECIMAL(10,2) GENERATED ALWAYS AS (quotation - expenditure) STORED,
  sales DECIMAL(10,2) GENERATED ALWAYS AS (quotation) STORED,
  done_by UUID REFERENCES public.profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create machines table
CREATE TABLE IF NOT EXISTS public.machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_name machine_type NOT NULL,
  service_description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  rate DECIMAL(10,2) NOT NULL,
  expenditure DECIMAL(10,2) NOT NULL DEFAULT 0,
  sales DECIMAL(10,2) GENERATED ALWAYS AS (quantity * rate) STORED,
  done_by UUID REFERENCES public.profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create art_services table
CREATE TABLE IF NOT EXISTS public.art_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  rate DECIMAL(10,2) NOT NULL,
  quotation DECIMAL(10,2) GENERATED ALWAYS AS (quantity * rate) STORED,
  deposit DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) GENERATED ALWAYS AS ((quantity * rate) - COALESCE(deposit, 0)) STORED,
  expenditure DECIMAL(10,2) NOT NULL DEFAULT 0,
  sales DECIMAL(10,2) GENERATED ALWAYS AS (quantity * rate) STORED,
  profit DECIMAL(10,2) GENERATED ALWAYS AS ((quantity * rate) - expenditure) STORED,
  done_by UUID REFERENCES public.profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================================================
-- 4. CREATE SALES TRACKING TABLES (IF NOT EXISTS)
-- =============================================================================

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

-- Create gift_daily_sales table
CREATE TABLE IF NOT EXISTS public.gift_daily_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  item TEXT NOT NULL,
  code TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'pcs',
  bpx DECIMAL(10,2) NOT NULL,
  spx DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.stationery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embroidery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.art_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stationery_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_daily_sales ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 6. CREATE SECURITY POLICIES
-- =============================================================================

-- Stationery policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated users can insert stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated users can update stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated users can delete stationery" ON public.stationery;

-- Stationery policies
CREATE POLICY "Anyone can view stationery" ON public.stationery FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert stationery" ON public.stationery FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update stationery" ON public.stationery FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete stationery" ON public.stationery FOR DELETE TO authenticated USING (true);

-- Gift store policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view gift_store" ON public.gift_store;
DROP POLICY IF EXISTS "Authenticated users can insert gift_store" ON public.gift_store;
DROP POLICY IF EXISTS "Authenticated users can update gift_store" ON public.gift_store;
DROP POLICY IF EXISTS "Authenticated users can delete gift_store" ON public.gift_store;

-- Gift store policies
CREATE POLICY "Anyone can view gift_store" ON public.gift_store FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert gift_store" ON public.gift_store FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update gift_store" ON public.gift_store FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete gift_store" ON public.gift_store FOR DELETE TO authenticated USING (true);

-- Embroidery policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view embroidery" ON public.embroidery;
DROP POLICY IF EXISTS "Authenticated users can insert embroidery" ON public.embroidery;
DROP POLICY IF EXISTS "Authenticated users can update embroidery" ON public.embroidery;
DROP POLICY IF EXISTS "Authenticated users can delete embroidery" ON public.embroidery;

-- Embroidery policies
CREATE POLICY "Anyone can view embroidery" ON public.embroidery FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert embroidery" ON public.embroidery FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update embroidery" ON public.embroidery FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete embroidery" ON public.embroidery FOR DELETE TO authenticated USING (true);

-- Machines policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view machines" ON public.machines;
DROP POLICY IF EXISTS "Authenticated users can insert machines" ON public.machines;
DROP POLICY IF EXISTS "Authenticated users can update machines" ON public.machines;
DROP POLICY IF EXISTS "Authenticated users can delete machines" ON public.machines;

-- Machines policies
CREATE POLICY "Anyone can view machines" ON public.machines FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert machines" ON public.machines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update machines" ON public.machines FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete machines" ON public.machines FOR DELETE TO authenticated USING (true);

-- Art services policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view art_services" ON public.art_services;
DROP POLICY IF EXISTS "Authenticated users can insert art_services" ON public.art_services;
DROP POLICY IF EXISTS "Authenticated users can update art_services" ON public.art_services;
DROP POLICY IF EXISTS "Authenticated users can delete art_services" ON public.art_services;

-- Art services policies
CREATE POLICY "Anyone can view art_services" ON public.art_services FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert art_services" ON public.art_services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update art_services" ON public.art_services FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete art_services" ON public.art_services FOR DELETE TO authenticated USING (true);

-- Stationery sales policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view stationery_sales" ON public.stationery_sales;
DROP POLICY IF EXISTS "Authenticated users can insert stationery_sales" ON public.stationery_sales;
DROP POLICY IF EXISTS "Authenticated users can update stationery_sales" ON public.stationery_sales;
DROP POLICY IF EXISTS "Authenticated users can delete stationery_sales" ON public.stationery_sales;

-- Stationery sales policies
CREATE POLICY "Anyone can view stationery_sales" ON public.stationery_sales FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert stationery_sales" ON public.stationery_sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update stationery_sales" ON public.stationery_sales FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete stationery_sales" ON public.stationery_sales FOR DELETE TO authenticated USING (true);

-- Gift daily sales policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view gift_daily_sales" ON public.gift_daily_sales;
DROP POLICY IF EXISTS "Authenticated users can insert gift_daily_sales" ON public.gift_daily_sales;
DROP POLICY IF EXISTS "Authenticated users can update gift_daily_sales" ON public.gift_daily_sales;
DROP POLICY IF EXISTS "Authenticated users can delete gift_daily_sales" ON public.gift_daily_sales;

-- Gift daily sales policies
CREATE POLICY "Anyone can view gift_daily_sales" ON public.gift_daily_sales FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert gift_daily_sales" ON public.gift_daily_sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update gift_daily_sales" ON public.gift_daily_sales FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete gift_daily_sales" ON public.gift_daily_sales FOR DELETE TO authenticated USING (true);

-- =============================================================================
-- 7. CREATE FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stationery_updated_at ON public.stationery;
CREATE TRIGGER update_stationery_updated_at 
    BEFORE UPDATE ON public.stationery 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gift_store_updated_at ON public.gift_store;
CREATE TRIGGER update_gift_store_updated_at 
    BEFORE UPDATE ON public.gift_store 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_embroidery_updated_at ON public.embroidery;
CREATE TRIGGER update_embroidery_updated_at 
    BEFORE UPDATE ON public.embroidery 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_machines_updated_at ON public.machines;
CREATE TRIGGER update_machines_updated_at 
    BEFORE UPDATE ON public.machines 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_art_services_updated_at ON public.art_services;
CREATE TRIGGER update_art_services_updated_at 
    BEFORE UPDATE ON public.art_services 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stationery_sales_updated_at ON public.stationery_sales;
CREATE TRIGGER update_stationery_sales_updated_at 
    BEFORE UPDATE ON public.stationery_sales 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gift_daily_sales_updated_at ON public.gift_daily_sales;
CREATE TRIGGER update_gift_daily_sales_updated_at 
    BEFORE UPDATE ON public.gift_daily_sales 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 8. FINISH
-- =============================================================================

-- Success message (commented out as RAISE NOTICE is not supported in all environments)
-- Point Art Hub database setup completed successfully!
-- You can now create your first user through the application sign-up page.
-- The first user will automatically be assigned admin privileges.

-- Note: Schema cache refresh has been removed due to pg_notify compatibility issues.
-- You may need to refresh your Supabase dashboard manually after running this script.