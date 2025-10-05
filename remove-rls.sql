-- Remove RLS Completely from All Tables
-- This script completely removes Row Level Security from all tables in the system

-- 1. Disable RLS on all tables that exist in the system
ALTER TABLE public.stationery DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_store DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.embroidery DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.art_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Check if customers table exists before trying to disable RLS on it
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Check if customer_transactions table exists before trying to disable RLS on it
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_transactions') THEN
    ALTER TABLE public.customer_transactions DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Check if gift_daily_sales table exists before trying to disable RLS on it
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gift_daily_sales') THEN
    ALTER TABLE public.gift_daily_sales DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Check if stationery_daily_sales table exists before trying to disable RLS on it
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stationery_daily_sales') THEN
    ALTER TABLE public.stationery_daily_sales DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Check if audit_log table exists before trying to disable RLS on it
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_log') THEN
    ALTER TABLE public.audit_log DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 2. Drop ALL existing policies
-- Stationery policies
DROP POLICY IF EXISTS "Anyone can view stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated users can insert stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated users can update stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated users can delete stationery" ON public.stationery;
DROP POLICY IF EXISTS "Public read access" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated insert access" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated update access" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated delete access" ON public.stationery;

-- Gift store policies
DROP POLICY IF EXISTS "Anyone can view gift_store" ON public.gift_store;
DROP POLICY IF EXISTS "Authenticated users can insert gift_store" ON public.gift_store;
DROP POLICY IF EXISTS "Authenticated users can update gift_store" ON public.gift_store;
DROP POLICY IF EXISTS "Authenticated users can delete gift_store" ON public.gift_store;
DROP POLICY IF EXISTS "Public read access" ON public.gift_store;
DROP POLICY IF EXISTS "Authenticated insert access" ON public.gift_store;
DROP POLICY IF EXISTS "Authenticated update access" ON public.gift_store;
DROP POLICY IF EXISTS "Authenticated delete access" ON public.gift_store;

-- Embroidery policies
DROP POLICY IF EXISTS "Anyone can view embroidery" ON public.embroidery;
DROP POLICY IF EXISTS "Authenticated users can insert embroidery" ON public.embroidery;
DROP POLICY IF EXISTS "Authenticated users can update embroidery" ON public.embroidery;
DROP POLICY IF EXISTS "Authenticated users can delete embroidery" ON public.embroidery;
DROP POLICY IF EXISTS "Public read access" ON public.embroidery;
DROP POLICY IF EXISTS "Authenticated insert access" ON public.embroidery;
DROP POLICY IF EXISTS "Authenticated update access" ON public.embroidery;
DROP POLICY IF EXISTS "Authenticated delete access" ON public.embroidery;

-- Machines policies
DROP POLICY IF EXISTS "Anyone can view machines" ON public.machines;
DROP POLICY IF EXISTS "Authenticated users can insert machines" ON public.machines;
DROP POLICY IF EXISTS "Authenticated users can update machines" ON public.machines;
DROP POLICY IF EXISTS "Authenticated users can delete machines" ON public.machines;
DROP POLICY IF EXISTS "Public read access" ON public.machines;
DROP POLICY IF EXISTS "Authenticated insert access" ON public.machines;
DROP POLICY IF EXISTS "Authenticated update access" ON public.machines;
DROP POLICY IF EXISTS "Authenticated delete access" ON public.machines;

-- Art services policies
DROP POLICY IF EXISTS "Anyone can view art_services" ON public.art_services;
DROP POLICY IF EXISTS "Authenticated users can insert art_services" ON public.art_services;
DROP POLICY IF EXISTS "Authenticated users can update art_services" ON public.art_services;
DROP POLICY IF EXISTS "Authenticated users can delete art_services" ON public.art_services;
DROP POLICY IF EXISTS "Public read access" ON public.art_services;
DROP POLICY IF EXISTS "Authenticated insert access" ON public.art_services;
DROP POLICY IF EXISTS "Authenticated update access" ON public.art_services;
DROP POLICY IF EXISTS "Authenticated delete access" ON public.art_services;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Conditional policy drops for tables that might not exist
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    DROP POLICY IF EXISTS "Anyone can view customers" ON public.customers;
    DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
    DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
    DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_transactions') THEN
    DROP POLICY IF EXISTS "Anyone can view customer_transactions" ON public.customer_transactions;
    DROP POLICY IF EXISTS "Authenticated users can insert customer_transactions" ON public.customer_transactions;
    DROP POLICY IF EXISTS "Authenticated users can update customer_transactions" ON public.customer_transactions;
    DROP POLICY IF EXISTS "Authenticated users can delete customer_transactions" ON public.customer_transactions;
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gift_daily_sales') THEN
    DROP POLICY IF EXISTS "Anyone can view gift_daily_sales" ON public.gift_daily_sales;
    DROP POLICY IF EXISTS "Authenticated users can insert gift_daily_sales" ON public.gift_daily_sales;
    DROP POLICY IF EXISTS "Authenticated users can update gift_daily_sales" ON public.gift_daily_sales;
    DROP POLICY IF EXISTS "Authenticated users can delete gift_daily_sales" ON public.gift_daily_sales;
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stationery_daily_sales') THEN
    DROP POLICY IF EXISTS "Anyone can view stationery_daily_sales" ON public.stationery_daily_sales;
    DROP POLICY IF EXISTS "Authenticated users can insert stationery_daily_sales" ON public.stationery_daily_sales;
    DROP POLICY IF EXISTS "Authenticated users can update stationery_daily_sales" ON public.stationery_daily_sales;
    DROP POLICY IF EXISTS "Authenticated users can delete stationery_daily_sales" ON public.stationery_daily_sales;
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_log') THEN
    DROP POLICY IF EXISTS "Anyone can view audit_log" ON public.audit_log;
    DROP POLICY IF EXISTS "Authenticated users can insert audit_log" ON public.audit_log;
    DROP POLICY IF EXISTS "Authenticated users can update audit_log" ON public.audit_log;
    DROP POLICY IF EXISTS "Authenticated users can delete audit_log" ON public.audit_log;
  END IF;
END $$;

-- 3. Notify completion
SELECT '✅ RLS completely removed from all existing tables!' as message;
SELECT '📋 All Row Level Security policies have been disabled and dropped' as message;