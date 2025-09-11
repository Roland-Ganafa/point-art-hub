-- Improve updated_by handling to prevent foreign key constraint violations
-- This migration enhances the update_updated_by_column function to be more robust

-- Create a more robust function to update the updated_by column
CREATE OR REPLACE FUNCTION public.update_updated_by_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set updated_by if auth.uid() is not null and the user exists in the profiles table
  IF auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()) THEN
    NEW.updated_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-create triggers to ensure they use the updated function
-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_stationery_updated_by ON public.stationery;
DROP TRIGGER IF EXISTS update_gift_store_updated_by ON public.gift_store;
DROP TRIGGER IF EXISTS update_embroidery_updated_by ON public.embroidery;
DROP TRIGGER IF EXISTS update_machines_updated_by ON public.machines;
DROP TRIGGER IF EXISTS update_art_services_updated_by ON public.art_services;

-- Create triggers for updated_by columns
CREATE TRIGGER update_stationery_updated_by 
    BEFORE UPDATE ON public.stationery 
    FOR EACH ROW 
    WHEN (auth.uid() IS NOT NULL)
    EXECUTE FUNCTION public.update_updated_by_column();

CREATE TRIGGER update_gift_store_updated_by 
    BEFORE UPDATE ON public.gift_store 
    FOR EACH ROW 
    WHEN (auth.uid() IS NOT NULL)
    EXECUTE FUNCTION public.update_updated_by_column();

CREATE TRIGGER update_embroidery_updated_by 
    BEFORE UPDATE ON public.embroidery 
    FOR EACH ROW 
    WHEN (auth.uid() IS NOT NULL)
    EXECUTE FUNCTION public.update_updated_by_column();

CREATE TRIGGER update_machines_updated_by 
    BEFORE UPDATE ON public.machines 
    FOR EACH ROW 
    WHEN (auth.uid() IS NOT NULL)
    EXECUTE FUNCTION public.update_updated_by_column();

CREATE TRIGGER update_art_services_updated_by 
    BEFORE UPDATE ON public.art_services 
    FOR EACH ROW 
    WHEN (auth.uid() IS NOT NULL)
    EXECUTE FUNCTION public.update_updated_by_column();

-- Notify completion
DO $$
BEGIN
    RAISE NOTICE '✅ Improved updated_by handling to prevent foreign key constraint violations!';
    RAISE NOTICE '📋 Changes include:';
    RAISE NOTICE '   • Enhanced update_updated_by_column function with profile existence check';
    RAISE NOTICE '   • Re-created all updated_by triggers for consistency';
    RAISE NOTICE '   • Added robust validation to prevent invalid references';
END
$$;