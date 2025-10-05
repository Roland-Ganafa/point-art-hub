# Comprehensive Fix for Stationery Module RLS Policy Issue

## Problem Summary
The Stationery Module's "Add Item" button is failing with a "row-level security policy" error (code 42501). This occurs when trying to insert data into the `stationery` table.

## Root Causes Identified
1. Missing `stock` column in the `stationery` table
2. Potentially restrictive RLS policies
3. Possible authentication/role issues

## Complete Solution

### Step 1: Apply Database Migration
Run the SQL statements in `fix-stationery-stock.sql` in your Supabase SQL editor:

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

### Step 2: Update RLS Policies (If Needed)
If the issue persists after Step 1, run the SQL statements in `fix-rls-policies.sql`:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated users can insert stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated users can update stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated users can delete stationery" ON public.stationery;

-- Create more permissive policies
CREATE POLICY "Anyone can view stationery" 
ON public.stationery FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert stationery" 
ON public.stationery FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update stationery" 
ON public.stationery FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete stationery" 
ON public.stationery FOR DELETE 
TO authenticated 
USING (true);

-- Ensure RLS is enabled
ALTER TABLE public.stationery ENABLE ROW LEVEL SECURITY;
```

### Step 3: Verify User Role
Ensure you're logged in as an admin user:

1. Run `npm run check:role` to verify your role
2. If you're not an admin, use the emergency admin feature in the app
3. Or run the emergency admin script if available

### Step 4: Test the Fix
1. Refresh the application
2. Try adding a new stationery item
3. Check the browser console for any errors

## Application-Level Improvements
The application has been updated with:

1. Better error handling for RLS policy violations
2. Schema checking to handle missing columns gracefully
3. Improved debugging information in the console
4. More informative error messages for users

## Scripts Available
- `npm run fix:database` - Shows SQL statements needed for the fix
- `npm run verify:fix` - Verifies the database fix
- `npm run check:rls` - Checks RLS policies
- `npm run check:schema` - Checks table schema
- `npm run check:role` - Checks user role and permissions

## If Issues Persist
1. Check the browser console for detailed error messages
2. Verify you're logged in as an authenticated user
3. Ensure you have admin privileges
4. Contact your database administrator for further assistance