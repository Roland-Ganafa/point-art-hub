-- Fix invalid updated_by references in inventory tables
-- This migration will clear any updated_by values that don't correspond to valid profiles

-- Fix stationery table
UPDATE public.stationery 
SET updated_by = NULL 
WHERE updated_by IS NOT NULL 
AND updated_by NOT IN (SELECT id FROM public.profiles);

-- Fix gift_store table
UPDATE public.gift_store 
SET updated_by = NULL 
WHERE updated_by IS NOT NULL 
AND updated_by NOT IN (SELECT id FROM public.profiles);

-- Fix embroidery table
UPDATE public.embroidery 
SET updated_by = NULL 
WHERE updated_by IS NOT NULL 
AND updated_by NOT IN (SELECT id FROM public.profiles);

-- Fix machines table
UPDATE public.machines 
SET updated_by = NULL 
WHERE updated_by IS NOT NULL 
AND updated_by NOT IN (SELECT id FROM public.profiles);

-- Fix art_services table
UPDATE public.art_services 
SET updated_by = NULL 
WHERE updated_by IS NOT NULL 
AND updated_by NOT IN (SELECT id FROM public.profiles);

-- Notify completion
DO $$
BEGIN
    RAISE NOTICE '✅ Fixed invalid updated_by references in all inventory tables!';
    RAISE NOTICE '📋 Changes include:';
    RAISE NOTICE '   • Cleared invalid updated_by values in stationery table';
    RAISE NOTICE '   • Cleared invalid updated_by values in gift_store table';
    RAISE NOTICE '   • Cleared invalid updated_by values in embroidery table';
    RAISE NOTICE '   • Cleared invalid updated_by values in machines table';
    RAISE NOTICE '   • Cleared invalid updated_by values in art_services table';
END
$$;