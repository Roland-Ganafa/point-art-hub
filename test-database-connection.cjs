#!/usr/bin/env node

/**
 * Script to test Point Art Hub database connection
 * This script verifies if the database has been set up correctly
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Check if environment variables are set
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase environment variables are not set.');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
  console.error('Current values:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'SET' : 'NOT SET');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  console.log('🔍 Testing Point Art Hub database connection...');
  
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('\n📋 Test 1: Basic connection test');
    const { data, error } = await supabase.from('profiles').select('count').limit(1).maybeSingle();
    
    if (error && error.message !== 'Relation not found') {
      throw error;
    }
    
    console.log('✅ Basic connection successful');
    
    // Test 2: Check if profiles table exists
    console.log('\n📋 Test 2: Checking if profiles table exists');
    const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('count').limit(1).maybeSingle();
    
    if (profilesError && profilesError.message.includes('Relation not found')) {
      console.log('❌ Profiles table does not exist. Please run the database setup script.');
      return false;
    } else if (profilesError) {
      throw profilesError;
    }
    
    console.log('✅ Profiles table exists');
    
    // Test 3: Check if other tables exist
    console.log('\n📋 Test 3: Checking if other tables exist');
    const tablesToCheck = ['stationery', 'gift_store', 'embroidery', 'machines', 'art_services'];
    
    for (const table of tablesToCheck) {
      try {
        const { data: tableData, error: tableError } = await supabase.from(table).select('count').limit(1).maybeSingle();
        
        if (tableError && tableError.message.includes('Relation not found')) {
          console.log(`❌ ${table} table does not exist. Please run the database setup script.`);
          return false;
        } else if (tableError) {
          console.warn(`⚠️  Non-critical error checking ${table}: ${tableError.message}`);
        } else {
          console.log(`✅ ${table} table exists`);
        }
      } catch (err) {
        console.warn(`⚠️  Error checking ${table}: ${err.message}`);
      }
    }
    
    console.log('\n🎉 All tests passed! Database is properly set up.');
    console.log('\n🚀 You can now:');
    console.log('1. Access the application at http://localhost:8080');
    console.log('2. Sign up for a new account (the first user will be admin)');
    console.log('3. Start using Point Art Hub');
    
    return true;
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    
    if (error.message.includes('relation not found') || error.message.includes('Relation not found')) {
      console.log('\n🔧 Solution: Please run the database setup script:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Run the database_setup_safe.sql script');
    }
    
    return false;
  }
}

// Run the test
testDatabaseConnection().then(success => {
  if (!success) {
    process.exit(1);
  }
});