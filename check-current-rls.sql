-- Check current RLS status and policies
-- Run this in your Supabase SQL editor to diagnose the issue

-- 1. Check if RLS is enabled on tables
SELECT 
  relname AS table_name,
  relrowsecurity AS rls_enabled,
  relforcerowsecurity AS force_rls
FROM pg_class 
WHERE relname IN ('stationery', 'gift_store', 'embroidery', 'machines', 'art_services');

-- 2. Check existing policies
SELECT 
  polname AS policy_name,
  relname AS table_name,
  polcmd AS command,
  polroles AS roles,
  polqual AS using_condition,
  polwithcheck AS check_condition
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
WHERE cls.relname IN ('stationery', 'gift_store', 'embroidery', 'machines', 'art_services')
ORDER BY cls.relname, pol.polcmd;

-- 3. Check table privileges
SELECT 
  table_name,
  privilege_type,
  grantee
FROM information_schema.table_privileges
WHERE table_name IN ('stationery', 'gift_store', 'embroidery', 'machines', 'art_services')
AND table_schema = 'public'
ORDER BY table_name, privilege_type;

-- 4. Check current user
SELECT 
  current_user,
  session_user,
  current_role;

-- 5. Test a simple select (requires authentication)
-- SELECT count(*) FROM public.stationery;