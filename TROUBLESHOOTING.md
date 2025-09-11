# Point Art Hub - Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the Point Art Hub system.

## Common Authentication Issues

### 1. Missing Environment Variables

**Symptoms:**
- "Missing Supabase environment variables" error
- Blank page with configuration error message
- Application fails to start

**Solution:**
1. Check that your `.env` file exists in the project root
2. Verify it contains both required variables:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. Restart the development server after making changes

### 2. Network Connectivity Issues

**Symptoms:**
- "Network connectivity to Supabase failed" error
- Timeouts when loading the application
- Authentication hangs or fails

**Solution:**
1. Check your internet connection
2. Verify your Supabase project is active
3. Check firewall settings
4. Try accessing your Supabase project URL directly in browser

### 3. Authentication Timeouts

**Symptoms:**
- "Request timeout" errors
- Slow application performance
- Intermittent connection issues

**Solution:**
The system now includes timeout handling with retry mechanisms:
1. Default timeout is 5 seconds
2. Automatic retry with exponential backoff (up to 3 attempts)
3. Connection monitoring for online/offline status

## Database Connection Issues

### 1. Schema Mismatch

**Symptoms:**
- "Relation not found" errors
- Missing tables or columns
- Data not loading in application modules

**Solution:**
1. Ensure all migrations have been applied to your Supabase database
2. Run the update scripts:
   ```bash
   # Using Supabase CLI
   supabase db push
   
   # Or using the provided scripts
   ./update-tables.sh  # Mac/Linux
   .\update-tables.bat # Windows
   ```
3. Check that your database schema matches the latest `database_setup.sql`

### 2. Row Level Security (RLS) Issues

**Symptoms:**
- "permission denied for table" errors
- Data not loading despite successful authentication
- CRUD operations failing

**Solution:**
1. Verify RLS is enabled on all tables
2. Check that security policies are correctly applied
3. Ensure your user has the correct role (admin/user)

### 3. Foreign Key Constraint Violations

**Symptoms:**
- "Key (column)=(value) is not present in table" errors
- 409 Conflict errors when inserting data
- Sales recording failures

**Solution:**
This typically occurs when there's a mismatch between user IDs and profile references. The system includes automatic fixes:
1. Run the latest database migrations to apply the improved constraint handling
2. Ensure all users have corresponding profiles in the profiles table
3. Check that the `updated_by` triggers properly validate user existence

The system now includes enhanced validation to prevent these issues:
- Updated triggers check for profile existence before setting references
- Invalid references are automatically cleared by migration scripts
- Better error handling provides clearer feedback to users

## Development Mode

### When to Use Development Mode

Development mode bypasses authentication and uses mock data. It should only be used for:
- UI development without backend access
- Testing interface components
- Demo purposes

### Enabling Development Mode

1. Navigate to `/bypass-auth` route
2. Click "Enter Development Mode"
3. You'll be logged in as a mock admin user

### Disabling Development Mode

1. Navigate to the diagnostics page (`/auth/diagnostic`)
2. Click "Disable Development Mode"
3. Or manually remove the localStorage items:
   ```javascript
   localStorage.removeItem('mock_auth_active');
   localStorage.removeItem('mock_user');
   ```

## Performance Issues

### 1. Slow Page Loads

**Solution:**
- Check browser console for errors
- Verify network connectivity to Supabase
- Clear browser cache
- Check for large data sets in tables

### 2. Memory Issues

**Solution:**
- Restart the development server
- Close other browser tabs
- Check for memory leaks in custom components

## Advanced Troubleshooting

### Using the Diagnostic Tool

The application includes an enhanced diagnostic tool:
1. Navigate to `/auth/diagnostic`
2. Review the detailed results
3. Follow the suggested fixes
4. Use the "Attempt Recovery" button to refresh sessions

### Checking Browser Storage

You can inspect localStorage for debugging:
```javascript
// Check for connection errors
localStorage.getItem('supabase_connection_error');

// Check if development mode is active
localStorage.getItem('mock_auth_active');

// Check stored session
localStorage.getItem('sb-point-art-hub-auth-session');
```

### Manual Session Refresh

If you're experiencing authentication issues:
```javascript
// Import the Supabase client
import { supabase } from './integrations/supabase/client';

// Manually refresh the session
supabase.auth.refreshSession()
  .then(({ data, error }) => {
    if (error) console.error('Refresh failed:', error);
    else console.log('Session refreshed:', data);
  });
```

## Contact Support

If you continue to experience issues:

1. Check the browser console for specific error messages
2. Verify your Supabase project settings
3. Ensure all environment variables are correctly set
4. Contact the development team with:
   - Error messages
   - Steps to reproduce
   - Browser and OS information
   - Supabase project region