# Point Art Hub Database Setup Instructions

## Problem
You encountered an error when running the database setup script:
```
ERROR: 42601: syntax error at or near "RAISE"
```

This error occurred because the `RAISE NOTICE` statements are not supported in all PostgreSQL environments.

## Solution
I've created a safe version of the database setup script that handles existing types and tables gracefully and avoids unsupported syntax.

## Steps to Complete Database Setup

1. **Go to your Supabase dashboard**:
   - Visit https://app.supabase.com
   - Select your project

2. **Navigate to the SQL Editor**:
   - In the left sidebar, click on "SQL Editor"

3. **Create a new query**:
   - Click on "New query" button

4. **Use the safe setup script**:
   - Open the `database_setup_safe.sql` file from your project
   - Copy all content from this file
   - Paste it into the SQL Editor

5. **Run the script**:
   - Click the "Run" button
   - Wait for the script to complete (you should see success messages at the bottom)

6. **Verify the setup**:
   - Look for a message indicating successful completion
   - Check that no errors are displayed

## What This Script Does Differently

The safe version of the script uses PostgreSQL's conditional creation statements:
- `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;` for types
- `CREATE TABLE IF NOT EXISTS` for tables
- `CREATE OR REPLACE FUNCTION` for functions
- `DROP POLICY IF EXISTS` before creating policies to avoid conflicts

This approach ensures that:
- Existing types are not recreated (avoiding the error you encountered)
- Existing tables are preserved with their data
- New tables are created if they don't exist
- Policies and functions are updated properly

## Next Steps

After successfully running the database setup:
1. Go to your application at http://localhost:8080
2. Click on "Sign Up" to create your first user
3. The first user will automatically be assigned admin privileges
4. You can then start using the Point Art Hub system

## Troubleshooting

If you encounter any other errors:
1. Note the specific error message
2. Check that all environment variables in your `.env` file are correct
3. Ensure your Supabase project URL and anon key are correct
4. Restart your development server with `npm run dev`

If the script runs successfully but you don't see any output, that's normal. The script has completed successfully if no errors are shown.