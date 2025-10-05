/**
 * Force Admin Account Creation Script
 * 
 * This script forces the creation of an admin account for Point Art Hub.
 * Run with: node force-create-admin.js
 * 
 * Make sure your .env file has the correct Supabase credentials.
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
  console.log('Please ensure your .env file contains:');
  console.log('- VITE_SUPABASE_URL');
  console.log('- VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function forceCreateAdminAccount() {
  console.log('🚀 Force creating admin account for Point Art Hub...\n');

  // Admin account details - MODIFY THESE AS NEEDED
  const adminEmail = 'ganafaroland@gmail.com';
  const adminPassword = 'SecurePassword2024!';
  const adminName = 'Roland Ganafa';

  try {
    console.log('📧 Step 1: Attempting to create authentication user...');
    
    // Try to sign up first
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          full_name: adminName
        }
      }
    });

    let userId;
    
    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('ℹ️  User already exists, will work with existing account...');
        // Try to get the existing user
        try {
          // Note: This won't work with anon key, but let's try
          const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(adminEmail);
          if (!userError && userData?.user?.id) {
            userId = userData.user.id;
            console.log(`   Found existing user ID: ${userId}`);
          } else {
            console.log('⚠️  Could not retrieve existing user ID');
          }
        } catch (e) {
          console.log('⚠️  Could not retrieve existing user via admin API (expected with anon key)');
        }
      } else {
        console.log(`⚠️  Sign up warning: ${signUpError.message}`);
        console.log('   This might be okay if the user already exists');
      }
    } else {
      console.log('✅ Authentication user created successfully');
      console.log(`   User ID: ${signUpData.user.id}`);
      userId = signUpData.user.id;
    }

    console.log('\n🔐 Step 2: Instructions for manual account setup');
    console.log('Please follow these steps manually:');
    console.log('1. Open Point Art Hub in your browser at http://localhost:8082');
    console.log('2. Click "Sign Up"');
    console.log(`3. Enter the following details:`);
    console.log(`   - Full Name: ${adminName}`);
    console.log(`   - Email: ${adminEmail}`);
    console.log(`   - Password: ${adminPassword}`);
    console.log('4. Click "Sign Up"');
    console.log('5. Check your email for a confirmation link (check spam folder too)');
    console.log('6. Click the confirmation link to activate your account');
    
    console.log('\n🔧 Step 3: After account confirmation');
    console.log('1. Sign in with your credentials');
    console.log('2. Open browser console (F12)');
    console.log('3. Type: window.grantEmergencyAdmin() and press Enter');
    console.log('4. Refresh the page');
    
    console.log('\n📝 Alternative: Fast Login Method');
    console.log('If you continue having issues:');
    console.log('1. Go to http://localhost:8082/direct-login');
    console.log('2. Use the same credentials to log in');
    console.log('3. After logging in, use the emergency admin method above');
    
  } catch (error) {
    console.error('❌ Error in account creation process:', error.message);
    
    console.log('\n📝 Manual fallback approach:');
    console.log('1. Open Point Art Hub in your browser at http://localhost:8082');
    console.log('2. Click "Sign Up"');
    console.log('3. Create an account with any email and password');
    console.log('4. After signing up, check the browser console for errors');
    console.log('5. If successful, try: window.grantEmergencyAdmin()');
    
    process.exit(1);
  }
}

// Main execution
async function main() {
  console.log('🔍 Force Admin Account Creation');
  console.log('===============================');
  
  await forceCreateAdminAccount();
  
  console.log('\n✅ Process completed!');
  console.log('Please follow the instructions above to complete your admin account setup.');
}

// Run the script
main().catch(console.error);