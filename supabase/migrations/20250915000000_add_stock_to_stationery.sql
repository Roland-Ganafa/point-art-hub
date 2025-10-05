-- Add stock column to stationery table to match the StationeryModule component expectations
-- This migration adds the missing stock column that was causing RLS policy violations

-- Add stock column if it doesn't exist
ALTER TABLE public.stationery 
ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0;

-- Add index for better performance on stock column
CREATE INDEX IF NOT EXISTS idx_stationery_stock ON public.stationery(stock);

-- Add low stock threshold index for better performance
CREATE INDEX IF NOT EXISTS idx_stationery_low_stock ON public.stationery(stock, low_stock_threshold) 
WHERE stock <= low_stock_threshold;

-- Update existing records to ensure stock column has values equal to quantity
UPDATE public.stationery 
SET stock = quantity 
WHERE stock = 0 OR stock IS NULL;

-- Ensure the profit calculation function exists and is up to date
CREATE OR REPLACE FUNCTION public.calculate_stationery_profit()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate profit per unit as selling_price minus rate
    NEW.profit_per_unit := COALESCE(NEW.selling_price, 0) - COALESCE(NEW.rate, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the profit calculation trigger exists
DROP TRIGGER IF EXISTS trigger_calculate_stationery_profit ON public.stationery;

CREATE TRIGGER trigger_calculate_stationery_profit
    BEFORE INSERT OR UPDATE ON public.stationery
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_stationery_profit();

-- Notify completion
DO $$
BEGIN
    RAISE NOTICE '✅ Stock column added to stationery table successfully!';
    RAISE NOTICE '📋 Changes include:';
    RAISE NOTICE '   • Added stock column to stationery table';
    RAISE NOTICE '   • Created indexes for better performance';
    RAISE NOTICE '   • Updated existing records to populate stock values';
    RAISE NOTICE '   • Ensured profit calculation function and trigger are up to date';
END
$$;