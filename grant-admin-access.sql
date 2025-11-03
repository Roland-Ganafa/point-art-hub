-- Grant Admin Access SQL Script
-- Run this script in the Supabase SQL Editor to grant admin access to a user

-- First, check if the user exists
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'ganafaroland@gmail.com';

-- Check if a profile already exists for this user
SELECT p.*, u.email
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'ganafaroland@gmail.com';

-- If no profile exists, create one with admin role
INSERT INTO profiles (user_id, full_name, role)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', email, 'Ganafaro Land') as full_name,
  'admin' as role
FROM auth.users 
WHERE email = 'ganafaroland@gmail.com'
AND id NOT IN (
  SELECT user_id 
  FROM profiles 
  WHERE user_id IS NOT NULL
);

-- If profile exists but is not admin, update it
UPDATE profiles 
SET role = 'admin'
WHERE user_id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'ganafaroland@gmail.com'
)
AND (role != 'admin' OR role IS NULL);

-- Verify the update worked
SELECT p.*, u.email
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'ganafaroland@gmail.com';