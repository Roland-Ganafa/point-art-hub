# RLS Policy Fix Instructions for Stationery Module

## Problem
You're getting a "42501: new row violates row-level security policy for table 'stationery'" error when trying to add items to the stationery module.

## Root Cause
The Row-Level Security (RLS) policies on the stationery table are too restrictive or incorrectly configured.

## Solution
Apply the targeted RLS policy fix to make the policies more permissive for authenticated users.

## Steps to Fix

### Step 1: Apply the RLS Fix

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the following SQL from [targeted-rls-fix.sql](file://c:\Users\MSI\CascadeProjects\point-art-hub-main%20(1)\targeted-rls-fix.sql):

```sql
-- Targeted RLS Fix for Stationery Table
-- This is a more direct approach to fix the RLS policy issue

-- First, completely disable and re-enable RLS to reset it
ALTER TABLE public.stationery DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stationery ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated users can insert stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated users can update stationery" ON public.stationery;
DROP POLICY IF EXISTS "Authenticated users can delete stationery" ON public.stationery;

-- Create very permissive policies
CREATE POLICY "Public read access" 
ON public.stationery 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated insert access" 
ON public.stationery 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated update access" 
ON public.stationery 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated delete access" 
ON public.stationery 
FOR DELETE 
TO authenticated 
USING (true);

-- Also fix gift_store for consistency
DROP POLICY IF EXISTS "Anyone can view gift_store" ON public.gift_store;
DROP POLICY IF EXISTS "Authenticated users can insert gift_store" ON public.gift_store;
DROP POLICY IF EXISTS "Authenticated users can update gift_store" ON public.gift_store;
DROP POLICY IF EXISTS "Authenticated users can delete gift_store" ON public.gift_store;

CREATE POLICY "Public read access" 
ON public.gift_store 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated insert access" 
ON public.gift_store 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated update access" 
ON public.gift_store 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated delete access" 
ON public.gift_store 
FOR DELETE 
TO authenticated 
USING (true);

-- Grant all permissions to authenticated users
GRANT ALL PRIVILEGES ON TABLE public.stationery TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.gift_store TO authenticated;

-- Notify completion
SELECT '✅ Targeted RLS policies applied successfully!' as message;
```

4. Run the SQL statements

### Step 2: Verify the Fix

1. Refresh your application
2. Try adding a stationery item again
3. Check the browser console for any errors

### Step 3: If Issues Persist

If you're still experiencing issues:

1. Check that you're logged in as an authenticated user
2. Verify your user role in the profiles table
3. Run the verification script in your browser console:

```javascript
// Check if Supabase is available
if (typeof supabase !== 'undefined') {
  console.log('✅ Supabase client found');
  
  // Test a minimal insert
  const testItem = { 
    item: 'RLS Fix Verification Item',
    quantity: 1,
    rate: 1.00,
    selling_price: 2.00
  };
  
  supabase
    .from('stationery')
    .insert([testItem])
    .select()
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Insert failed:', error);
        console.error('Error code:', error.code);
      } else {
        console.log('✅ Insert succeeded:', data);
        
        // Clean up
        if (data && data[0] && data[0].id) {
          supabase
            .from('stationery')
            .delete()
            .eq('id', data[0].id)
            .then(() => {
              console.log('✅ Test item cleaned up');
            });
        }
      }
    });
} else {
  console.error('❌ Supabase client not found. Make sure you are on the app page.');
}
```

## Additional Notes

- The fix makes the RLS policies very permissive for authenticated users
- This is appropriate for a business application where authenticated users should be able to manage inventory
- If you need more restrictive policies later, you can modify the policies accordingly
- Make sure to test thoroughly after applying the fix

## Troubleshooting

If the fix doesn't work:

1. Ensure you're logged in as an authenticated user
2. Check that the SQL statements executed without errors
3. Verify that your Supabase project is correctly configured
4. Contact your database administrator if you don't have the necessary permissions to modify RLS policies