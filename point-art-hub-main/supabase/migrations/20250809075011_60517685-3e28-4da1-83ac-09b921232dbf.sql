-- Create table for Gifts Daily Sales
CREATE TABLE IF NOT EXISTS public.gift_daily_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  item text NOT NULL,
  code text,
  quantity integer NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'Pc',
  bpx numeric NOT NULL,
  spx numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.gift_daily_sales ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gift_daily_sales' AND policyname = 'Anyone can view gift_daily_sales'
  ) THEN
    CREATE POLICY "Anyone can view gift_daily_sales"
    ON public.gift_daily_sales
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gift_daily_sales' AND policyname = 'Authenticated users can insert gift_daily_sales'
  ) THEN
    CREATE POLICY "Authenticated users can insert gift_daily_sales"
    ON public.gift_daily_sales
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gift_daily_sales' AND policyname = 'Authenticated users can update gift_daily_sales'
  ) THEN
    CREATE POLICY "Authenticated users can update gift_daily_sales"
    ON public.gift_daily_sales
    FOR UPDATE
    TO authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gift_daily_sales' AND policyname = 'Authenticated users can delete gift_daily_sales'
  ) THEN
    CREATE POLICY "Authenticated users can delete gift_daily_sales"
    ON public.gift_daily_sales
    FOR DELETE
    TO authenticated
    USING (true);
  END IF;
END $$;

-- Trigger to keep updated_at fresh
DROP TRIGGER IF EXISTS update_gift_daily_sales_updated_at ON public.gift_daily_sales;
CREATE TRIGGER update_gift_daily_sales_updated_at
BEFORE UPDATE ON public.gift_daily_sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();