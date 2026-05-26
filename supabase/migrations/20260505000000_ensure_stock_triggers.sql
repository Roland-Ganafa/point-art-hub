-- Ensure stock reduction triggers are active for both stationery_sales and gift_daily_sales.
-- This migration is idempotent (CREATE OR REPLACE / DROP IF EXISTS).

-- =============================================================================
-- 1. STATIONERY — stationery_sales → stationery.stock
-- =============================================================================

CREATE OR REPLACE FUNCTION public.reduce_stationery_stock_on_sale()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.stationery SET stock = GREATEST(0, stock - NEW.quantity) WHERE id = NEW.item_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_stationery_stock_on_sale_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.stationery SET stock = stock + OLD.quantity WHERE id = OLD.item_id;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.adjust_stationery_stock_on_sale_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.stationery SET stock = GREATEST(0, stock - (NEW.quantity - OLD.quantity)) WHERE id = NEW.item_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reduce_stationery_stock_on_sale ON public.stationery_sales;
CREATE TRIGGER trg_reduce_stationery_stock_on_sale
  AFTER INSERT ON public.stationery_sales
  FOR EACH ROW EXECUTE FUNCTION public.reduce_stationery_stock_on_sale();

DROP TRIGGER IF EXISTS trg_restore_stationery_stock_on_sale_delete ON public.stationery_sales;
CREATE TRIGGER trg_restore_stationery_stock_on_sale_delete
  AFTER DELETE ON public.stationery_sales
  FOR EACH ROW EXECUTE FUNCTION public.restore_stationery_stock_on_sale_delete();

DROP TRIGGER IF EXISTS trg_adjust_stationery_stock_on_sale_update ON public.stationery_sales;
CREATE TRIGGER trg_adjust_stationery_stock_on_sale_update
  AFTER UPDATE OF quantity ON public.stationery_sales
  FOR EACH ROW WHEN (NEW.quantity <> OLD.quantity)
  EXECUTE FUNCTION public.adjust_stationery_stock_on_sale_update();

-- =============================================================================
-- 2. GIFT STORE — gift_daily_sales → gift_store.stock  (via item name match)
--    gift_daily_sales.item stores "Category: Item Name" as free text.
--    We match gift_store rows by concatenating their category and item columns.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.reduce_gift_store_stock_on_sale()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.gift_store
  SET stock = GREATEST(0, stock - NEW.quantity)
  WHERE (category || ': ' || item) = NEW.item;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_gift_store_stock_on_sale_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.gift_store
  SET stock = stock + OLD.quantity
  WHERE (category || ': ' || item) = OLD.item;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.adjust_gift_store_stock_on_sale_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.gift_store
  SET stock = GREATEST(0, stock - (NEW.quantity - OLD.quantity))
  WHERE (category || ': ' || item) = NEW.item;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reduce_gift_store_stock_on_sale ON public.gift_daily_sales;
CREATE TRIGGER trg_reduce_gift_store_stock_on_sale
  AFTER INSERT ON public.gift_daily_sales
  FOR EACH ROW EXECUTE FUNCTION public.reduce_gift_store_stock_on_sale();

DROP TRIGGER IF EXISTS trg_restore_gift_store_stock_on_sale_delete ON public.gift_daily_sales;
CREATE TRIGGER trg_restore_gift_store_stock_on_sale_delete
  AFTER DELETE ON public.gift_daily_sales
  FOR EACH ROW EXECUTE FUNCTION public.restore_gift_store_stock_on_sale_delete();

DROP TRIGGER IF EXISTS trg_adjust_gift_store_stock_on_sale_update ON public.gift_daily_sales;
CREATE TRIGGER trg_adjust_gift_store_stock_on_sale_update
  AFTER UPDATE OF quantity ON public.gift_daily_sales
  FOR EACH ROW WHEN (NEW.quantity <> OLD.quantity)
  EXECUTE FUNCTION public.adjust_gift_store_stock_on_sale_update();

-- Grant execute on new functions
GRANT EXECUTE ON FUNCTION public.reduce_gift_store_stock_on_sale() TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_gift_store_stock_on_sale_delete() TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_gift_store_stock_on_sale_update() TO authenticated;
