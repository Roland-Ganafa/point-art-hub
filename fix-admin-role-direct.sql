-- Direct Admin Role Fix for ganafaroland@gmail.com
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/uizibdtiuvjjikbrkdcv/sql

-- Step 1: Find the user ID
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users 
WHERE email = 'ganafaroland@gmail.com';

-- Step 2: Check current profile
SELECT 
  p.*,
  u.email
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'ganafaroland@gmail.com';

-- Step 3: Update role to admin (bypasses RLS since this runs with elevated privileges)
UPDATE profiles 
SET 
  role = 'admin',
  updated_at = NOW()
WHERE user_id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'ganafaroland@gmail.com'
);

-- Step 4: Verify the update
SELECT 
  p.id,
  p.user_id,
  p.full_name,
  p.role,
  p.sales_initials,
  p.created_at,
  p.updated_at,
  u.email
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'ganafaroland@gmail.com';

-- Step 5: Check all admin users (should see ganafaroland@gmail.com)
SELECT 
  p.full_name,
  u.email,
  p.role,
  p.created_at
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE p.role = 'admin'
ORDER BY p.created_at;
