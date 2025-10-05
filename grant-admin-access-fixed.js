#!/usr/bin/env node

/**
 * Script to grant admin access to a specific user in Point Art Hub
 * This script will check if a user exists and grant them admin privileges
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '.env') });

// Check if environment variables are set
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Supabase environment variables are not set.');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ Error: Service role key is required for admin operations.');
  console.error('Please add SUPABASE_SERVICE_ROLE_KEY to your .env file.');
  console.error('You can find this in your Supabase dashboard: Settings → API → service_role key');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUserExists(email) {
  try {
    console.log(`🔍 Checking if user with email ${email} exists...`);

    // Check in auth.users table using service role
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.log(`⚠️ Auth check error: ${error.message}`);
      return { exists: false, userId: null };
    }

    const user = data.users.find(u => u.email === email);

    if (user) {
      console.log(`✅ User found in auth system with ID: ${user.id}`);
      console.log(`   Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      return { exists: true, userId: user.id, user };
    }

    console.log(`❌ User not found in auth system`);
    return { exists: false, userId: null };
  } catch (error) {
    console.error(`❌ Error checking user: ${error.message}`);
    return { exists: false, userId: null };
  }
}

async function checkProfileExists(userId) {
  try {
    console.log(`🔍 Checking if profile exists for user ID: ${userId}...`);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
      console.log(`⚠️ Profile check error: ${error.message}`);
      return { exists: false, profile: null };
    }

    if (profile) {
      console.log(`✅ Profile found with ID: ${profile.id}, current role: ${profile.role}`);
      return { exists: true, profile };
    }

    console.log(`❌ No profile found for user ID: ${userId}`);
    return { exists: false, profile: null };
  } catch (error) {
    console.error(`❌ Error checking profile: ${error.message}`);
    return { exists: false, profile: null };
  }
}

async function createProfile(userId, email, userData) {
  try {
    console.log(`🔄 Creating profile for user ID: ${userId}...`);

    // Use user metadata or extract name from email
    let fullName = userData?.user_metadata?.full_name || 
                   userData?.user_metadata?.name ||
                   email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());

    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          user_id: userId,
          full_name: fullName,
          role: 'user', // Start as user, will be updated to admin
          sales_initials: fullName.substring(0, 2).toUpperCase()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error(`❌ Error creating profile: ${error.message}`);
      return null;
    }

    console.log(`✅ Profile created with ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error(`❌ Error creating profile: ${error.message}`);
    return null;
  }
}

async function grantAdminAccess(userId) {
  try {
    console.log(`🔄 Granting admin access to user ID: ${userId}...`);

    const { data, error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error(`❌ Error granting admin access: ${error.message}`);
      return false;
    }

    if (data) {
      console.log(`🎉 Successfully granted admin access!`);
      console.log(`   User: ${data.full_name}`);
      console.log(`   New Role: ${data.role}`);
      return true;
    }

    console.error(`❌ No profile updated`);
    return false;
  } catch (error) {
    console.error(`❌ Error granting admin access: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Point Art Hub Admin Access Grant Script');
  console.log('==========================================\n');

  // Get email from command line arguments
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide an email address as an argument');
    console.error('   Usage: node grant-admin-access.js user@example.com');
    process.exit(1);
  }

  console.log(`📧 Target email: ${email}\n`);

  // Test service role connection
  try {
    console.log('🔗 Testing service role connection...');
    const { data: testData, error: testError } = await supabase.auth.admin.listUsers(1, 0);
    if (testError) {
      console.error('❌ Service role connection failed:', testError.message);
      console.error('   Please check your SUPABASE_SERVICE_ROLE_KEY');
      process.exit(1);
    }
    console.log('✅ Service role connection successful\n');
  } catch (error) {
    console.error('❌ Service role test failed:', error.message);
    process.exit(1);
  }

  // Check if user exists in auth system
  const userCheck = await checkUserExists(email);

  if (!userCheck.exists) {
    console.log(`\n❌ User with email ${email} does not exist in the authentication system.`);
    console.log(`   Please sign up through the application first, then run this script again.`);
    process.exit(1);
  }

  // Check if profile exists
  const profileCheck = await checkProfileExists(userCheck.userId);

  let profile = profileCheck.profile;

  // Create profile if it doesn't exist
  if (!profileCheck.exists) {
    console.log(`\n🔄 Profile not found, creating one...`);
    profile = await createProfile(userCheck.userId, email, userCheck.user);

    if (!profile) {
      console.log(`\n❌ Failed to create profile for user.`);
      process.exit(1);
    }
  }

  // Check current role
  if (profile.role === 'admin') {
    console.log(`\nℹ️ User already has admin role.`);
    console.log('   No changes needed!');
    process.exit(0);
  }

  // Grant admin access
  console.log(`\n🔄 Updating user role to admin...`);
  const success = await grantAdminAccess(userCheck.userId);

  if (success) {
    console.log(`\n🎉 Success! User ${email} now has admin privileges.`);
    console.log(`   You can now log in to the application with admin access.`);
    console.log(`   🔄 Make sure to refresh your browser if you're already logged in.`);
  } else {
    console.log(`\n❌ Failed to grant admin access.`);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
