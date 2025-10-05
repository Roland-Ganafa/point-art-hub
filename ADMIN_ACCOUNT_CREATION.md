# Admin Account Creation Guide

This guide explains how to create admin accounts for Point Art Hub.

## Methods to Create Admin Accounts

### 1. Using the Create Admin Script (Recommended)

The project includes a script to create admin accounts:

```bash
node create-admin.js
```

This script will prompt you for:
- Email address (must be a valid email)
- Password (minimum 6 characters)
- Full name

### 2. Using SQL Directly

You can manually update a user's role to admin using the `update-admin-role.sql` script:

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Run the script to see existing users
4. Modify the email address in the UPDATE statement to match the user you want to make admin
5. Execute the script

### 3. Using Browser Console (For Existing Users)

If you already have a user account and need to grant admin privileges:

1. Log in to Point Art Hub
2. Open the browser console (F12)
3. Run the following command:
   ```javascript
   window.grantEmergencyAdmin()
   ```
4. Refresh the page to see admin features

## Troubleshooting

### Email Validation Errors

If you encounter email validation errors when running the script:

1. Make sure you're using a valid email format (e.g., user@domain.com)
2. Ensure the email domain is not blocked by your Supabase instance
3. Try using a real email address instead of example domains

### Connection Issues

If you see connection errors:

1. Verify your `.env` file contains the correct Supabase credentials
2. Check that your Supabase project is running and accessible
3. Ensure your network connection is stable

### Admin Features Not Visible

If admin features don't appear after creating an account:

1. Refresh the page
2. Clear your browser cache
3. Check the browser console for errors
4. Use the emergency admin access method described above