/**
 * Check Auth User Script
 * 
 * This script checks if a user exists in the Supabase authentication system.
 * Run with: node check-auth-user.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Read environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUser(email) {
  console.log(`🔍 Checking if user ${email} exists in auth system...`);
  
  try {
    // We can't directly check if a user exists with the anon key
    // But we can try to sign in to see if the account is active
    
    console.log('ℹ️  We cannot directly check auth users with anon key');
    console.log('   You need to try signing in through the application');
    console.log('   or check your email for a confirmation link');
    
    return false;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  const email = 'ganafaroland@gmail.com';
  console.log('🔍 Auth User Check');
  console.log('==================');
  
  await checkUser(email);
  
  console.log('\n📝 Next steps:');
  console.log('1. Check your email for a confirmation link from Supabase');
  console.log('2. If you received it, click the link to confirm your account');
  console.log('3. If you did not receive it, try signing up again');
  console.log('4. Check your spam/junk folder for the confirmation email');
}

// Run the script
main().catch(console.error);