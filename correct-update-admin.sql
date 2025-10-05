-- Single Query Admin Role Update
-- This automatically finds and updates your profile

-- Update your profile to admin (automatically finds your user ID)
UPDATE profiles 
SET role = 'admin'
WHERE user_id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'ganafaroland@gmail.com'
);

-- If no profile exists, create one
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

-- Verify the update worked
SELECT p.*, u.email
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'ganafaroland@gmail.com';