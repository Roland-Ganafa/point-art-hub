#!/usr/bin/env node

/**
 * Create New Admin Script
 * 
 * This script creates a new admin user account.
 * Run with: node create-new-admin.js
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

// Validate required environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Admin account details - MODIFY THESE AS NEEDED
const adminEmail = 'admin@pointarthub.com';
const adminPassword = 'SecureAdmin2025!';
const adminName = 'Point Art Hub Administrator';

// Create Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
function isValidPassword(password) {
  // At least 8 characters, one uppercase, one lowercase, one number, one special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

async function createAdminUser() {
  console.log('🚀 Creating new admin account for Point Art Hub...');
  console.log('===============================================');
  
  // Validate input
  if (!isValidEmail(adminEmail)) {
    console.error('❌ Invalid email format:', adminEmail);
    process.exit(1);
  }
  
  if (!isValidPassword(adminPassword)) {
    console.error('❌ Password does not meet requirements:');
    console.error('   - At least 8 characters');
    console.error('   - One uppercase letter');
    console.error('   - One lowercase letter');
    console.error('   - One number');
    console.error('   - One special character (@$!%*?&)');
    process.exit(1);
  }
  
  console.log(`📧 Creating admin user: ${adminEmail}`);
  console.log(`👤 Name: ${adminName}`);
  
  try {
    // Create auth user with admin API
    console.log('\n📝 Step 1: Creating authentication user...');
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { 
        full_name: adminName,
        role: 'admin'
      }
    });
    
    if (authError) {
      if (authError.message.includes('already exists')) {
        console.log('ℹ️  User already exists, will check if they have admin role...');
      } else {
        throw new Error(`Auth user creation failed: ${authError.message}`);
      }
    } else {
      console.log('✅ Authentication user created successfully');
      console.log(`   User ID: ${authData.user.id}`);
      console.log(`   Email confirmed: ${authData.user.email_confirmed_at ? 'Yes' : 'No'}`);
    }
    
    // Get user ID (either from creation or by looking up existing user)
    let userId;
    if (authData?.user?.id) {
      userId = authData.user.id;
    } else {
      // Look up existing user
      console.log('\n🔍 Looking up existing user...');
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        throw new Error(`Failed to list users: ${listError.message}`);
      }
      
      const existingUser = users.users.find(u => u.email === adminEmail);
      if (existingUser) {
        userId = existingUser.id;
        console.log(`✅ Found existing user with ID: ${userId}`);
      } else {
        throw new Error('Could not find user after creation attempt');
      }
    }
    
    // Check if profile exists
    console.log('\n📝 Step 2: Checking user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows returned
      throw new Error(`Profile check failed: ${profileError.message}`);
    }
    
    // Create profile if it doesn't exist
    if (!profile) {
      console.log('📝 Creating user profile...');
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: userId,
            full_name: adminName,
            role: 'admin',
            sales_initials: adminName.substring(0, 2).toUpperCase()
          }
        ])
        .select()
        .single();
      
      if (insertError) {
        throw new Error(`Profile creation failed: ${insertError.message}`);
      }
      
      console.log('✅ Profile created successfully');
      console.log(`   Profile ID: ${newProfile.id}`);
    } else {
      console.log('✅ Profile already exists');
      console.log(`   Profile ID: ${profile.id}`);
      console.log(`   Current role: ${profile.role}`);
      
      // Update role to admin if not already admin
      if (profile.role !== 'admin') {
        console.log('📝 Updating profile role to admin...');
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('user_id', userId)
          .select()
          .single();
        
        if (updateError) {
          throw new Error(`Profile update failed: ${updateError.message}`);
        }
        
        console.log('✅ Profile role updated to admin');
      } else {
        console.log('✅ User already has admin role');
      }
    }
    
    // Success message with instructions
    console.log('\n🎉 Admin account creation completed successfully!');
    console.log('═══════════════════════════════════════════════');
    console.log(`📧 Email:    ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`👤 Name:     ${adminName}`);
    console.log('═══════════════════════════════════════════════');
    console.log('\n📝 Next Steps:');
    console.log('1. Open Point Art Hub in your browser');
    console.log('2. Click "Sign In"');
    console.log('3. Use the credentials above to log in');
    console.log('4. You should immediately see admin features');
    
  } catch (error) {
    console.error('❌ Error in admin creation process:', error.message);
    process.exit(1);
  }
}

// Run the script
createAdminUser().catch(console.error);