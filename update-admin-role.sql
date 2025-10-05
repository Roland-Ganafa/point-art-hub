-- Update Admin Role SQL Script
-- This script helps you update a user's role to admin directly in the database

-- First, check existing users and their current roles
SELECT u.email, p.role, u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
ORDER BY u.created_at DESC;

-- Update a specific user to admin by email
-- Replace 'admin@pointarthub.local' with the actual email of the user you want to make admin
UPDATE profiles 
SET role = 'admin'
WHERE user_id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'admin@pointarthub.local'
);

-- Alternative: Update a user to admin by user ID
-- Replace 'USER_ID_HERE' with the actual user ID
-- UPDATE profiles 
-- SET role = 'admin'
-- WHERE user_id = 'USER_ID_HERE';

-- If no profile exists for the user, create one
INSERT INTO profiles (user_id, full_name, role)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', email, 'Admin User') as full_name,
  'admin' as role
FROM auth.users 
WHERE email = 'admin@pointarthub.local'
AND id NOT IN (
  SELECT user_id 
  FROM profiles 
  WHERE user_id IS NOT NULL
);

-- Verify the update worked
SELECT p.*, u.email
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'admin@pointarthub.local';