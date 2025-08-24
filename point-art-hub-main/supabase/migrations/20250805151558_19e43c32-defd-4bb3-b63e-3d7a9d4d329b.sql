-- Create enum for frequency
CREATE TYPE public.frequency_type AS ENUM ('daily', 'weekly', 'monthly');

-- Create enum for gift store categories
CREATE TYPE public.gift_category AS ENUM ('cleaning', 'kids_toys', 'birthday', 'custom');

-- Create enum for machine types
CREATE TYPE public.machine_type AS ENUM ('printer', 'copier', 'scanner', 'binder', 'laminator');

-- Create profiles table for staff
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create stationery table
CREATE TABLE public.stationery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  rate DECIMAL(10,2) NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  selling_price DECIMAL(10,2) NOT NULL,
  sales DECIMAL(10,2) GENERATED ALWAYS AS (quantity * selling_price) STORED,
  sold_by UUID REFERENCES public.profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  frequency frequency_type NOT NULL DEFAULT 'daily',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on stationery
ALTER TABLE public.stationery ENABLE ROW LEVEL SECURITY;

-- Create policies for stationery
CREATE POLICY "Anyone can view stationery" ON public.stationery FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert stationery" ON public.stationery FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update stationery" ON public.stationery FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete stationery" ON public.stationery FOR DELETE TO authenticated USING (true);

-- Create gift_store table
CREATE TABLE public.gift_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item TEXT NOT NULL,
  category gift_category NOT NULL DEFAULT 'custom',
  custom_category TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  rate DECIMAL(10,2) NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  sales DECIMAL(10,2) GENERATED ALWAYS AS (quantity * rate) STORED,
  sold_by UUID REFERENCES public.profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  frequency frequency_type NOT NULL DEFAULT 'daily',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on gift_store
ALTER TABLE public.gift_store ENABLE ROW LEVEL SECURITY;

-- Create policies for gift_store
CREATE POLICY "Anyone can view gift_store" ON public.gift_store FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert gift_store" ON public.gift_store FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update gift_store" ON public.gift_store FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete gift_store" ON public.gift_store FOR DELETE TO authenticated USING (true);

-- Create embroidery table
CREATE TABLE public.embroidery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_description TEXT NOT NULL,
  quotation DECIMAL(10,2) NOT NULL,
  expenditure DECIMAL(10,2) NOT NULL DEFAULT 0,
  profit DECIMAL(10,2) GENERATED ALWAYS AS (quotation - expenditure) STORED,
  sales DECIMAL(10,2) GENERATED ALWAYS AS (quotation) STORED,
  done_by UUID REFERENCES public.profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  frequency frequency_type NOT NULL DEFAULT 'daily',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on embroidery
ALTER TABLE public.embroidery ENABLE ROW LEVEL SECURITY;

-- Create policies for embroidery
CREATE POLICY "Anyone can view embroidery" ON public.embroidery FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert embroidery" ON public.embroidery FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update embroidery" ON public.embroidery FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete embroidery" ON public.embroidery FOR DELETE TO authenticated USING (true);

-- Create machines table
CREATE TABLE public.machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_name machine_type NOT NULL,
  service_description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  rate DECIMAL(10,2) NOT NULL,
  sales DECIMAL(10,2) GENERATED ALWAYS AS (quantity * rate) STORED,
  done_by UUID REFERENCES public.profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  frequency frequency_type NOT NULL DEFAULT 'daily',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on machines
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;

-- Create policies for machines
CREATE POLICY "Anyone can view machines" ON public.machines FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert machines" ON public.machines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update machines" ON public.machines FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete machines" ON public.machines FOR DELETE TO authenticated USING (true);

-- Create art_services table
CREATE TABLE public.art_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  rate DECIMAL(10,2) NOT NULL,
  expenditure DECIMAL(10,2) NOT NULL DEFAULT 0,
  sales DECIMAL(10,2) GENERATED ALWAYS AS (quantity * rate) STORED,
  profit DECIMAL(10,2) GENERATED ALWAYS AS ((quantity * rate) - expenditure) STORED,
  done_by UUID REFERENCES public.profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  frequency frequency_type NOT NULL DEFAULT 'daily',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on art_services
ALTER TABLE public.art_services ENABLE ROW LEVEL SECURITY;

-- Create policies for art_services
CREATE POLICY "Anyone can view art_services" ON public.art_services FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert art_services" ON public.art_services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update art_services" ON public.art_services FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete art_services" ON public.art_services FOR DELETE TO authenticated USING (true);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stationery_updated_at BEFORE UPDATE ON public.stationery FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_gift_store_updated_at BEFORE UPDATE ON public.gift_store FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_embroidery_updated_at BEFORE UPDATE ON public.embroidery FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON public.machines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_art_services_updated_at BEFORE UPDATE ON public.art_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();