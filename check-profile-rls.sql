-- Check RLS status and policies for profiles table
SELECT 
  relname AS table_name,
  relrowsecurity AS rls_enabled,
  relforcerowsecurity AS force_rls
FROM pg_class 
WHERE relname = 'profiles';

-- Check existing policies on profiles
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

-- Check if current user can access profiles
SELECT count(*) FROM public.profiles;