-- Create function to assign sales initials to users who don't have them
CREATE OR REPLACE FUNCTION public.assign_missing_initials()
RETURNS void AS $$
BEGIN
    -- Update all profiles without sales_initials by triggering the trigger
    UPDATE public.profiles 
    SET full_name = full_name 
    WHERE sales_initials IS NULL AND full_name IS NOT NULL;
    
    -- For any remaining profiles without initials, assign them manually
    UPDATE public.profiles 
    SET sales_initials = 
      CASE 
        WHEN sales_initials IS NULL THEN 
          UPPER(LEFT(full_name, 1)) || (ROW_NUMBER() OVER (ORDER BY created_at))::TEXT
        ELSE sales_initials 
      END
    WHERE sales_initials IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.assign_missing_initials() TO authenticated;