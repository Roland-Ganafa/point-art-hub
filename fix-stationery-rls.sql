-- Fix for Stationery Table RLS Policies
-- This script ensures the RLS policies are correctly configured

-- First, check current policies
-- SELECT polname, polcmd, polroles, polqual, polwithcheck 
-- FROM pg_policy WHERE polrelid = 'stationery'::regclass;

-- Drop all existing stationery policies
DROP POLICY IF EXISTS "Anyone can view stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated users can insert stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated users can update stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated users can delete stationery" ON public.stationery;

-- Create permissive policies for authenticated users
CREATE POLICY "Anyone can view stationery" 
ON public.stationery 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert stationery" 
ON public.stationery 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update stationery" 
ON public.stationery 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete stationery" 
ON public.stationery 
FOR DELETE 
TO authenticated 
USING (true);

-- Ensure RLS is enabled
ALTER TABLE public.stationery 
ENABLE ROW LEVEL SECURITY;

-- Also ensure the same for gift_store if needed
DROP POLICY IF EXISTS "Anyone can view gift_store" ON public.gift_store;
DROP POLICY IF EXISTS "Authenticated users can insert gift_store" ON public.gift_store;
DROP POLICY IF EXISTS "Authenticated users can update gift_store" ON public.gift_store;
DROP POLICY IF EXISTS "Authenticated users can delete gift_store" ON public.gift_store;

CREATE POLICY "Anyone can view gift_store" 
ON public.gift_store 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert gift_store" 
ON public.gift_store 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update gift_store" 
ON public.gift_store 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete gift_store" 
ON public.gift_store 
FOR DELETE 
TO authenticated 
USING (true);

ALTER TABLE public.gift_store 
ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.stationery TO authenticated;
GRANT ALL ON public.gift_store TO authenticated;

-- Notify completion
SELECT '✅ Stationery RLS policies updated successfully!' as message;
SELECT '📋 Policies created:' as message;
SELECT '   • Anyone can view stationery' as message;
SELECT '   • Authenticated users can insert stationery' as message;
SELECT '   • Authenticated users can update stationery' as message;
SELECT '   • Authenticated users can delete stationery' as message;