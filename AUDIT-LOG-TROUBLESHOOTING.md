# Audit Log Troubleshooting Guide

This document provides solutions for common issues with the audit log functionality, particularly the "table not found in schema cache" error.

## Common Issue: "could not find the table 'public.audit_log' in the schema cache"

### Problem Description
This error occurs when the Supabase client's schema cache doesn't include the audit_log table, even though it exists in the database. This can happen after database migrations or when the schema cache becomes outdated.

### Solutions

#### 1. Use the Direct Table Creation Tool (New)
We've added a tool to directly create the audit_log table in the database:

1. When you see the error, you'll now have a "Create Table" button in the fallback UI
2. Click this button to attempt to create the table directly in the database
3. After the table is created, click "Refresh Page" to reload the application

#### 2. Run the Create Audit Table Script (New)
We've added a script to create the audit_log table directly:

1. Make sure you have set up your environment variables in `.env` file:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY

2. Run the script:
   ```bash
   npm run create:audit-table
   ```

3. Follow the instructions provided by the script

#### 3. Automatic Resolution
The application includes automatic schema cache reset functionality:
- The AuditLog component will automatically attempt to reset the schema cache when this error occurs
- It will retry fetching audit logs after resetting the cache
- Users can also manually click the "Retry" button to trigger this process

#### 4. Manual Schema Cache Reset
If the automatic resolution doesn't work, you can manually reset the schema cache:

1. Open your browser's developer tools (F12)
2. Go to the Console tab
3. Run the following command:
   ```javascript
   // Reset schema cache
   localStorage.removeItem('supabase.auth.token');
   sessionStorage.clear();
   ```
4. Refresh the page

#### 5. Database Migration Verification
Ensure the audit_log table migration has been applied:

1. Check that the migration file exists:
   `supabase/migrations/20250828100000_create_audit_log_table.sql`

2. Verify the table exists in your database by running this SQL query in the Supabase SQL editor:
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name = 'audit_log'
   );
   ```

3. If the table doesn't exist, run the migration or the create-audit-table.js script

### Prevention
To prevent this issue in the future:
- Always run database migrations after deploying new features
- Clear browser cache/cookies when deploying schema changes
- Ensure all team members are using the latest database schema

### Support
If none of the above solutions work, please contact your system administrator or create an issue in the project repository.