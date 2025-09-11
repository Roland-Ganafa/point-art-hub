-- Create the initialize_stationery_stock function directly
-- Run this in your Supabase SQL editor if the migration didn't apply correctly

-- Function to initialize stock correctly for existing items
CREATE OR REPLACE FUNCTION public.initialize_stationery_stock()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Set stock equal to quantity for all existing items
  -- This fixes the issue where stock was incorrectly calculated as quantity * rate
  UPDATE public.stationery 
  SET stock = quantity;
  
  RAISE NOTICE 'Stationery stock levels initialized successfully';
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.initialize_stationery_stock() TO authenticated;

-- Notify user
SELECT 'Function created successfully. Run SELECT public.initialize_stationery_stock(); to initialize stock levels' as message;