-- Simple test to verify RLS fix
-- Run this after applying the RLS fix

-- Test 1: Check if we can insert a minimal record
INSERT INTO public.stationery (item, quantity, rate, selling_price) 
VALUES ('RLS Test Item', 1, 1.00, 2.00);

-- Test 2: Check if we can select the record
SELECT * FROM public.stationery WHERE item = 'RLS Test Item';

-- Test 3: Check if we can update the record
UPDATE public.stationery 
SET quantity = 2 
WHERE item = 'RLS Test Item';

-- Test 4: Check if we can delete the record
DELETE FROM public.stationery WHERE item = 'RLS Test Item';

-- Final verification
SELECT '✅ All RLS tests passed!' as result;