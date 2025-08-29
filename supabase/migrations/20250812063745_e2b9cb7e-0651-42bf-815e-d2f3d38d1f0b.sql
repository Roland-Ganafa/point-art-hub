-- 1) STATIONERY: add low_stock_threshold and profit_per_unit with trigger
ALTER TABLE public.stationery
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profit_per_unit numeric;

CREATE OR REPLACE FUNCTION public.calculate_stationery_profit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.profit_per_unit := COALESCE(NEW.selling_price, 0)::numeric - COALESCE(NEW.rate, 0)::numeric;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stationery_profit ON public.stationery;
CREATE TRIGGER trg_stationery_profit
BEFORE INSERT OR UPDATE OF selling_price, rate
ON public.stationery
FOR EACH ROW
EXECUTE FUNCTION public.calculate_stationery_profit();

-- 2) GIFT STORE: add selling_price, low_stock_threshold, profit_per_unit and trigger
ALTER TABLE public.gift_store
  ADD COLUMN IF NOT EXISTS selling_price numeric,
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profit_per_unit numeric;

CREATE OR REPLACE FUNCTION public.calculate_gift_store_profit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.profit_per_unit := COALESCE(NEW.selling_price, 0)::numeric - COALESCE(NEW.rate, 0)::numeric;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gift_store_profit ON public.gift_store;
CREATE TRIGGER trg_gift_store_profit
BEFORE INSERT OR UPDATE OF selling_price, rate
ON public.gift_store
FOR EACH ROW
EXECUTE FUNCTION public.calculate_gift_store_profit();

-- 3) EMBROIDERY: add quantity, rate, deposit, balance and trigger for sales/profit/balance
ALTER TABLE public.embroidery
  ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS rate numeric,
  ADD COLUMN IF NOT EXISTS deposit numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance numeric;

CREATE OR REPLACE FUNCTION public.calculate_embroidery_financials()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.sales := COALESCE(NEW.quantity, 0)::numeric * COALESCE(NEW.rate, 0)::numeric;
  NEW.profit := COALESCE(NEW.sales, 0)::numeric - COALESCE(NEW.expenditure, 0)::numeric;
  NEW.balance := COALESCE(NEW.quotation, 0)::numeric - COALESCE(NEW.deposit, 0)::numeric;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_embroidery_financials ON public.embroidery;
CREATE TRIGGER trg_embroidery_financials
BEFORE INSERT OR UPDATE OF quantity, rate, expenditure, quotation, deposit
ON public.embroidery
FOR EACH ROW
EXECUTE FUNCTION public.calculate_embroidery_financials();

-- 4) MACHINES: add expenditure and trigger to compute sales
ALTER TABLE public.machines
  ADD COLUMN IF NOT EXISTS expenditure numeric NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.calculate_machines_sales()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.sales := COALESCE(NEW.quantity, 0)::numeric * COALESCE(NEW.rate, 0)::numeric;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_machines_sales ON public.machines;
CREATE TRIGGER trg_machines_sales
BEFORE INSERT OR UPDATE OF quantity, rate
ON public.machines
FOR EACH ROW
EXECUTE FUNCTION public.calculate_machines_sales();

-- 5) ART SERVICES: add quotation, deposit, balance and extend existing calc function
ALTER TABLE public.art_services
  ADD COLUMN IF NOT EXISTS quotation numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposit numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance numeric;

CREATE OR REPLACE FUNCTION public.calculate_art_services_sales_profit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.sales := COALESCE(NEW.quantity, 0)::numeric * COALESCE(NEW.rate, 0)::numeric;
  NEW.profit := COALESCE(NEW.sales, 0)::numeric - COALESCE(NEW.expenditure, 0)::numeric;
  NEW.balance := COALESCE(NEW.quotation, 0)::numeric - COALESCE(NEW.deposit, 0)::numeric;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_art_services_calculate ON public.art_services;
CREATE TRIGGER trg_art_services_calculate
BEFORE INSERT OR UPDATE OF quantity, rate, expenditure, quotation, deposit
ON public.art_services
FOR EACH ROW
EXECUTE FUNCTION public.calculate_art_services_sales_profit();