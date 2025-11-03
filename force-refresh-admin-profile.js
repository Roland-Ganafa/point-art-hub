#!/usr/bin/env node

/**
 * Force Refresh Admin Profile Script
 * 
 * This script forces a refresh of the admin profile to ensure correct role assignment.
 * Run with: node force-refresh-admin-profile.js
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

// Validate required environment variables
if (!supabaseUrl || !supabaseServiceKey || !adminEmail) {
  console.error('❌ Missing required environment variables:');
  if (!supabaseUrl) console.error('   - VITE_SUPABASE_URL');
  if (!supabaseServiceKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  if (!adminEmail) console.error('   - ADMIN_EMAIL');
  process.exit(1);
}

// Create Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function forceRefreshAdminProfile() {
  console.log('🔄 Force Refresh Admin Profile');
  console.log('============================');
  console.log(`📧 Target user: ${adminEmail}`);
  
  try {
    // Find the user by email
    console.log('\n1. Looking up user in auth system...');
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }
    
    const targetUser = users.users.find(u => u.email === adminEmail);
    if (!targetUser) {
      console.log(`❌ User with email ${adminEmail} not found`);
      return;
    }
    
    const userId = targetUser.id;
    console.log(`✅ User found with ID: ${userId}`);
    
    // Check the user's profile in the database
    console.log('\n2. Checking current profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.log(`❌ Profile check error: ${profileError.message}`);
      return;
    }
    
    if (!profile) {
      console.log('❌ No profile found for user');
      console.log('Creating new profile with admin role...');
      
      // Create a new profile with admin role
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: userId,
            full_name: targetUser.user_metadata?.full_name || targetUser.email || 'Admin User',
            role: 'admin',
            sales_initials: (targetUser.user_metadata?.full_name || targetUser.email || 'AU').substring(0, 2).toUpperCase()
          }
        ])
        .select()
        .single();
      
      if (createError) {
        throw new Error(`Failed to create profile: ${createError.message}`);
      }
      
      console.log('✅ New profile created with admin role');
      console.log('Profile ID:', newProfile.id);
      console.log('Role:', newProfile.role);
    } else {
      console.log('✅ Profile found:');
      console.log(`   ID: ${profile.id}`);
      console.log(`   Name: ${profile.full_name}`);
      console.log(`   Current Role: ${profile.role}`);
      
      // Update profile to ensure admin role
      if (profile.role !== 'admin') {
        console.log('\n3. Updating profile to admin role...');
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('user_id', userId)
          .select()
          .single();
        
        if (updateError) {
          throw new Error(`Failed to update profile: ${updateError.message}`);
        }
        
        console.log('✅ Profile updated to admin role');
        console.log('New Role:', updatedProfile.role);
      } else {
        console.log('\n3. Profile already has admin role - no update needed');
      }
    }
    
    console.log('\n🎉 Admin profile refresh completed successfully!');
    console.log('=============================================');
    console.log('Next steps:');
    console.log('1. Refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)');
    console.log('2. If still not working, clear browser cache and cookies');
    console.log('3. Log out and log back in');
    console.log('4. Try using the emergency admin access in browser console:');
    console.log('   - Open browser console (F12)');
    console.log('   - Type: window.grantEmergencyAdmin()');
    console.log('   - Press Enter');
    console.log('   - Refresh the page');
    
  } catch (error) {
    console.error('❌ Error in profile refresh:', error.message);
    process.exit(1);
  }
}

// Run the script
forceRefreshAdminProfile().catch(console.error);