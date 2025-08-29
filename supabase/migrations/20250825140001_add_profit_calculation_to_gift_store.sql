-- Function to automatically calculate profit_per_unit for gift_store items
CREATE OR REPLACE FUNCTION public.calculate_gift_store_profit()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate profit per unit as selling_price minus rate
    NEW.profit_per_unit := COALESCE(NEW.selling_price, 0) - COALESCE(NEW.rate, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate profit_per_unit on insert or update
DROP TRIGGER IF EXISTS trigger_calculate_gift_store_profit ON public.gift_store;

CREATE TRIGGER trigger_calculate_gift_store_profit
    BEFORE INSERT OR UPDATE ON public.gift_store
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_gift_store_profit();