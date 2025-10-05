-- Direct Admin Role Fix
-- Run this in your Supabase SQL Editor to fix admin role for ganafaroland@gmail.com

-- First, check if the user exists in auth.users
SELECT id, email, created_at FROM auth.users WHERE email = 'ganafaroland@gmail.com';

-- Check if profile exists for this user
SELECT p.* 
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'ganafaroland@gmail.com';

-- If profile exists, update it to admin
UPDATE profiles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'ganafaroland@gmail.com'
);

-- If no profile exists, create one with admin role
INSERT INTO profiles (user_id, full_name, role)
SELECT id, 'Ganafaro Land', 'admin'
FROM auth.users 
WHERE email = 'ganafaroland@gmail.com'
AND id NOT IN (SELECT user_id FROM profiles)
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin';

-- Verify the fix worked
SELECT p.*, u.email
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'ganafaroland@gmail.com';

-- Grant all privileges to authenticated users (in case RLS is blocking access)
GRANT ALL PRIVILEGES ON TABLE profiles TO authenticated;

-- If RLS is enabled on profiles, disable it temporarily for debugging
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Check RLS status
SELECT 
  relname AS table_name,
  relrowsecurity AS rls_enabled
FROM pg_class 
WHERE relname = 'profiles';