# Database Fix Instructions for Point Art Hub

## Problem
The "Add Item" button in the Stationery Module is failing with a "row-level security policy" error. This is caused by a missing `stock` column in the `stationery` table that the application expects but is not present in the database.

## Solution
Apply the database migration to add the missing `stock` column and related indexes.

## Steps to Fix

### Option 1: Using Supabase SQL Editor (Recommended)

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the following SQL statements:

```sql
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
```

4. Run each statement one by one
5. Refresh your application

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

1. Make sure you're in the project directory
2. Run the migration:
   ```bash
   npx supabase migration up
   ```

### Option 3: Manual Migration

1. Copy the SQL from `fix-stationery-stock.sql` file
2. Paste it into your Supabase SQL editor
3. Execute the statements

## Verification

After applying the fix:

1. Refresh your application
2. Try adding a new stationery item
3. The error should be resolved

## Additional Notes

- The application has been updated to handle cases where the stock column might be missing
- The fix includes proper indexes for performance
- Existing data will be automatically updated to populate the stock column