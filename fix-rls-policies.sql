-- Fix for RLS policies on stationery table
-- This script updates the RLS policies to be more permissive for authenticated users

-- First, let's check the current policies
-- SELECT * FROM pg_policy WHERE polrelid = 'stationery'::regclass;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated users can insert stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated users can update stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated users can delete stationery" ON public.stationery;

-- Create more permissive policies
CREATE POLICY "Anyone can view stationery" 
ON public.stationery FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert stationery" 
ON public.stationery FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update stationery" 
ON public.stationery FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete stationery" 
ON public.stationery FOR DELETE 
TO authenticated 
USING (true);

-- Ensure RLS is enabled
ALTER TABLE public.stationery ENABLE ROW LEVEL SECURITY;

-- Also fix gift_store policies if needed
DROP POLICY IF EXISTS "Anyone can view gift_store" ON public.gift_store;
DROP POLICY IF EXISTS "Authenticated users can insert gift_store" ON public.gift_store;
DROP POLICY IF EXISTS "Authenticated users can update gift_store" ON public.gift_store;
DROP POLICY IF EXISTS "Authenticated users can delete gift_store" ON public.gift_store;

CREATE POLICY "Anyone can view gift_store" 
ON public.gift_store FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert gift_store" 
ON public.gift_store FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update gift_store" 
ON public.gift_store FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete gift_store" 
ON public.gift_store FOR DELETE 
TO authenticated 
USING (true);

ALTER TABLE public.gift_store ENABLE ROW LEVEL SECURITY;

-- Notify completion
SELECT '✅ RLS policies updated successfully!' as message;