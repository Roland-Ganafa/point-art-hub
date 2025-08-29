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
import { readFileSync } from 'fs';

// Load environment variables
config();

// Read environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// For service role key, we need to get it from Supabase dashboard
// or use the anon key for now (though it has limitations)
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure your .env file contains:');
  console.log('- VITE_SUPABASE_URL');
  console.log('- VITE_SUPABASE_ANON_KEY');
  console.log('- SUPABASE_SERVICE_ROLE_KEY (optional, for admin functions)');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(
  supabaseUrl, 
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createAdminAccount() {
  console.log('🚀 Creating admin account for Point Art Hub...\n');

  // Admin account details
  const adminEmail = 'admin@pointarthub.com';
  const adminPassword = 'PointArt2024!';
  const adminName = 'System Administrator';

  try {
    console.log('📧 Creating authentication user...');
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      user_metadata: {
        full_name: adminName
      },
      email_confirm: true // Auto-confirm email
    });

    if (authError) {
      throw new Error(`Auth creation failed: ${authError.message}`);
    }

    console.log('✅ Authentication user created successfully');
    console.log(`   User ID: ${authData.user.id}`);

    // Create profile with admin role
    console.log('👤 Creating admin profile...');
    
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        user_id: authData.user.id,
        full_name: adminName,
        role: 'admin'
      }]);

    if (profileError) {
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }

    console.log('✅ Admin profile created successfully');

    // Success message
    console.log('\n🎉 Admin account created successfully!');
    console.log('════════════════════════════════════════');
    console.log(`📧 Email:    ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`👤 Name:     ${adminName}`);
    console.log(`🛡️  Role:     Admin`);
    console.log('════════════════════════════════════════');
    console.log('\n📝 Next Steps:');
    console.log('1. Open Point Art Hub in your browser');
    console.log('2. Click "Sign In"');
    console.log('3. Use the credentials above to log in');
    console.log('4. Go to Admin Profile to manage users');
    console.log('5. Change the password after first login');
    
  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
    
    // If auth creation succeeded but profile failed, try to clean up
    if (authData?.user?.id && error.message.includes('Profile creation failed')) {
      console.log('🧹 Attempting cleanup...');
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.log('✅ Cleanup successful');
      } catch (cleanupError) {
        console.error('❌ Cleanup failed:', cleanupError.message);
      }
    }
    
    process.exit(1);
  }
}

// Check if we can access Supabase
async function checkConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) throw error;
    
    console.log('✅ Supabase connection successful');
    console.log(`📊 Current users in database: ${data.length || 0}`);
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    console.log('\n💡 This might be because:');
    console.log('1. Wrong Supabase URL or API key');
    console.log('2. Database not set up yet (run the database setup script first)');
    console.log('3. Network connectivity issues');
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