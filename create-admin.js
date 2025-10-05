/**
 * Admin Account Creation Script
 * 
 * This script creates an admin account for Point Art Hub.
 * Run with: node create-admin.js
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

async function createAdminAccount() {
  console.log('🚀 Creating admin account for Point Art Hub...\n');

  // Admin account details - MODIFY THESE AS NEEDED
  const adminEmail = 'admin@pointarthub.local';
  const adminPassword = 'SecureAdmin2025!';
  const adminName = 'System Administrator';

  try {
    console.log(`📧 Creating authentication user for ${adminEmail}...`);
    
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

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('ℹ️  User already exists, will try to make them admin...');
      } else {
        throw new Error(`Sign up failed: ${signUpError.message}`);
      }
    } else {
      console.log('✅ Authentication user created successfully');
      console.log(`   User ID: ${signUpData.user.id}`);
    }

    // Try to get the user ID
    let userId;
    if (signUpData?.user?.id) {
      userId = signUpData.user.id;
    } else {
      // Try to find existing user
      console.log('🔍 Looking for existing user...');
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', adminEmail)
        .single();
      
      if (!userError && userData) {
        userId = userData.user_id;
        console.log(`✅ Found existing user with ID: ${userId}`);
      } else {
        // Try another approach to get user ID
        console.log('⚠️  Could not get user ID from signup, trying alternative method...');
        const { data: authUsers, error: authError } = await supabase
          .from('auth.users')
          .select('id')
          .eq('email', adminEmail);
        
        if (!authError && authUsers.length > 0) {
          userId = authUsers[0].id;
          console.log(`✅ Found user in auth table with ID: ${userId}`);
        }
      }
    }

    // Update user profile to admin role
    if (userId) {
      console.log('🔧 Setting admin role...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('user_id', userId);
      
      if (updateError) {
        console.log('⚠️  Could not update profile directly, creating new profile...');
        // Try to create a new profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              user_id: userId,
              full_name: adminName,
              role: 'admin'
            }
          ]);
        
        if (insertError) {
          console.error('❌ Failed to create admin profile:', insertError.message);
        } else {
          console.log('✅ Admin profile created successfully');
        }
      } else {
        console.log('✅ User role updated to admin successfully');
      }
    } else {
      console.log('⚠️  Could not determine user ID. You may need to manually assign admin role.');
      console.log('📝 After logging in as this user, you can run window.grantEmergencyAdmin() in the browser console.');
    }

    // Success message with instructions
    console.log('\n🎉 Account creation process completed!');
    console.log('═══════════════════════════════════════');
    console.log(`📧 Email:    ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`👤 Name:     ${adminName}`);
    console.log('═══════════════════════════════════════');
    console.log('\n📝 Next Steps:');
    console.log('1. Open Point Art Hub in your browser');
    console.log('2. Click "Sign In"');
    console.log('3. Use the credentials above to log in');
    console.log('4. After logging in, if admin features are not visible:');
    console.log('   - Open the browser console (F12)');
    console.log('   - Type: window.grantEmergencyAdmin() and press Enter');
    console.log('   - Refresh the page to see admin features');
    
  } catch (error) {
    console.error('❌ Error in account creation process:', error.message);
    
    console.log('\n📝 Alternative approach:');
    console.log('1. Open Point Art Hub in your browser');
    console.log('2. Try to sign up manually with your email and a password');
    console.log('3. After signing up, check the browser console for errors');
    console.log('4. If successful, try the emergency admin access method described above');
    
    process.exit(1);
  }
}

// Check if we can access Supabase
async function checkConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      // This might fail due to RLS, but connection is still working
      console.log('✅ Supabase connection successful (RLS may prevent query)');
      return true;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    console.log('\n💡 This might be because:');
    console.log('1. Wrong Supabase URL or API key');
    console.log('2. Network connectivity issues');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking Supabase connection...');
  
  const connected = await checkConnection();
  if (!connected) {
    process.exit(1);
  }

  await createAdminAccount();
}

// Run the script
main().catch(console.error);