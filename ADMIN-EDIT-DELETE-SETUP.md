# Admin Edit and Delete Rights Setup

## Summary

I've created a comprehensive migration to grant admin users full edit and delete rights across all tables in your Point Art Hub application.

## What Was Created

### 1. Migration File
**File:** `supabase/migrations/20251108000000_add_admin_edit_delete_policies.sql`

This migration:
- Creates an `is_admin()` helper function to check if a user has admin role
- Updates RLS policies on all tables to grant admins full edit and delete privileges
- Maintains appropriate restrictions for regular users

### 2. Helper Scripts
- **grant-admin-rights.ps1** - Interactive PowerShell script to help apply the migration
- **verify-admin-rights.js** - Script to verify that policies are correctly applied
- **grant-admin-edit-delete.js** - Node.js script to apply policies programmatically

## Policy Configuration

### Admins Can:
✅ **Edit (UPDATE)** all tables including:
  - profiles
  - stationery
  - gift_store
  - embroidery
  - machines
  - art_services
  - stationery_sales
  - gift_daily_sales
  - customers
  - customer_transactions
  - product_categories

✅ **Delete (DELETE)** all records from all tables

✅ **View (SELECT)** all data

✅ **Create (INSERT)** new records

### Regular Users Can:
✅ Edit inventory items (stationery, gift_store, embroidery, machines, art_services)
✅ View data (SELECT)
✅ Create new records (INSERT)
❌ **Cannot** delete inventory items
❌ **Cannot** edit/delete sales records
❌ **Cannot** edit/delete customer data
❌ **Cannot** edit other users' profiles

## How to Apply

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase SQL Editor**
   - Go to: https://app.supabase.com/project/uizibdtiuvjjikbrkdcv/sql

2. **Create New Query**
   - Click "New Query" button

3. **Copy the SQL**
   - Open file: `supabase/migrations/20251108000000_add_admin_edit_delete_policies.sql`
   - Copy all the SQL content

4. **Paste and Run**
   - Paste the SQL into the editor
   - Click "Run" or press `Ctrl+Enter`

5. **Verify Success**
   - You should see success messages in the output
   - Look for: "✅ Admin edit and delete policies applied successfully!"

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
npx supabase db push
```

This will automatically apply all pending migrations.

### Option 3: Using the Node.js Script

```bash
node verify-admin-rights.js
```

This will check if policies are correctly applied.

## Verification Steps

After applying the migration:

1. **Refresh Your Application**
   - Press F5 or reload the page

2. **Log in as Admin**
   - Email: ganafaroland@gmail.com
   - Use your existing password

3. **Test Edit Functionality**
   - Try editing items in stationery, gift store, etc.
   - Changes should save successfully

4. **Test Delete Functionality**
   - Try deleting an item
   - Should work for admin users
   - Should be blocked for non-admin users

## Technical Details

### is_admin() Function
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

This function is used in all RLS policies to check admin status.

### Example Policy (Stationery Table)
```sql
-- All authenticated users can update
CREATE POLICY "Authenticated users can update stationery" 
ON public.stationery FOR UPDATE 
TO authenticated 
USING (true);

-- Only admins can delete
CREATE POLICY "Authenticated users can delete stationery" 
ON public.stationery FOR DELETE 
TO authenticated 
USING (is_admin());
```

## Troubleshooting

### If policies don't seem to work:

1. **Clear browser cache**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

2. **Check admin role**
   - Verify your user has `role = 'admin'` in profiles table

3. **Re-run the migration**
   - Safe to run multiple times (idempotent)

4. **Check Supabase logs**
   - Go to: https://app.supabase.com/project/uizibdtiuvjjikbrkdcv/logs

### If you get RLS errors:

The migration drops and recreates all policies, so temporary errors during migration are normal. Just ensure the migration completes successfully.

## Security Considerations

- **Admin role is checked server-side** using the `is_admin()` function
- **RLS policies are enforced** at the database level, not just in the UI
- **Service role key** is only used for admin operations and migrations
- **Regular users cannot bypass** delete restrictions

## Next Steps

1. ✅ Apply the migration using one of the methods above
2. ✅ Verify admin can edit and delete
3. ✅ Test with a regular user account to ensure restrictions work
4. ✅ Monitor application for any issues

## Support

If you encounter any issues:
1. Check the migration file for syntax errors
2. Review Supabase logs for detailed error messages
3. Verify your admin user role in the profiles table
4. Ensure all tables exist before applying policies

---

**Created:** 2025-11-08
**Migration File:** 20251108000000_add_admin_edit_delete_policies.sql
**Status:** Ready to apply
