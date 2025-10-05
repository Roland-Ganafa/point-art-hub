#!/usr/bin/env node

/**
 * Direct Supabase Connection Test Script
 * This script tests the Supabase connection directly and can create an admin account
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
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single();
    
    if (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Connection test failed with exception:', error.message);
    return false;
  }
}

async function listUsers() {
  console.log('\n📋 Listing existing users...');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (error) {
      console.error('❌ Failed to list users:', error.message);
      return;
    }
    
    console.log(`✅ Found ${data.length} user(s):`);
    data.forEach((profile, index) => {
      console.log(`   ${index + 1}. ${profile.full_name} (${profile.user_id}) - Role: ${profile.role || 'user'}`);
    });
    
    return data;
  } catch (error) {
    console.error('❌ Failed to list users with exception:', error.message);
    return [];
  }
}

async function findUserByEmail(email) {
  console.log(`\n🔍 Looking for user with email: ${email}`);
  
  try {
    // Try to find user by full_name (since we don't have email in profiles table)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('full_name', `%${email}%`); // Case-insensitive search
    
    if (error) {
      console.error('❌ Failed to search for user:', error.message);
      return null;
    }
    
    if (data && data.length > 0) {
      console.log(`✅ Found ${data.length} matching user(s):`);
      data.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.full_name} (${profile.user_id}) - Role: ${profile.role || 'user'}`);
      });
      return data[0]; // Return the first match
    } else {
      console.log('❌ No matching users found');
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to search for user with exception:', error.message);
    return null;
  }
}

async function makeUserAdmin(userId) {
  console.log(`\n🔧 Attempting to make user ${userId} an admin...`);
  
  try {
    // Attempt to update the role
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Failed to update user role:', updateError.message);
      console.log('💡 This might be due to row-level security policies');
      return false;
    }
    
    console.log('✅ User role updated successfully');
    console.log('   New role:', updateData.role);
    return true;
  } catch (error) {
    console.error('❌ Failed to make user admin with exception:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Point Art Hub - Direct Supabase Test');
  console.log('========================================');
  
  // Test connection
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  // List users
  const users = await listUsers();
  
  // Try to find your user
  const userEmail = 'ganafaroland@gmail.com';
  const user = await findUserByEmail(userEmail);
  
  if (user) {
    console.log(`\n🎯 Found your user: ${user.full_name}`);
    console.log('   User ID:', user.user_id);
    console.log('   Current role:', user.role || 'user');
    
    // Try to make user admin
    const success = await makeUserAdmin(user.user_id);
    if (success) {
      console.log('\n🎉 Successfully made user an admin!');
    } else {
      console.log('\n📝 To make this user an admin, you would need to:');
      console.log('   1. Sign in through the application');
      console.log('   2. Open browser console (F12)');
      console.log('   3. Type: window.grantEmergencyAdmin() and press Enter');
    }
  } else {
    console.log(`\n❓ User with email ${userEmail} not found in profiles table`);
    console.log('   You may need to sign up through the application first');
  }
  
  console.log('\n💡 For direct database access, you would need the service role key');
  console.log('   which is not included in the .env file for security reasons.');
}

// Run the script
main().catch(console.error);