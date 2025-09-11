# Fix Summary: Foreign Key Constraint Violation in Stationery Sales

## Issue Description

When recording stationery sales, users encountered a 409 Conflict error with the following details:
```
Key (updated_by)=(b1083a55-51a2-41fa-b939-13d627024806) is not present in table "profiles"
```

This error occurred because:
1. Inserting a record into `stationery_sales` triggered the `reduce_stationery_stock_on_sale` function
2. This function updated the `stationery` table to reduce stock
3. The update to the `stationery` table triggered the `update_stationery_updated_by` trigger
4. This trigger attempted to set `updated_by` to `auth.uid()`
5. The user ID returned by `auth.uid()` didn't exist in the `profiles` table

## Root Cause

The foreign key constraint violation was caused by the `updated_by` column in the `stationery` table referencing a user ID that didn't exist in the `profiles` table. This could happen when:
- A user account exists in Supabase Auth but doesn't have a corresponding profile
- The `auth.uid()` function returns an ID that has been deleted from the profiles table
- There's a mismatch between authentication IDs and profile IDs

## Solution Implemented

### 1. Database Migrations

Created new migrations to fix the issue:

1. **`20250911000000_fix_updated_by_references.sql`**
   - Clears any invalid `updated_by` references in all inventory tables
   - Sets `updated_by` to NULL for records that reference non-existent profiles

2. **`20250911000001_improve_updated_by_handling.sql`**
   - Enhances the `update_updated_by_column` function to check profile existence
   - Only sets `updated_by` if the user exists in the profiles table
   - Re-creates all triggers to ensure consistency

### 2. Application Code Changes

1. **Enhanced UserContext.tsx**
   - Improved profile creation logic to handle conflicts
   - Ensures profile ID consistency with user ID

2. **Enhanced StationeryDailySales.tsx**
   - Added better error handling for foreign key constraint violations
   - Provides clearer error messages to users

3. **Created profileDiagnostics.ts**
   - Utility functions for diagnosing and fixing profile issues
   - Includes functions to check profile existence and create minimal profiles

### 3. Documentation Updates

1. **Updated TROUBLESHOOTING.md**
   - Added a section on foreign key constraint violations
   - Explained the cause and solution for this specific issue

### 4. Utility Scripts

1. **Created fix-profile-issues.js**
   - Script to help diagnose and fix profile-related database issues

## How to Apply the Fix

1. Apply the database migrations:
   ```bash
   # Using Supabase CLI
   supabase db push
   
   # Or using the provided scripts
   ./update-tables.sh  # Mac/Linux
   .\update-tables.bat # Windows
   ```

2. Ensure all users have corresponding profiles in the profiles table

3. Restart the application

## Prevention

The enhanced `update_updated_by_column` function now includes validation to prevent this issue from recurring:
- Only sets `updated_by` if `auth.uid()` is not null
- Only sets `updated_by` if the user exists in the profiles table
- Falls back gracefully if validation fails

## Testing

The fix has been tested to ensure:
- Sales can be recorded without foreign key constraint violations
- Invalid `updated_by` references are properly handled
- User experience is not negatively impacted
- Existing functionality remains intact