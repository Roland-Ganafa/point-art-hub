-- Complete RLS Reset for Stationery and Related Tables
-- This script completely resets and reconfigures RLS policies

-- 1. Disable RLS on all tables first
ALTER TABLE public.stationery DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_store DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.embroidery DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.art_services DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies (handle duplicates)
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

-- 3. Recreate very permissive policies for all tables
-- Stationery policies
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

-- Gift store policies
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

-- Embroidery policies
CREATE POLICY "Public read access" 
ON public.embroidery 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated insert access" 
ON public.embroidery 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated update access" 
ON public.embroidery 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated delete access" 
ON public.embroidery 
FOR DELETE 
TO authenticated 
USING (true);

-- Machines policies
CREATE POLICY "Public read access" 
ON public.machines 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated insert access" 
ON public.machines 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated update access" 
ON public.machines 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated delete access" 
ON public.machines 
FOR DELETE 
TO authenticated 
USING (true);

-- Art services policies
CREATE POLICY "Public read access" 
ON public.art_services 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated insert access" 
ON public.art_services 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated update access" 
ON public.art_services 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated delete access" 
ON public.art_services 
FOR DELETE 
TO authenticated 
USING (true);

-- 4. Re-enable RLS
ALTER TABLE public.stationery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embroidery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.art_services ENABLE ROW LEVEL SECURITY;

-- 5. Grant all necessary permissions
GRANT ALL PRIVILEGES ON TABLE public.stationery TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.gift_store TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.embroidery TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.machines TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.art_services TO authenticated;

-- 6. Notify completion
SELECT '✅ Complete RLS reset applied successfully!' as message;
SELECT '📋 All tables now have permissive policies for authenticated users' as message;