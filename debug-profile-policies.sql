-- Debug Profile Table Policies
-- This script helps identify any RLS issues with the profiles table

-- 1. Check if profiles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles'
) AS profiles_table_exists;

-- 2. Check RLS status on profiles table
SELECT 
  relname AS table_name,
  relrowsecurity AS rls_enabled,
  relforcerowsecurity AS force_rls
FROM pg_class 
WHERE relname = 'profiles';

-- 3. Check existing policies on profiles table
SELECT 
  polname AS policy_name,
  relname AS table_name,
  polcmd AS command,
  polroles AS roles,
  polqual AS using_condition,
  polwithcheck AS check_condition
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
WHERE cls.relname = 'profiles'
ORDER BY cls.relname, pol.polcmd;

-- 4. Check current user permissions
SELECT 
  table_name,
  privilege_type,
  grantee
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY table_name, privilege_type;

-- 5. Test a simple select from profiles (requires authentication)
-- SELECT * FROM public.profiles LIMIT 1;

-- 6. Check if current user can update profiles
-- This will help identify if RLS is blocking updates
SELECT 
  current_user,
  session_user,
  current_role;

-- 7. Check for any row-level security policies that might affect updates
SELECT 
  p.polname AS policy_name,
  p.polcmd AS command,
  p.polqual AS using_clause,
  p.polwithcheck AS check_clause,
  c.relname AS table_name
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'profiles'
AND (p.polcmd = 'w' OR p.polcmd = 'a' OR p.polcmd = 'd')  -- write, all, delete
ORDER BY p.polcmd;