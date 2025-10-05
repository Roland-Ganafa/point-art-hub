#!/usr/bin/env node

/**
 * Script to verify that the Supabase API key is properly configured
 * This script checks if the client can make authenticated requests
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

console.log('🔍 Verifying Supabase API Key Configuration');
console.log('=========================================');

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

// Test connection with proper headers
async function testConnection() {
  console.log('\n📋 Connection Test with API Key:');
  
  try {
    // Test with a simple query that requires authentication
    const startTime = Date.now();
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .maybeSingle();
    const endTime = Date.now();
    
    console.log(`✅ Connection test completed (took ${endTime - startTime}ms)`);
    
    if (error) {
      console.log('❌ Query failed:', error.message);
      if (error.message.includes('Unauthorized') || error.message.includes('API key')) {
        console.log('   🔧 This indicates an API key configuration issue');
        console.log('   🔧 Solutions:');
        console.log('      1. Verify your VITE_SUPABASE_ANON_KEY is correct');
        console.log('      2. Check that you are using the anon key, not the service key');
        console.log('      3. Ensure your Supabase project is active');
      }
      return false;
    }
    
    console.log('✅ Query executed successfully');
    console.log('   Response:', data || 'No data returned');
    return true;
    
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
    return false;
  }
}

// Test authentication specifically
async function testAuth() {
  console.log('\n📋 Authentication Test:');
  
  try {
    const startTime = Date.now();
    const { data, error } = await supabase.auth.getSession();
    const endTime = Date.now();
    
    console.log(`✅ Auth test completed (took ${endTime - startTime}ms)`);
    
    if (error) {
      console.log('❌ Auth test failed:', error.message);
      return false;
    }
    
    console.log('✅ Auth test successful');
    console.log('   Session status:', data.session ? 'Active' : 'No active session');
    return true;
    
  } catch (error) {
    console.log('❌ Auth test failed with exception:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n🚀 Running API Key Verification...\n');
  
  const connectionSuccess = await testConnection();
  const authSuccess = await testAuth();
  
  console.log('\n📊 API KEY VERIFICATION SUMMARY:');
  console.log('===============================');
  console.log('Connection Test:', connectionSuccess ? '✅ PASS' : '❌ FAIL');
  console.log('Auth Test:', authSuccess ? '✅ PASS' : '❌ FAIL');
  
  if (connectionSuccess && authSuccess) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('\n✅ Your Supabase API key is properly configured');
    console.log('✅ The client can make authenticated requests');
    console.log('✅ Point Art Hub should now work correctly');
    
    console.log('\n💡 Next steps:');
    console.log('   1. Access the application at http://localhost:8085');
    console.log('   2. Try logging in with your credentials');
    console.log('   3. If you encounter any issues, check the browser console');
  } else {
    console.log('\n❌ Some tests failed. Common issues and solutions:');
    console.log('   🔧 API Key Issues:');
    console.log('      - Verify your VITE_SUPABASE_ANON_KEY in .env is correct');
    console.log('      - Make sure you are using the anon key, not the service role key');
    console.log('      - Check that your Supabase project is active');
    console.log('   🔧 Network Issues:');
    console.log('      - Check your internet connection');
    console.log('      - Verify the Supabase URL is correct');
    console.log('      - Try accessing the Supabase URL directly in your browser');
  }
}

// Run the verification
runAllTests().catch(console.error);