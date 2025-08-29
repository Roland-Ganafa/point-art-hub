-- Update existing gift_store items to ensure correct profit calculation
UPDATE public.gift_store 
SET profit_per_unit = COALESCE(selling_price, 0) - COALESCE(rate, 0);