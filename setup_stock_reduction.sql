-- Set up automatic stock reduction functionality
-- Run this in your Supabase SQL editor to create all necessary functions and triggers

-- Function to reduce stock when a sale is recorded
CREATE OR REPLACE FUNCTION public.reduce_stationery_stock_on_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Reduce the stock in the stationery table by the quantity sold
  UPDATE public.stationery 
  SET stock = stock - NEW.quantity
  WHERE id = NEW.item_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to reduce stock after a sale is inserted
DROP TRIGGER IF EXISTS trg_reduce_stationery_stock_on_sale ON public.stationery_sales;
CREATE TRIGGER trg_reduce_stationery_stock_on_sale
AFTER INSERT ON public.stationery_sales
FOR EACH ROW
EXECUTE FUNCTION public.reduce_stationery_stock_on_sale();

-- Function to restore stock when a sale is deleted
CREATE OR REPLACE FUNCTION public.restore_stationery_stock_on_sale_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Restore the stock in the stationery table by the quantity that was sold
  UPDATE public.stationery 
  SET stock = stock + OLD.quantity
  WHERE id = OLD.item_id;
  
  RETURN OLD;
END;
$$;

-- Trigger to restore stock after a sale is deleted
DROP TRIGGER IF EXISTS trg_restore_stationery_stock_on_sale_delete ON public.stationery_sales;
CREATE TRIGGER trg_restore_stationery_stock_on_sale_delete
AFTER DELETE ON public.stationery_sales
FOR EACH ROW
EXECUTE FUNCTION public.restore_stationery_stock_on_sale_delete();

-- Function to adjust stock when a sale is updated
CREATE OR REPLACE FUNCTION public.adjust_stationery_stock_on_sale_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Adjust the stock in the stationery table based on the quantity difference
  UPDATE public.stationery 
  SET stock = stock - (NEW.quantity - OLD.quantity)
  WHERE id = NEW.item_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to adjust stock after a sale is updated
DROP TRIGGER IF EXISTS trg_adjust_stationery_stock_on_sale_update ON public.stationery_sales;
CREATE TRIGGER trg_adjust_stationery_stock_on_sale_update
AFTER UPDATE OF quantity ON public.stationery_sales
FOR EACH ROW
WHEN (NEW.quantity <> OLD.quantity)
EXECUTE FUNCTION public.adjust_stationery_stock_on_sale_update();

-- Function to initialize stock correctly for existing items
CREATE OR REPLACE FUNCTION public.initialize_stationery_stock()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Set stock equal to quantity for all existing items
  UPDATE public.stationery 
  SET stock = quantity;
  
  RAISE NOTICE 'Stationery stock levels initialized successfully';
END;
$$;

-- Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION public.initialize_stationery_stock() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reduce_stationery_stock_on_sale() TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_stationery_stock_on_sale_delete() TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_stationery_stock_on_sale_update() TO authenticated;

-- Initialize stock levels
SELECT public.initialize_stationery_stock();

-- Notify completion
SELECT '✅ Automatic stock reduction system implemented successfully!' as message;