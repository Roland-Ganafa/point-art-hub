-- Point Art Hub Database Setup Script
-- Run this script in your new Supabase project's SQL Editor
-- This will create all tables, functions, and triggers needed for the application

-- =============================================================================
-- 1. CREATE ENUMS
-- =============================================================================

-- Create enum for frequency
CREATE TYPE public.frequency_type AS ENUM ('daily', 'weekly', 'monthly');

-- Create enum for gift store categories
CREATE TYPE public.gift_category AS ENUM ('cleaning', 'kids_toys', 'birthday', 'custom');

-- Create enum for machine types
CREATE TYPE public.machine_type AS ENUM ('printer', 'copier', 'scanner', 'binder', 'laminator');

-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'user');

-- =============================================================================
-- 2. CREATE PROFILES TABLE
-- =============================================================================

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role public.user_role DEFAULT 'user',
  sales_initials TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 3. CREATE INVENTORY TABLES
-- =============================================================================

-- Create stationery table
CREATE TABLE public.stationery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item TEXT NOT NULL,
  category TEXT,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  rate DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  selling_price DECIMAL(10,2) NOT NULL,
  profit_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  sales DECIMAL(10,2) DEFAULT 0,
  sold_by UUID REFERENCES public.profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create gift_store table
CREATE TABLE public.gift_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item TEXT NOT NULL,
  category gift_category NOT NULL DEFAULT 'custom',
  custom_category TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  rate DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  selling_price DECIMAL(10,2) DEFAULT 0,
  profit_per_unit DECIMAL(10,2) DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  sales DECIMAL(10,2) DEFAULT 0,
  sold_by UUID REFERENCES public.profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create embroidery table
CREATE TABLE public.embroidery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_description TEXT NOT NULL,
  quotation DECIMAL(10,2) NOT NULL,
  deposit DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) GENERATED ALWAYS AS (quotation - COALESCE(deposit, 0)) STORED,
  quantity INTEGER NOT NULL DEFAULT 1,
  rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  expenditure DECIMAL(10,2) NOT NULL DEFAULT 0,
  profit DECIMAL(10,2) GENERATED ALWAYS AS (quotation - expenditure) STORED,
  sales DECIMAL(10,2) GENERATED ALWAYS AS (quotation) STORED,
  done_by UUID REFERENCES public.profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create machines table
CREATE TABLE public.machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_name machine_type NOT NULL,
  service_description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  rate DECIMAL(10,2) NOT NULL,
  expenditure DECIMAL(10,2) NOT NULL DEFAULT 0,
  sales DECIMAL(10,2) GENERATED ALWAYS AS (quantity * rate) STORED,
  done_by UUID REFERENCES public.profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create art_services table
CREATE TABLE public.art_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  rate DECIMAL(10,2) NOT NULL,
  quotation DECIMAL(10,2) GENERATED ALWAYS AS (quantity * rate) STORED,
  deposit DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) GENERATED ALWAYS AS ((quantity * rate) - COALESCE(deposit, 0)) STORED,
  expenditure DECIMAL(10,2) NOT NULL DEFAULT 0,
  sales DECIMAL(10,2) GENERATED ALWAYS AS (quantity * rate) STORED,
  profit DECIMAL(10,2) GENERATED ALWAYS AS ((quantity * rate) - expenditure) STORED,
  done_by UUID REFERENCES public.profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================================================
-- 4. CREATE SALES TRACKING TABLES
-- =============================================================================

