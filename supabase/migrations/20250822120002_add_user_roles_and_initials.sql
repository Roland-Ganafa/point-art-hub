-- Update profiles table to have proper role management
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS role;

-- Add role enum for better type safety
CREATE TYPE public.user_role AS ENUM ('admin', 'user');

-- Add role column with proper enum type
ALTER TABLE public.profiles 
ADD COLUMN role public.user_role DEFAULT 'user';

-- Update existing profiles to have admin role for the first user (if any)
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (SELECT id FROM public.profiles ORDER BY created_at ASC LIMIT 1);

-- Add sales_initials column for tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sales_initials TEXT UNIQUE;

-- Create function to automatically assign initials
CREATE OR REPLACE FUNCTION assign_sales_initials()
RETURNS TRIGGER AS $$
DECLARE
    initial_letter TEXT;
    counter INTEGER := 0;
    new_initials TEXT;
BEGIN
    -- Get the first letter of full_name
    initial_letter := UPPER(LEFT(NEW.full_name, 1));
    
    -- Start with just the letter
    new_initials := initial_letter;
    
    -- Keep trying until we find available initials
    LOOP
        -- Check if these initials are already taken
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE sales_initials = new_initials AND id != NEW.id) THEN
            NEW.sales_initials := new_initials;
            EXIT;
        END IF;
        
        -- If taken, add a number
        counter := counter + 1;
        new_initials := initial_letter || counter::TEXT;
        
        -- Safety check to prevent infinite loop
        IF counter > 999 THEN
            new_initials := initial_letter || EXTRACT(EPOCH FROM NOW())::TEXT;
            NEW.sales_initials := new_initials;
            EXIT;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-assigning initials
DROP TRIGGER IF EXISTS trigger_assign_sales_initials ON public.profiles;
CREATE TRIGGER trigger_assign_sales_initials
    BEFORE INSERT OR UPDATE OF full_name ON public.profiles
    FOR EACH ROW
    WHEN (NEW.sales_initials IS NULL OR OLD.full_name IS DISTINCT FROM NEW.full_name)
    EXECUTE FUNCTION assign_sales_initials();