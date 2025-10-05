-- Robust Admin Role Update
-- This version handles potential issues

-- Check if your user exists
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'ganafaroland@gmail.com';

-- Check if your profile exists
SELECT p.*, u.email
FROM profiles p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'ganafaroland@gmail.com';

-- If your profile exists, update it
UPDATE profiles 
SET role = 'admin'
WHERE user_id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'ganafaroland@gmail.com'
  LIMIT 1
);

-- If no profile exists, create one
INSERT INTO profiles (user_id, full_name, role)
SELECT id, 
       COALESCE(raw_user_meta_data->>'full_name', email, 'Ganafaro Land') as full_name,
       'admin' as role
FROM auth.users 
WHERE email = 'ganafaroland@gmail.com'
AND id NOT IN (SELECT user_id FROM profiles WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin';

-- Verify the result
SELECT p.*, u.email
FROM profiles p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'ganafaroland@gmail.com';