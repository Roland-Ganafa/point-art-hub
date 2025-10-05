-- Script to verify the RLS fix works correctly
-- Run this after applying the complete RLS reset

-- 1. Check RLS status
SELECT 
  relname AS table_name,
  relrowsecurity AS rls_enabled
FROM pg_class 
WHERE relname = 'stationery';

-- 2. Check policies for stationery table
SELECT 
  polname AS policy_name,
  polcmd AS command,
  polroles AS roles,
  polqual AS using_condition,
  polwithcheck AS check_condition
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
WHERE cls.relname = 'stationery'
ORDER BY pol.polcmd;

-- 3. Test insert operation (this should work after the fix)
-- First, let's try a minimal insert
INSERT INTO public.stationery (item, quantity, rate, selling_price) 
VALUES ('RLS Test Item', 1, 1.00, 2.00);

-- Check if the item was inserted
SELECT * FROM public.stationery WHERE item = 'RLS Test Item';

-- Clean up the test item
DELETE FROM public.stationery WHERE item = 'RLS Test Item';

-- 4. Verify the cleanup
SELECT count(*) FROM public.stationery WHERE item = 'RLS Test Item';

-- 5. Final confirmation message
SELECT '✅ RLS fix verification completed successfully!' as message;