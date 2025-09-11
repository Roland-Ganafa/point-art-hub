#!/usr/bin/env node

/**
 * Script to check Point Art Hub setup status
 * This script verifies if all components are properly configured
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Check if environment variables are set
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🔍 Point Art Hub Setup Status Checker');
console.log('=====================================');

console.log('\n📋 Environment Variables Check:');
console.log('✅ VITE_SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
console.log('✅ VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'SET' : 'NOT SET');

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ Critical Error: Environment variables are not properly set.');
  console.log('   Please check your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSetupStatus() {
  console.log('\n📋 Database Connection Check:');
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1).maybeSingle();
    
    if (error && !error.message.includes('Relation not found')) {
      throw error;
    }
    
    console.log('✅ Database connection successful');
    
    // Check required tables
    console.log('\n📋 Required Tables Check:');
    const requiredTables = ['profiles', 'stationery', 'gift_store', 'embroidery', 'machines', 'art_services'];
    let allTablesExist = true;
    
    for (const table of requiredTables) {
      try {
        const { data: tableData, error: tableError } = await supabase.from(table).select('count').limit(1).maybeSingle();
        
        if (tableError && tableError.message.includes('Relation not found')) {
          console.log(`❌ ${table} table missing`);
          allTablesExist = false;
        } else {
          console.log(`✅ ${table} table exists`);
        }
      } catch (err) {
        console.log(`❌ Error checking ${table}: ${err.message}`);
        allTablesExist = false;
      }
    }
    
    if (!allTablesExist) {
      console.log('\n❌ Some required tables are missing.');
      console.log('   Please run the database setup script.');
      return false;
    }
    
    // Check if any users exist
    console.log('\n📋 User Accounts Check:');
    const { data: users, error: usersError } = await supabase.from('profiles').select('*');
    
    if (usersError) {
      console.log('⚠️  Error checking users:', usersError.message);
    } else if (users && users.length > 0) {
      console.log(`✅ ${users.length} user account(s) found`);
      const adminUser = users.find(user => user.role === 'admin');
      if (adminUser) {
        console.log('✅ Admin user exists');
      } else {
        console.log('⚠️  No admin user found. The first user to sign up will be admin.');
      }
    } else {
      console.log('⚠️  No user accounts found. Please sign up through the application.');
    }
    
    console.log('\n🎉 Setup Status: COMPLETE');
    console.log('\n🚀 You can now access Point Art Hub at http://localhost:8080');
    console.log('   If you haven\'t created an account yet, click "Sign Up" on the login page.');
    
    return true;
    
  } catch (error) {
    console.error('❌ Setup check failed:', error.message);
    return false;
  }
}

// Run the check
checkSetupStatus().then(success => {
  if (!success) {
    process.exit(1);
  }
});