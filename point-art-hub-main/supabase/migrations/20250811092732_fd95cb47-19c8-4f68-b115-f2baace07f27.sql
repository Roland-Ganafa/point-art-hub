-- Harden function with fixed search_path to satisfy linter
CREATE OR REPLACE FUNCTION public.calculate_art_services_sales_profit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.sales := COALESCE(NEW.quantity, 0)::numeric * COALESCE(NEW.rate, 0)::numeric;
  NEW.profit := COALESCE(NEW.sales, 0)::numeric - COALESCE(NEW.expenditure, 0)::numeric;
  RETURN NEW;
END;
$$;

-- Recreate trigger to ensure it points at the latest function definition (idempotent)
DROP TRIGGER IF EXISTS trg_art_services_calculate ON public.art_services;
CREATE TRIGGER trg_art_services_calculate
BEFORE INSERT OR UPDATE OF quantity, rate, expenditure
ON public.art_services
FOR EACH ROW
EXECUTE FUNCTION public.calculate_art_services_sales_profit();