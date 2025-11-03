# Admin Access Recovery Guide
## For Account: ganafaroland@gmail.com

This guide will help you restore admin access to your Point Art Hub account.

---

## 🚀 Quick Fix (Recommended)

### Method 1: Using the Browser Console Script

1. **Start the development server** (if not already running):
   ```powershell
   npm run dev
   ```

2. **Open the application** in your browser:
   - Navigate to: `http://localhost:8080`

3. **Log in** with your admin account:
   - Email: `ganafaroland@gmail.com`
   - Password: `SecurePassword2024!`

4. **Open Browser Console**:
   - Press `F12` or right-click → Inspect
   - Go to the "Console" tab

5. **Load the fix script**:
   - In the console, paste this command:
   ```javascript
   // Load the admin fix script
   const script = document.createElement('script');
   script.src = '/fix-my-admin-access.js';
   document.head.appendChild(script);
   ```
   
   - Wait a moment for the script to load

6. **Check your current status**:
   ```javascript
   checkMyAdminStatus()
   ```

7. **Fix admin access**:
   ```javascript
   fixMyAdminAccess()
   ```
   
   - The script will:
     - Verify you're logged in as the correct account
     - Check if your profile exists
     - Grant admin role if needed
     - Refresh the page automatically

8. **Verify**:
   - After page refresh, you should see the **Admin** button in the header
   - The button should have red gradient styling with a shield icon

---

## 🔧 Alternative Methods

### Method 2: Using Built-in Emergency Admin Function

If you're already on the site and logged in:

1. Open Browser Console (`F12`)
2. Run:
   ```javascript
   window.grantEmergencyAdmin()
   ```
3. Wait for confirmation
4. Refresh the page (`F5`)

### Method 3: Using Supabase Dashboard

If browser methods fail, use Supabase directly:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `uizibdtiuvjjikbrkdcv`
3. Go to **Table Editor** → **profiles**
4. Find the row where `user_id` matches your account
5. Edit the `role` column to `admin`
6. Click **Save**
7. Refresh your application

### Method 4: Using SQL in Supabase

1. Go to Supabase Dashboard → **SQL Editor**
2. Run this query:
   ```sql
   -- First, find your user_id
   SELECT id, email FROM auth.users WHERE email = 'ganafaroland@gmail.com';
   
   -- Then update your profile (replace YOUR_USER_ID with the id from above)
   UPDATE profiles 
   SET role = 'admin' 
   WHERE user_id = 'YOUR_USER_ID';
   
   -- Verify the update
   SELECT * FROM profiles WHERE user_id = 'YOUR_USER_ID';
   ```

---

## 🔍 Troubleshooting

### Issue: "No active session" error

**Solution:**
1. Make sure you're logged in
2. Clear browser cache and cookies
3. Log out and log back in
4. Try again

### Issue: "Profile not found" error

**Solution:**
Run this in browser console after logging in:
```javascript
fixMyAdminAccess()
```
This will create a new profile with admin role.

### Issue: "Permission denied" when updating profile

**Possible Causes:**
- Row Level Security (RLS) policies are blocking updates
- Database permissions issue

**Solution:**
1. Use Method 3 (Supabase Dashboard) instead
2. Or check RLS policies in Supabase:
   - Go to Authentication → Policies
   - Ensure profiles table has update policies enabled

### Issue: Admin button still not showing after fix

**Solution:**
1. Hard refresh the page: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Clear browser cache completely
3. Check browser console for errors
4. Verify your profile role in Supabase dashboard
5. Make sure you're logged in with the correct account

### Issue: "Supabase client not found" error

**Solution:**
1. Make sure you're on the Point Art Hub website (localhost:8080)
2. Wait for the page to fully load
3. Check that the development server is running
4. Verify `.env` file has correct Supabase credentials

---

## ✅ Verification Checklist

After running the fix, verify everything works:

- [ ] Can log in with ganafaroland@gmail.com
- [ ] See "Admin" button in header (red gradient with shield icon)
- [ ] Can access Admin Profile page
- [ ] Can see "Admin Access Granted" message
- [ ] Profile shows role as "admin" in database
- [ ] Can perform admin operations (edit/delete items)

---

## 📝 Prevention Tips

To avoid losing admin access in the future:

1. **Don't manually change your role** in the database
2. **Keep backups** of your database
3. **Document admin accounts** in a secure location
4. **Test admin access** regularly
5. **Use the Emergency Admin button** only when necessary

---

## 🆘 Still Having Issues?

If none of the methods work:

1. **Check environment variables**:
   - Verify `.env` file exists
   - Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
   - Restart the dev server after changes

2. **Check database connection**:
   ```javascript
   // In browser console
   window.supabase.from('profiles').select('count').then(console.log)
   ```

3. **Check for errors**:
   - Open browser console (`F12`)
   - Look for red error messages
   - Check Network tab for failed requests

4. **Last resort - Recreate account**:
   - Use the `create-and-make-admin.js` script
   - This will create a fresh admin account

---

## 📞 Quick Reference

**Your Admin Credentials:**
- Email: `ganafaroland@gmail.com`
- Password: `SecurePassword2024!`

**Supabase Project:**
- URL: `https://uizibdtiuvjjikbrkdcv.supabase.co`
- Project ID: `uizibdtiuvjjikbrkdcv`

**Quick Fix Command:**
```javascript
fixMyAdminAccess()
```

**Check Status Command:**
```javascript
checkMyAdminStatus()
```

---

## 📚 Related Files

- `fix-my-admin-access.js` - Main fix script
- `comprehensive-emergency-admin.js` - Detailed diagnostics
- `grant-admin-access.sql` - SQL fix script
- `create-and-make-admin.js` - Account creation script
- `UserContext.tsx` - Emergency admin function

---

**Last Updated:** 2025-10-28  
**Target Account:** ganafaroland@gmail.com  
**Application:** Point Art Hub
