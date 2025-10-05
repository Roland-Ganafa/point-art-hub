-- Check the current status of the stationery table
-- Run this in your Supabase SQL editor

-- 1. Check if stock column exists
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'stationery' 
AND column_name = 'stock';

-- 2. Check all columns
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'stationery'
ORDER BY ordinal_position;

-- 3. Check RLS policies
SELECT 
  polname AS policy_name,
  polcmd AS command_type,
  polroles AS roles,
  polqual AS using_condition,
  polwithcheck AS check_condition
FROM pg_policy 
WHERE polrelid = 'stationery'::regclass;

-- 4. Check if RLS is enabled
SELECT 
  relname,
  relrowsecurity AS rls_enabled
FROM pg_class 
WHERE relname = 'stationery';

-- 5. Test a simple insert (you'll need to be logged in)
-- INSERT INTO public.stationery (item) VALUES ('Test Item');
-- DELETE FROM public.stationery WHERE item = 'Test Item';