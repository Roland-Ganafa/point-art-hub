-- Ensure all required columns exist in the gift_store table
-- This migration adds any missing columns that the GiftStoreModule component expects

-- Add description column if it doesn't exist
ALTER TABLE public.gift_store 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add selling_price column if it doesn't exist
ALTER TABLE public.gift_store 
ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10,2);

-- Add low_stock_threshold column if it doesn't exist
ALTER TABLE public.gift_store 
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 0;

-- Add profit_per_unit column if it doesn't exist
ALTER TABLE public.gift_store 
ADD COLUMN IF NOT EXISTS profit_per_unit DECIMAL(10,2);

-- Add stock column if it doesn't exist (and remove current_stock if it exists)
ALTER TABLE public.gift_store 
ADD COLUMN IF NOT EXISTS stock INTEGER;

-- Remove current_stock column if it still exists
ALTER TABLE public.gift_store 
DROP COLUMN IF EXISTS current_stock;

-- Update existing records to ensure stock column has values
UPDATE public.gift_store 
SET stock = quantity * rate 
WHERE stock IS NULL;

-- Ensure the profit calculation function exists
CREATE OR REPLACE FUNCTION public.calculate_gift_store_profit()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate profit per unit as selling_price minus rate
    NEW.profit_per_unit := COALESCE(NEW.selling_price, 0) - COALESCE(NEW.rate, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the profit calculation trigger exists
DROP TRIGGER IF EXISTS trigger_calculate_gift_store_profit ON public.gift_store;

CREATE TRIGGER trigger_calculate_gift_store_profit
    BEFORE INSERT OR UPDATE ON public.gift_store
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_gift_store_profit();