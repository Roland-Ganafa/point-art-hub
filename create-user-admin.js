/**
 * User Admin Account Creation Script
 * 
 * This script creates an admin account for Point Art Hub using the available anon key.
 * Run with: node create-user-admin.js
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

  // Admin account details - you can modify these as needed
  const adminEmail = 'ganafaroland@gmail.com';
  const adminPassword = 'SecurePassword123!';
  const adminName = 'Roland Ganafa';

  try {
    console.log('📧 Creating authentication user...');
    
    // First, try to sign up the user
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

    // Get the user ID (either from signup or by fetching)
    let userId;
    if (signUpData?.user?.id) {
      userId = signUpData.user.id;
    } else {
      // Try to get existing user
      const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(adminEmail);
      if (userError) {
        console.log('⚠️  Could not get user via admin API, trying regular method...');
        // We'll try to update the profile directly
      } else {
        userId = userData.user.id;
      }
    }

    // Create or update profile with admin role
    console.log('👤 Creating/updating admin profile...');
    
    // If we have a user ID, try to update the profile
    if (userId) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          full_name: adminName,
          role: 'admin'
        }, {
          onConflict: 'user_id'
        })
        .select();

      if (profileError) {
        console.warn(`Profile creation/update warning: ${profileError.message}`);
        console.log('Trying alternative method...');
        
        // Try to insert a new profile
        const { data: insertData, error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            full_name: adminName,
            role: 'admin'
          })
          .select();
          
        if (insertError) {
          throw new Error(`Profile creation failed: ${insertError.message}`);
        }
        
        console.log('✅ Admin profile created successfully via insert');
      } else {
        console.log('✅ Admin profile created/updated successfully');
      }
    } else {
      console.log('⚠️  No user ID available, profile update skipped');
    }

    // Success message
    console.log('\n🎉 Process completed!');
    console.log('═══════════════════════════════════════');
    console.log(`📧 Email:    ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`👤 Name:     ${adminName}`);
    console.log('═══════════════════════════════════════');
    console.log('\n📝 Next Steps:');
    console.log('1. Open Point Art Hub in your browser');
    console.log('2. Click "Sign In"');
    console.log('3. Use the credentials above to log in');
    console.log('4. If you had an existing account, try logging in with your existing password');
    console.log('5. Change the password after first login for security');
    
  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
    process.exit(1);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting admin account creation process...');
  await createAdminAccount();
}

// Run the script
main().catch(console.error);