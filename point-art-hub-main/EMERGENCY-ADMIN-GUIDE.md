# Emergency Admin Access Guide

This guide explains how to access admin functionality in emergency situations when normal admin access is not available.

## Browser Console Method (Development/Testing Only)

### Steps:

1. **Open Developer Tools:**
   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
   - Navigate to the "Console" tab

2. **Check Current Admin Status:**
   ```javascript
   // Check your current admin status
   checkAdminStatusAndFix();
   ```

3. **Grant Yourself Admin Access (Development Only):**
   ```javascript
   // Make current user an admin (for development/testing only)
   makeCurrentUserAdmin();
   ```

4. **Navigate to Admin Panel:**
   ```javascript
   // Navigate to admin panel
   emergencyAdminAccess();
   ```

## Available Emergency Functions

### `checkAdminStatusAndFix()`
Checks your current admin status and provides diagnostic information.

### `makeCurrentUserAdmin()`
Grants admin privileges to the currently logged-in user. 
**WARNING: This should only be used in development environments.**

### `emergencyAdminAccess()`
Adds an emergency admin button to the top-right corner of the screen that navigates to the admin panel.

## Environment-Specific Instructions

### Development Environment
- All emergency functions are available
- You can freely use `makeCurrentUserAdmin()` for testing

### Production Environment
- Emergency functions should be disabled or restricted
- Only authorized personnel should have access to these tools
- Contact system administrator for legitimate admin access needs

## Security Considerations

1. **Development Only:** The emergency access functions are intended for development and testing purposes only.

2. **Production Security:** In production environments:
   - Remove or disable emergency access scripts
   - Implement proper authentication and authorization
   - Use role-based access controls

3. **Token Management:** For enhanced security, consider implementing:
   - Time-limited emergency access tokens
   - IP-based restrictions
   - Audit logging for emergency access usage

## Troubleshooting

### Admin Button Not Visible
1. Refresh the page (`Ctrl+F5` or `Cmd+Shift+R`)
2. Clear browser cache and cookies
3. Use the `emergencyAdminAccess()` function in the console

### Access Denied Errors
1. Verify you have a valid user session
2. Check your profile role in the database
3. Use `checkAdminStatusAndFix()` to diagnose issues

### Script Not Working
1. Ensure you're running the script in the correct context
2. Check browser console for error messages
3. Verify Supabase client is properly initialized

## Best Practices

1. **Regular Admins:** Always use the standard admin panel for user management
2. **Emergency Only:** Reserve emergency access for genuine emergencies
3. **Documentation:** Document all emergency access usage
4. **Review:** Regularly review emergency access logs and usage