-- Create stationery_sales table for tracking daily sales
CREATE TABLE public.stationery_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.stationery(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  selling_price DECIMAL(10,2) NOT NULL CHECK (selling_price >= 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  profit DECIMAL(10,2) NOT NULL,
  sold_by UUID REFERENCES public.profiles(id),
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create gift_daily_sales table
CREATE TABLE public.gift_daily_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  item TEXT NOT NULL,
  code TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'pcs',
  bpx DECIMAL(10,2) NOT NULL,
  spx DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.stationery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embroidery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.art_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stationery_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_daily_sales ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 6. CREATE SECURITY POLICIES
-- =============================================================================

-- Stationery policies
CREATE POLICY "Anyone can view stationery" ON public.stationery FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert stationery" ON public.stationery FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update stationery" ON public.stationery FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete stationery" ON public.stationery FOR DELETE TO authenticated USING (true);

-- Gift store policies
CREATE POLICY "Anyone can view gift_store" ON public.gift_store FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert gift_store" ON public.gift_store FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update gift_store" ON public.gift_store FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete gift_store" ON public.gift_store FOR DELETE TO authenticated USING (true);

-- Embroidery policies
CREATE POLICY "Anyone can view embroidery" ON public.embroidery FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert embroidery" ON public.embroidery FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update embroidery" ON public.embroidery FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete embroidery" ON public.embroidery FOR DELETE TO authenticated USING (true);

-- Machines policies
CREATE POLICY "Anyone can view machines" ON public.machines FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert machines" ON public.machines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update machines" ON public.machines FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete machines" ON public.machines FOR DELETE TO authenticated USING (true);

-- Art services policies
CREATE POLICY "Anyone can view art_services" ON public.art_services FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert art_services" ON public.art_services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update art_services" ON public.art_services FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete art_services" ON public.art_services FOR DELETE TO authenticated USING (true);

-- Sales policies
CREATE POLICY "Anyone can view stationery_sales" ON public.stationery_sales FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert stationery_sales" ON public.stationery_sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update stationery_sales" ON public.stationery_sales FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete stationery_sales" ON public.stationery_sales FOR DELETE TO authenticated USING (true);

-- Gift daily sales policies
CREATE POLICY "Anyone can view gift_daily_sales" ON public.gift_daily_sales FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert gift_daily_sales" ON public.gift_daily_sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update gift_daily_sales" ON public.gift_daily_sales FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete gift_daily_sales" ON public.gift_daily_sales FOR DELETE TO authenticated USING (true);

-- =============================================================================
-- 7. CREATE FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Function to automatically assign sales initials
CREATE OR REPLACE FUNCTION public.assign_sales_initials()
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

-- Function to assign missing initials to existing users
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

-- =============================================================================
-- 8. CREATE TRIGGERS
-- =============================================================================

-- Triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stationery_updated_at 
    BEFORE UPDATE ON public.stationery 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gift_store_updated_at 
    BEFORE UPDATE ON public.gift_store 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_embroidery_updated_at 
    BEFORE UPDATE ON public.embroidery 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_machines_updated_at 
    BEFORE UPDATE ON public.machines 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_art_services_updated_at 
    BEFORE UPDATE ON public.art_services 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stationery_sales_updated_at 
    BEFORE UPDATE ON public.stationery_sales 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gift_daily_sales_updated_at 
    BEFORE UPDATE ON public.gift_daily_sales 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for auto-assigning sales initials
CREATE TRIGGER trigger_assign_sales_initials_insert
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    WHEN (NEW.sales_initials IS NULL)
    EXECUTE FUNCTION public.assign_sales_initials();

CREATE TRIGGER trigger_assign_sales_initials_update
    BEFORE UPDATE OF full_name ON public.profiles
    FOR EACH ROW
    WHEN (NEW.sales_initials IS NULL OR OLD.full_name IS DISTINCT FROM NEW.full_name)
    EXECUTE FUNCTION public.assign_sales_initials();

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Indexes for better performance
CREATE INDEX idx_stationery_sales_date ON public.stationery_sales(date);
CREATE INDEX idx_stationery_sales_item_id ON public.stationery_sales(item_id);
CREATE INDEX idx_stationery_sales_sold_by ON public.stationery_sales(sold_by);

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_sales_initials ON public.profiles(sales_initials);

CREATE INDEX idx_stationery_category ON public.stationery(category);
CREATE INDEX idx_gift_store_category ON public.gift_store(category);

-- =============================================================================
-- 10. CREATE AUDIT LOG TABLE
-- =============================================================================

-- Create audit_log table for tracking admin actions
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view audit logs" 
ON public.audit_log 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Add comment to describe the table
COMMENT ON TABLE public.audit_log IS 'Audit trail for tracking admin actions and system changes';

-- Create a function to check if audit_log table exists
CREATE OR REPLACE FUNCTION public.check_audit_log_table_exists()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'audit_log'
  );
END;
$$ LANGUAGE plpgsql;

-- Create a function to reset audit_log table schema cache
CREATE OR REPLACE FUNCTION public.reset_audit_log_schema_cache()
RETURNS VOID AS $$
BEGIN
  -- This function doesn't do anything special, but calling it helps refresh the schema cache
  -- in some Supabase clients
  PERFORM 1;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 11. GRANT PERMISSIONS
-- =============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.assign_missing_initials() TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_sales_initials() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================

-- If you see this message, the database setup was successful!
DO $$
BEGIN
    RAISE NOTICE '🎉 Point Art Hub database setup completed successfully!';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '1. Update your .env file with the Supabase credentials';
    RAISE NOTICE '2. Start the development server';
    RAISE NOTICE '3. Create your first admin user through the signup page';
    RAISE NOTICE '4. Use the Admin Profile to assign sales initials to users';
END
$$;