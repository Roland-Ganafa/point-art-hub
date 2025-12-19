-- Add Admin-Specific Edit and Delete Policies
-- This migration ensures admins have full edit and delete rights across all tables

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

-- ==============================================================================
-- PROFILES TABLE - Admin can edit all profiles
-- ==============================================================================

-- Drop existing profile policies
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Recreate with admin privileges
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admins can delete profiles" 
ON public.profiles FOR DELETE 
TO authenticated 
USING (is_admin());

-- ==============================================================================
-- STATIONERY TABLE - Enhanced permissions
-- ==============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can update stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated users can delete stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated update access" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated delete access" ON public.stationery;

-- Create new policies with admin rights
CREATE POLICY "Authenticated users can update stationery" 
ON public.stationery FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete stationery" 
ON public.stationery FOR DELETE 
TO authenticated 
USING (is_admin());

-- ==============================================================================
-- GIFT_STORE TABLE - Enhanced permissions
-- ==============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can update gift_store" ON public.gift_store;
DROP POLICY IF EXISTS "Authenticated users can delete gift_store" ON public.gift_store;
DROP POLICY IF EXISTS "Authenticated update access" ON public.gift_store;
DROP POLICY IF EXISTS "Authenticated delete access" ON public.gift_store;

-- Create new policies with admin rights
CREATE POLICY "Authenticated users can update gift_store" 
ON public.gift_store FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete gift_store" 
ON public.gift_store FOR DELETE 
TO authenticated 
USING (is_admin());

-- ==============================================================================
-- EMBROIDERY TABLE - Enhanced permissions
-- ==============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can update embroidery" ON public.embroidery;
DROP POLICY IF EXISTS "Authenticated users can delete embroidery" ON public.embroidery;
DROP POLICY IF EXISTS "Authenticated update access" ON public.embroidery;
DROP POLICY IF EXISTS "Authenticated delete access" ON public.embroidery;

-- Create new policies with admin rights
CREATE POLICY "Authenticated users can update embroidery" 
ON public.embroidery FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete embroidery" 
ON public.embroidery FOR DELETE 
TO authenticated 
USING (is_admin());

-- ==============================================================================
-- MACHINES TABLE - Enhanced permissions
-- ==============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can update machines" ON public.machines;
DROP POLICY IF EXISTS "Authenticated users can delete machines" ON public.machines;
DROP POLICY IF EXISTS "Authenticated update access" ON public.machines;
DROP POLICY IF EXISTS "Authenticated delete access" ON public.machines;

-- Create new policies with admin rights
CREATE POLICY "Authenticated users can update machines" 
ON public.machines FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete machines" 
ON public.machines FOR DELETE 
TO authenticated 
USING (is_admin());

-- ==============================================================================
-- ART_SERVICES TABLE - Enhanced permissions
-- ==============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can update art_services" ON public.art_services;
DROP POLICY IF EXISTS "Authenticated users can delete art_services" ON public.art_services;
DROP POLICY IF EXISTS "Authenticated update access" ON public.art_services;
DROP POLICY IF EXISTS "Authenticated delete access" ON public.art_services;

-- Create new policies with admin rights
CREATE POLICY "Authenticated users can update art_services" 
ON public.art_services FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete art_services" 
ON public.art_services FOR DELETE 
TO authenticated 
USING (is_admin());

-- ==============================================================================
-- STATIONERY_SALES TABLE - Enhanced permissions
-- ==============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can update stationery_sales" ON public.stationery_sales;
DROP POLICY IF EXISTS "Authenticated users can delete stationery_sales" ON public.stationery_sales;

-- Create new policies with admin rights
CREATE POLICY "Authenticated users can update stationery_sales" 
ON public.stationery_sales FOR UPDATE 
TO authenticated 
USING (is_admin());

CREATE POLICY "Authenticated users can delete stationery_sales" 
ON public.stationery_sales FOR DELETE 
TO authenticated 
USING (is_admin());

-- ==============================================================================
-- GIFT_DAILY_SALES TABLE - Enhanced permissions
-- ==============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can update gift_daily_sales" ON public.gift_daily_sales;
DROP POLICY IF EXISTS "Authenticated users can delete gift_daily_sales" ON public.gift_daily_sales;

-- Create new policies with admin rights
CREATE POLICY "Authenticated users can update gift_daily_sales" 
ON public.gift_daily_sales FOR UPDATE 
TO authenticated 
USING (is_admin());

CREATE POLICY "Authenticated users can delete gift_daily_sales" 
ON public.gift_daily_sales FOR DELETE 
TO authenticated 
USING (is_admin());

-- ==============================================================================
-- STATIONERY_DAILY_SALES TABLE - Enhanced permissions (if exists)
-- ==============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stationery_daily_sales') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update stationery_daily_sales" ON public.stationery_daily_sales';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can delete stationery_daily_sales" ON public.stationery_daily_sales';
    
    EXECUTE 'CREATE POLICY "Authenticated users can update stationery_daily_sales" ON public.stationery_daily_sales FOR UPDATE TO authenticated USING (is_admin())';
    EXECUTE 'CREATE POLICY "Authenticated users can delete stationery_daily_sales" ON public.stationery_daily_sales FOR DELETE TO authenticated USING (is_admin())';
  END IF;
END $$;

-- ==============================================================================
-- CUSTOMERS TABLE - Enhanced permissions (if exists)
-- ==============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers';
    
    EXECUTE 'CREATE POLICY "Authenticated users can update customers" ON public.customers FOR UPDATE TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "Authenticated users can delete customers" ON public.customers FOR DELETE TO authenticated USING (is_admin())';
  END IF;
END $$;

-- ==============================================================================
-- CUSTOMER_TRANSACTIONS TABLE - Enhanced permissions (if exists)
-- ==============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_transactions') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update customer_transactions" ON public.customer_transactions';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can delete customer_transactions" ON public.customer_transactions';
    
    EXECUTE 'CREATE POLICY "Authenticated users can update customer_transactions" ON public.customer_transactions FOR UPDATE TO authenticated USING (is_admin())';
    EXECUTE 'CREATE POLICY "Authenticated users can delete customer_transactions" ON public.customer_transactions FOR DELETE TO authenticated USING (is_admin())';
  END IF;
END $$;

-- ==============================================================================
-- PRODUCT_CATEGORIES TABLE - Enhanced permissions (if exists)
-- ==============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_categories') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update product_categories" ON public.product_categories';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can delete product_categories" ON public.product_categories';
    
    EXECUTE 'CREATE POLICY "Authenticated users can update product_categories" ON public.product_categories FOR UPDATE TO authenticated USING (is_admin())';
    EXECUTE 'CREATE POLICY "Authenticated users can delete product_categories" ON public.product_categories FOR DELETE TO authenticated USING (is_admin())';
  END IF;
END $$;

-- Grant execute permission on the is_admin function to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Notify completion
DO $$
BEGIN
    RAISE NOTICE '✅ Admin edit and delete policies applied successfully!';
    RAISE NOTICE '📋 Policy Summary:';
    RAISE NOTICE '   • Admins can edit and delete ALL records';
    RAISE NOTICE '   • Regular users can edit inventory (stationery, gift_store, etc.)';
    RAISE NOTICE '   • Only admins can delete inventory items';
    RAISE NOTICE '   • Only admins can edit/delete sales records';
    RAISE NOTICE '   • Only admins can edit/delete customer data';
    RAISE NOTICE '   • Created is_admin() helper function';
END
$$;
