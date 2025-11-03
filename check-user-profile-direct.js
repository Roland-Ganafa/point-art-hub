#!/usr/bin/env node

/**
 * Direct User Profile Check Script
 * 
 * This script checks the user's profile directly in the database.
 * Run with: node check-user-profile-direct.js
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
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  if (!supabaseUrl) console.error('   - VITE_SUPABASE_URL');
  if (!supabaseServiceKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUserProfile() {
  console.log('🔍 Direct User Profile Check');
  console.log('==========================');
  console.log(`📧 Checking profile for: ${adminEmail}`);
  
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
    
    console.log(`✅ User found with ID: ${targetUser.id}`);
    
    // Check the user's profile in the database
    console.log('\n2. Checking user profile in database...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', targetUser.id)
      .single();
    
    if (profileError) {
      console.log(`❌ Profile check error: ${profileError.message}`);
      return;
    }
    
    if (profile) {
      console.log('✅ Profile found:');
      console.log(`   ID: ${profile.id}`);
      console.log(`   User ID: ${profile.user_id}`);
      console.log(`   Name: ${profile.full_name}`);
      console.log(`   Role: ${profile.role}`);
      console.log(`   Sales Initials: ${profile.sales_initials}`);
      console.log(`   Created At: ${profile.created_at}`);
      console.log(`   Updated At: ${profile.updated_at}`);
      
      // Check if role is admin
      if (profile.role === 'admin') {
        console.log('\n🎉 User has admin role in database');
      } else {
        console.log('\n⚠️  User does not have admin role in database');
        console.log('   Role in database:', profile.role);
      }
    } else {
      console.log('❌ No profile found for user');
    }
    
  } catch (error) {
    console.error('❌ Error in profile check:', error.message);
    process.exit(1);
  }
}

// Run the script
checkUserProfile().catch(console.error);