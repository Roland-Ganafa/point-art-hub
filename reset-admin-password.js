#!/usr/bin/env node

/**
 * Reset Admin Password Script
 * 
 * This script resets the password for an existing admin user.
 * Run with: node reset-admin-password.js
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
if (!supabaseUrl || !supabaseServiceKey || !adminEmail || !adminPassword) {
  console.error('❌ Missing required environment variables:');
  if (!supabaseUrl) console.error('   - VITE_SUPABASE_URL');
  if (!supabaseServiceKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  if (!adminEmail) console.error('   - ADMIN_EMAIL');
  if (!adminPassword) console.error('   - ADMIN_PASSWORD');
  process.exit(1);
}

// Create Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetAdminPassword() {
  console.log('🔄 Resetting admin password for Point Art Hub...');
  console.log('============================================');
  
  console.log(`📧 Target user: ${adminEmail}`);
  
  try {
    // Find the user by email
    console.log('\n🔍 Looking up user...');
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }
    
    const existingUser = users.users.find(u => u.email === adminEmail);
    if (!existingUser) {
      throw new Error(`User with email ${adminEmail} not found`);
    }
    
    const userId = existingUser.id;
    console.log(`✅ Found user with ID: ${userId}`);
    
    // Update the user's password
    console.log('\n📝 Updating password...');
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: adminPassword }
    );
    
    if (updateError) {
      throw new Error(`Failed to update password: ${updateError.message}`);
    }
    
    console.log('✅ Password updated successfully');
    
    // Success message with instructions
    console.log('\n🎉 Admin password reset completed successfully!');
    console.log('════════════════════════════════════════════');
    console.log(`📧 Email:    ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('════════════════════════════════════════════');
    console.log('\n📝 Next Steps:');
    console.log('1. Open Point Art Hub in your browser');
    console.log('2. Click "Sign In"');
    console.log('3. Use the credentials above to log in');
    console.log('4. You should immediately see admin features');
    
  } catch (error) {
    console.error('❌ Error in password reset process:', error.message);
    process.exit(1);
  }
}

// Run the script
resetAdminPassword().catch(console.error);