#!/usr/bin/env node

/**
 * Comprehensive Authentication Check Script
 * 
 * This script performs a detailed check of user authentication status.
 * Run with: node comprehensive-auth-check.js
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

// Read environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

// Validate required environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  if (!supabaseUrl) console.error('   - VITE_SUPABASE_URL');
  if (!supabaseServiceKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAuthStatus() {
  console.log('🔍 Comprehensive Authentication Status Check');
  console.log('==========================================');
  
  try {
    // Test service role connection
    console.log('\n1. Testing service role connection...');
    const { data: testData, error: testError } = await supabase.auth.admin.listUsers(1, 0);
    if (testError) {
      throw new Error(`Service role connection failed: ${testError.message}`);
    }
    console.log('✅ Service role connection successful');
    
    // List all users
    console.log('\n2. Retrieving user list...');
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }
    
    console.log(`✅ Found ${users.users.length} users in the system`);
    
    // Find our target user
    const targetUser = users.users.find(u => u.email === adminEmail);
    if (!targetUser) {
      console.log(`❌ User with email ${adminEmail} not found in the authentication system`);
      console.log('\nAvailable users:');
      users.users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (${user.id}) - Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      });
      return;
    }
    
    console.log(`\n3. Target user details:`);
    console.log(`   Email: ${targetUser.email}`);
    console.log(`   ID: ${targetUser.id}`);
    console.log(`   Confirmed: ${targetUser.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`   Created: ${targetUser.created_at}`);
    console.log(`   Last Sign In: ${targetUser.last_sign_in_at || 'Never'}`);
    
    // Check user profile
    console.log('\n4. Checking user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', targetUser.id)
      .single();
    
    if (profileError) {
      console.log(`⚠️  Profile check error: ${profileError.message}`);
    } else if (profile) {
      console.log(`✅ Profile found:`);
      console.log(`   ID: ${profile.id}`);
      console.log(`   Name: ${profile.full_name}`);
      console.log(`   Role: ${profile.role}`);
      console.log(`   Sales Initials: ${profile.sales_initials}`);
    } else {
      console.log('❌ No profile found for user');
    }
    
    // If we have the password, try to authenticate
    if (adminPassword) {
      console.log('\n5. Testing authentication with provided credentials...');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${'*'.repeat(adminPassword.length)}`);
      
      // Create a new client with anon key to test regular user auth
      const anonClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
      
      try {
        const { data, error } = await anonClient.auth.signInWithPassword({
          email: adminEmail,
          password: adminPassword
        });
        
        if (error) {
          console.log(`❌ Authentication failed: ${error.message}`);
          console.log('\nPossible causes:');
          console.log('   - Incorrect password');
          console.log('   - User account disabled');
          console.log('   - Email not confirmed (though this should be bypassed with service role)');
          console.log('   - Network connectivity issues');
        } else {
          console.log('✅ Authentication successful!');
          console.log(`   User ID: ${data.user.id}`);
          console.log(`   Email: ${data.user.email}`);
          console.log(`   Access token length: ${data.session.access_token.length} characters`);
        }
      } catch (authError) {
        console.log(`❌ Authentication exception: ${authError.message}`);
      }
    } else {
      console.log('\n5. Skipping authentication test (no password in environment)');
    }
    
    console.log('\n📋 Summary:');
    console.log(`   User exists: ${targetUser ? 'Yes' : 'No'}`);
    console.log(`   Email confirmed: ${targetUser?.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`   Profile exists: ${profile ? 'Yes' : 'No'}`);
    console.log(`   Role: ${profile?.role || 'N/A'}`);
    
  } catch (error) {
    console.error('❌ Error in authentication check:', error.message);
    process.exit(1);
  }
}

// Run the script
checkAuthStatus().catch(console.error);