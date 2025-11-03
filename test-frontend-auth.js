#!/usr/bin/env node

/**
 * Frontend Authentication Test Script
 * 
 * This script tests authentication using the same method as the frontend.
 * Run with: node test-frontend-auth.js
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
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey || !adminEmail || !adminPassword) {
  console.error('❌ Missing required environment variables:');
  if (!supabaseUrl) console.error('   - VITE_SUPABASE_URL');
  if (!supabaseAnonKey) console.error('   - VITE_SUPABASE_ANON_KEY');
  if (!adminEmail) console.error('   - ADMIN_EMAIL');
  if (!adminPassword) console.error('   - ADMIN_PASSWORD');
  process.exit(1);
}

// Create Supabase client with anon key (same as frontend)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFrontendAuth() {
  console.log('🧪 Frontend Authentication Test');
  console.log('==============================');
  
  console.log(`📧 Testing with credentials:`);
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${'*'.repeat(adminPassword.length)}`);
  
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('\n1. Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase.from('profiles').select('count').limit(1);
    if (testError && !testError.message.includes('permission')) {
      throw new Error(`Supabase connection failed: ${testError.message}`);
    }
    console.log('✅ Supabase connection successful');
    
    // Test 2: Try to authenticate with the provided credentials
    console.log('\n2. Testing authentication with provided credentials...');
    
    // This mimics what the frontend does
    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });
    
    if (error) {
      console.log(`❌ Authentication failed: ${error.message}`);
      console.log('\n🔍 Detailed error analysis:');
      
      // Common error patterns and solutions
      if (error.message.includes('Invalid login credentials')) {
        console.log('   This usually means:');
        console.log('   - Wrong email or password');
        console.log('   - User account does not exist');
        console.log('   - User account is disabled');
        console.log('   - Network connectivity issues');
      } else if (error.message.includes('Email not confirmed')) {
        console.log('   This means the email confirmation is required but not completed');
      } else if (error.message.includes('rate limit')) {
        console.log('   This means too many requests have been made in a short time');
      }
      
      // Let's try to get more information about the user
      console.log('\n3. Checking user status in auth system...');
      
      // We can't directly list users with anon key, but we can try to get session
      console.log('   Cannot check user list with anon key (requires service role)');
      
    } else {
      console.log('✅ Authentication successful!');
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Email confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`   Session token length: ${data.session.access_token.length} characters`);
      
      // Test 3: Try to get the user's profile
      console.log('\n3. Testing profile access...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();
      
      if (profileError) {
        console.log(`⚠️  Profile access error: ${profileError.message}`);
      } else if (profileData) {
        console.log('✅ Profile access successful!');
        console.log(`   Profile ID: ${profileData.id}`);
        console.log(`   Name: ${profileData.full_name}`);
        console.log(`   Role: ${profileData.role}`);
      } else {
        console.log('❌ No profile found');
      }
    }
    
    console.log('\n📋 Summary:');
    console.log('   If authentication works here but not in the frontend,');
    console.log('   the issue is likely in the frontend code or browser environment.');
    
  } catch (error) {
    console.error('❌ Error in frontend auth test:', error.message);
    process.exit(1);
  }
}

// Run the script
testFrontendAuth().catch(console.error);