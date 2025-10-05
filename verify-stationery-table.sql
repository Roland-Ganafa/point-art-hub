-- Script to verify the current state of the stationery table
-- Run this in your Supabase SQL editor

-- Check if the stock column exists
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'stationery' 
AND column_name = 'stock';

-- Check all columns in the stationery table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'stationery'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
  relname AS table_name,
  relrowsecurity AS rls_enabled,
  relforcerowsecurity AS rls_forced
FROM pg_class
WHERE relname = 'stationery';

-- Check policies on the stationery table
SELECT 
  polname AS policy_name,
  polcmd AS command,
  polroles AS roles,
  polqual AS using_expression,
  polwithcheck AS with_check_expression
FROM pg_policy
WHERE polrelid = 'stationery'::regclass;

-- Check if current user can insert (requires authentication)
-- This will show the current session user
SELECT 
  current_user,
  session_user,
  current_role,
  current_schema();