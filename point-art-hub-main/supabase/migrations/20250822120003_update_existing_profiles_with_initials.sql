-- Update existing profiles that don't have sales_initials assigned
-- This will trigger the assign_sales_initials function for existing users

UPDATE public.profiles 
SET full_name = full_name 
WHERE sales_initials IS NULL AND full_name IS NOT NULL;

-- Ensure all users have sales initials for the dropdown to work
-- If any profiles still don't have initials, assign them manually
UPDATE public.profiles 
SET sales_initials = 
  CASE 
    WHEN sales_initials IS NULL THEN 
      UPPER(LEFT(full_name, 1)) || ROW_NUMBER() OVER (ORDER BY created_at)::TEXT
    ELSE sales_initials 
  END
WHERE sales_initials IS NULL;