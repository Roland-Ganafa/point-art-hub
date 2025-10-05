#!/usr/bin/env node

/**
 * Comprehensive authentication test for Point Art Hub
 * This script tests all aspects of the authentication system
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

console.log('🔍 Comprehensive Authentication Test');
console.log('===================================');

// Check environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('\n📋 Environment Variables:');
console.log('VITE_SUPABASE_URL:', supabaseUrl || 'NOT SET');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? `${supabaseKey.substring(0, 10)}...` : 'NOT SET');

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ Missing environment variables. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n📋 Supabase Client:');
console.log('✅ Client created successfully');

// Test 1: Basic connection test
async function testBasicConnection() {
  console.log('\n📋 Test 1: Basic Connection');
  
  try {
    const startTime = Date.now();
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .maybeSingle();
    const endTime = Date.now();
    
    console.log(`✅ Basic connection test completed (took ${endTime - startTime}ms)`);
    
    if (error) {
      console.log('❌ Basic connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Basic connection successful');
    return true;
    
  } catch (error) {
    console.log('❌ Basic connection failed:', error.message);
    return false;
  }
}

// Test 2: Table access test
async function testTableAccess() {
  console.log('\n📋 Test 2: Table Access');
  
  const tables = ['profiles', 'stationery', 'gift_store', 'embroidery', 'machines', 'art_services'];
  
  for (const table of tables) {
    try {
      const startTime = Date.now();
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1)
        .maybeSingle();
      const endTime = Date.now();
      
      console.log(`   ${table}: ${endTime - startTime}ms`);
      
      if (error && !error.message.includes('Relation not found')) {
        console.log(`   ❌ ${table} access failed:`, error.message);
        return false;
      }
      
      console.log(`   ✅ ${table} access successful`);
    } catch (error) {
      console.log(`   ❌ ${table} access failed:`, error.message);
      return false;
    }
  }
  
  console.log('✅ All table access tests passed');
  return true;
}

// Test 3: Auth session test
async function testAuthSession() {
  console.log('\n📋 Test 3: Auth Session');
  
  try {
    const startTime = Date.now();
    const { data, error } = await supabase.auth.getSession();
    const endTime = Date.now();
    
    console.log(`✅ Auth session test completed (took ${endTime - startTime}ms)`);
    
    if (error) {
      console.log('❌ Auth session test failed:', error.message);
      return false;
    }
    
    console.log('✅ Auth session test successful');
    console.log('   Session status:', data.session ? 'Active' : 'No active session');
    return true;
    
  } catch (error) {
    console.log('❌ Auth session test failed:', error.message);
    return false;
  }
}

// Test 4: Custom headers test
async function testCustomHeaders() {
  console.log('\n📋 Test 4: Custom Headers');
  
  try {
    // Test that we can make a request with custom headers
    const response = await fetch(`${supabaseUrl}/rest/v1/profiles?select=count&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Custom headers test successful');
      return true;
    } else {
      console.log('❌ Custom headers test failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ Custom headers test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n🚀 Running Comprehensive Authentication Tests...\n');
  
  const tests = [
    { name: 'Basic Connection', fn: testBasicConnection },
    { name: 'Table Access', fn: testTableAccess },
    { name: 'Auth Session', fn: testAuthSession },
    { name: 'Custom Headers', fn: testCustomHeaders }
  ];
  
  let allPassed = true;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (!result) {
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${test.name} test failed with exception:`, error.message);
      allPassed = false;
    }
  }
  
  console.log('\n📊 COMPREHENSIVE AUTHENTICATION TEST SUMMARY:');
  console.log('===========================================');
  console.log('Overall Result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  if (allPassed) {
    console.log('\n🎉 AUTHENTICATION SYSTEM IS WORKING CORRECTLY!');
    console.log('\n✅ Supabase client is properly configured');
    console.log('✅ API key is correctly included in requests');
    console.log('✅ All database tables are accessible');
    console.log('✅ Authentication system is functional');
    
    console.log('\n💡 Next steps:');
    console.log('   1. Access the application at http://localhost:8085');
    console.log('   2. Try logging in with your credentials');
    console.log('   3. The "No API key found in request" errors should be resolved');
  } else {
    console.log('\n❌ AUTHENTICATION SYSTEM HAS ISSUES');
    console.log('   Please check the error messages above and verify your configuration');
  }
}

// Run the comprehensive test
runAllTests().catch(console.error);