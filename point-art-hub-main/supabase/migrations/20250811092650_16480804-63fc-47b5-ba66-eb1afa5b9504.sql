-- Auto-calculate sales and profit for art_services and keep updated_at fresh

-- Function to compute sales and profit
CREATE OR REPLACE FUNCTION public.calculate_art_services_sales_profit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.sales := COALESCE(NEW.quantity, 0)::numeric * COALESCE(NEW.rate, 0)::numeric;
  NEW.profit := COALESCE(NEW.sales, 0)::numeric - COALESCE(NEW.expenditure, 0)::numeric;
  RETURN NEW;
END;
$$;

-- Trigger to invoke the calculation on insert/update
DROP TRIGGER IF EXISTS trg_art_services_calculate ON public.art_services;
CREATE TRIGGER trg_art_services_calculate
BEFORE INSERT OR UPDATE OF quantity, rate, expenditure
ON public.art_services
FOR EACH ROW
EXECUTE FUNCTION public.calculate_art_services_sales_profit();

-- Ensure updated_at is maintained
DROP TRIGGER IF EXISTS trg_art_services_set_updated_at ON public.art_services;
CREATE TRIGGER trg_art_services_set_updated_at
BEFORE UPDATE ON public.art_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();