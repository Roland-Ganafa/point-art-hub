-- Targeted RLS Fix for Stationery Table
-- This is a more direct approach to fix the RLS policy issue

-- First, completely disable and re-enable RLS to reset it
ALTER TABLE public.stationery DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stationery ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated users can insert stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated users can update stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated users can delete stationery" ON public.stationery;

-- Create very permissive policies
CREATE POLICY "Public read access" 
ON public.stationery 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated insert access" 
ON public.stationery 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated update access" 
ON public.stationery 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated delete access" 
ON public.stationery 
FOR DELETE 
TO authenticated 
USING (true);

-- Also fix gift_store for consistency
DROP POLICY IF EXISTS "Anyone can view gift_store" ON public.gift_store;
DROP POLICY IF EXISTS "Authenticated users can insert gift_store" ON public.gift_store;
DROP POLICY IF EXISTS "Authenticated users can update gift_store" ON public.gift_store;
DROP POLICY IF EXISTS "Authenticated users can delete gift_store" ON public.gift_store;

CREATE POLICY "Public read access" 
ON public.gift_store 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated insert access" 
ON public.gift_store 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated update access" 
ON public.gift_store 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated delete access" 
ON public.gift_store 
FOR DELETE 
TO authenticated 
USING (true);

-- Grant all permissions to authenticated users
GRANT ALL PRIVILEGES ON TABLE public.stationery TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.gift_store TO authenticated;

-- Notify completion
SELECT '✅ Targeted RLS policies applied successfully!' as message;
SELECT '📋 Applied policies:' as message;
SELECT '   • Public read access' as message;
SELECT '   • Authenticated insert access' as message;
SELECT '   • Authenticated update access' as message;
SELECT '   • Authenticated delete access' as message;