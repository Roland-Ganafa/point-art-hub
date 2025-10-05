#!/usr/bin/env node

/**
 * Script to fix user profile issues in Point Art Hub
 * This script will check if a user exists and create/update their profile
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
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase environment variables are not set.');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserExists(email) {
  try {
    console.log(`🔍 Checking if user with email ${email} exists...`);
    
    // For this to work properly, we would need the service role key
    // Since we only have the anon key, we'll need to use a different approach
    console.log('⚠️  This script requires the service role key to work properly.');
    console.log('⚠️  Please update your .env file with the service role key.');
    return { exists: false, userId: null };
  } catch (error) {
    console.error(`❌ Error checking user: ${error.message}`);
    return { exists: false, userId: null };
  }
}

async function listAllUsers() {
  try {
    console.log('📋 Listing all users in the system...');
    
    // This won't work with anon key, but let's try
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (error) {
      console.log(`⚠️  Error listing users: ${error.message}`);
      console.log('💡 This is expected with anon key. You need to use the service role key.');
      return [];
    }
    
    console.log(`✅ Found ${data.length} profiles:`);
    data.forEach(profile => {
      console.log(`   - ${profile.full_name} (${profile.role})`);
    });
    
    return data;
  } catch (error) {
    console.error(`❌ Error listing users: ${error.message}`);
    return [];
  }
}

async function main() {
  console.log('🔧 Point Art Hub User Profile Fix Script');
  console.log('========================================\n');
  
  console.log('🔑 Current Supabase configuration:');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key type: ${supabaseKey.substring(0, 10)}... (anon key)`);
  console.log('');
  console.log('⚠️  NOTE: This script can only read data with the anon key.');
  console.log('⚠️  To modify user roles, you need the service role key.');
  console.log('');
  
  // List all users
  await listAllUsers();
  
  console.log('\n💡 To grant admin access to a user:');
  console.log('   1. Sign up through the application first');
  console.log('   2. Log in to the application');
  console.log('   3. Use the "Emergency Admin Access" button in the dashboard');
  console.log('');
  console.log('🔐 For administrators:');
  console.log('   1. Get the service role key from your Supabase project settings');
  console.log('   2. Update your .env file with the service role key');
  console.log('   3. Run the grant-admin-access.js script with the user email');
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
