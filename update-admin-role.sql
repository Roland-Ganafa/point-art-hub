-- Update Admin Role SQL Script
-- Run this in the Supabase SQL Editor to grant admin access
-- This script is safe to run multiple times

-- ==============================================================================
-- STEP 1: View all users and their current roles
-- ==============================================================================
-- Fixed STEP 1: View all users and their current roles
SELECT 
  u.id,
  u.email,
  u.created_at as user_created,
  p.role,
  p.full_name,
  p.created_at as profile_created,
  CASE 
    WHEN p.user_id IS NULL THEN '❌ No Profile'
    WHEN p.role = 'admin' THEN '✅ Admin'
    WHEN p.role = 'user' THEN '👤 User'
    ELSE '⚠️ Other: ' || COALESCE(p.role::text, 'null')  -- Cast enum to text first!
  END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
ORDER BY u.created_at DESC;

-- ==============================================================================
-- STEP 2: Grant admin access to a specific user
-- ==============================================================================
-- Replace 'admin@pointarthub.local' with the actual email

-- Using a transaction for safety
BEGIN;

-- Option A: Using UPSERT (recommended - handles both insert and update atomically)
INSERT INTO profiles (user_id, full_name, role, created_at, updated_at)
SELECT 
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    u.email,
    'Admin User'
  ) as full_name,
  'admin' as role,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users u
WHERE u.email = 'admin@pointarthub.local'
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

COMMIT;

-- Verify the result
SELECT 
  u.email,
  p.user_id,
  p.full_name,
  p.role,
  p.updated_at
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'admin@pointarthub.local';

-- ==============================================================================
-- ALTERNATIVE METHODS (Comment out the above and use these if needed)
-- ==============================================================================

-- Option B: Grant admin by User ID (if you know the ID)
/*
BEGIN;

INSERT INTO profiles (user_id, full_name, role, created_at, updated_at)
VALUES (
  'USER_ID_HERE',
  'Admin User',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (user_id)
DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

COMMIT;

-- Verify
SELECT * FROM profiles WHERE user_id = 'USER_ID_HERE';
*/

-- Option C: Grant admin to multiple users at once
/*
BEGIN;

INSERT INTO profiles (user_id, full_name, role, created_at, updated_at)
SELECT 
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.email,
    'Admin User'
  ),
  'admin',
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email IN (
  'admin1@example.com',
  'admin2@example.com',
  'admin3@example.com'
)
ON CONFLICT (user_id)
DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

COMMIT;

-- Verify
SELECT u.email, p.role 
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email IN ('admin1@example.com', 'admin2@example.com', 'admin3@example.com');
*/

-- Option D: Create profile only if it doesn't exist (without changing existing role)
/*
INSERT INTO profiles (user_id, full_name, role, created_at, updated_at)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email, 'User'),
  'user', -- Start as regular user
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email = 'user@example.com'
ON CONFLICT (user_id) DO NOTHING; -- Don't update if exists
*/

-- ==============================================================================
-- STEP 3: Verify all admin users
-- ==============================================================================
SELECT 
  u.email,
  p.full_name,
  p.role,
  p.created_at,
  p.updated_at
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE p.role = 'admin'
ORDER BY p.updated_at DESC;

-- ==============================================================================
-- TROUBLESHOOTING QUERIES
-- ==============================================================================

-- Check for users without profiles
SELECT 
  u.id,
  u.email,
  u.created_at,
  '❌ No profile' as issue
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL;

-- Check for profiles without users (orphaned profiles - shouldn't happen)
SELECT 
  p.user_id,
  p.full_name,
  p.role,
  '⚠️ Orphaned profile' as issue
FROM profiles p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE u.id IS NULL;

-- Check for duplicate profiles (shouldn't happen if user_id is primary key)
SELECT 
  user_id,
  COUNT(*) as profile_count
FROM profiles
GROUP BY user_id
HAVING COUNT(*) > 1;

-- ==============================================================================
-- NOTES
-- ==============================================================================
-- 1. The UPSERT (INSERT ... ON CONFLICT) is the safest method
-- 2. Always use transactions (BEGIN/COMMIT) for data modification
-- 3. The script is idempotent - safe to run multiple times
-- 4. Make sure the profiles table has a UNIQUE constraint on user_id
-- 5. Consider RLS policies - you may need to run this as a superuser
-- 6. Always verify the changes with the SELECT queries after updating