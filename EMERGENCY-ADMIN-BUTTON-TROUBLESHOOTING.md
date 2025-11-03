# Emergency Admin Button Troubleshooting

This guide explains how to troubleshoot issues with the Emergency Admin Access button in Point Art Hub.

## Common Issues

1. **Button not visible** - The button only appears for logged-in non-admin users
2. **Button not working** - Clicking the button has no effect or shows an error
3. **Button disabled** - The button appears but is not clickable

## Troubleshooting Steps

### 1. Check Visibility Conditions

The Emergency Admin Access button only appears when all of these conditions are met:
- User is logged in
- User profile has been loaded
- User is NOT an admin
- User has a profile in the database

### 2. Run Diagnostics

Open the browser console (F12) and run:
```javascript
diagnoseEmergencyAdminButton()
```

This will check:
- Authentication status
- Profile status
- Button presence in DOM
- Button clickability

### 3. Add Manual Button

If the normal button isn't working, you can add a manual emergency admin button:

```javascript
// Add a full emergency admin button
addEmergencyAdminButton()

// Or add a simple floating button
addSimpleAdminButton()
```

### 4. Try Robust Access Methods

If clicking the button doesn't work, try these alternative methods in the browser console:

```javascript
// Try multiple approaches to grant admin access
robustEmergencyAdminAccess()

// Or force admin access by recreating the profile
forceEmergencyAdminAccess()
```

### 5. Manual Database Fix

As a last resort, you can manually update your role in the database:

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Run this query to check your user:
```sql
SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL_HERE';
```
4. Run this query to check for existing profile:
```sql
SELECT * FROM profiles WHERE user_id = 'USER_ID_FROM_ABOVE';
```
5. If no profile exists, create one:
```sql
INSERT INTO profiles (user_id, full_name, role)
VALUES ('USER_ID', 'Your Name', 'admin');
```
6. If profile exists but is not admin, update it:
```sql
UPDATE profiles SET role = 'admin' WHERE user_id = 'USER_ID';
```
7. Refresh your application

## Diagnostic Scripts

Several diagnostic scripts are available to help troubleshoot issues:

- `diagnose-emergency-admin.js` - Full diagnostic tool
- `robust-emergency-admin.js` - Multiple approaches to grant admin access
- `add-emergency-admin-button.js` - Adds manual buttons to the page

## Common Solutions

### Button Not Visible

1. Make sure you're logged in as a non-admin user
2. Check that your profile exists in the database
3. Refresh the page
4. Clear browser cache and cookies

### Button Not Working

1. Try clicking the button programmatically:
```javascript
tryClickEmergencyAdminButton()
```
2. Use the robust emergency admin access function:
```javascript
robustEmergencyAdminAccess()
```
3. Check the browser console for errors

### Profile Issues

If there are issues with your profile:
1. Check if a profile exists for your user ID
2. Try creating a new profile with admin role:
```javascript
forceEmergencyAdminAccess()
```

## Emergency Access Functions

The following functions are available in the browser console:

| Function | Purpose |
|----------|---------|
| `grantEmergencyAdmin()` | Standard emergency admin access (built-in) |
| `diagnoseAndFixAdminRole()` | Diagnose and fix admin role issues |
| `forceAdminRole()` | Force create admin profile |
| `diagnoseEmergencyAdminButton()` | Diagnose button issues |
| `tryClickEmergencyAdminButton()` | Try clicking button programmatically |
| `addEmergencyAdminButton()` | Add manual emergency admin button |
| `addSimpleAdminButton()` | Add simple floating admin button |
| `robustEmergencyAdminAccess()` | Try multiple approaches to grant access |
| `forceEmergencyAdminAccess()` | Force admin access by recreating profile |

## Need More Help?

If none of these solutions work:
1. Check the browser console for specific error messages
2. Verify your Supabase connection is working
3. Ensure your database tables are properly set up
4. Contact support with the error messages you're seeing