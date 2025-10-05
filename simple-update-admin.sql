-- Simple Admin Role Update
-- Run these queries one at a time

-- Step 1: First, find your user ID
-- Run this query and note the actual UUID value returned
SELECT id, email FROM auth.users WHERE email = 'ganafaroland@gmail.com';

-- Step 2: Then, check if your profile exists (replace 'ACTUAL_USER_ID' with the ID from step 1)
-- Replace ACTUAL_USER_ID with the real UUID you got from the previous query
SELECT * FROM profiles WHERE user_id = 'ACTUAL_USER_ID';

-- Step 3: Update your profile to admin (replace 'ACTUAL_USER_ID' with the ID from step 1)
-- Replace ACTUAL_USER_ID with the real UUID you got from the first query
UPDATE profiles 
SET role = 'admin'
WHERE user_id = 'ACTUAL_USER_ID';

-- Step 4: Verify the update worked (replace 'ACTUAL_USER_ID' with the ID from step 1)
-- Replace ACTUAL_USER_ID with the real UUID you got from the first query
SELECT * FROM profiles WHERE user_id = 'ACTUAL_USER_ID';