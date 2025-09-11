#!/usr/bin/env node

/**
 * Detailed troubleshooting script for Point Art Hub connection issues
 * This script provides comprehensive diagnostics for Supabase connection problems
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

console.log('🔍 Point Art Hub Detailed Troubleshooting');
console.log('========================================');

// Check environment variables
console.log('\n📋 Environment Variables Check:');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('VITE_SUPABASE_URL:', supabaseUrl || 'NOT SET');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? `${supabaseKey.substring(0, 10)}...` : 'NOT SET');

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ CRITICAL: Missing environment variables');
  console.log('   Solution: Check your .env file and ensure it contains:');
  console.log('   VITE_SUPABASE_URL=your_supabase_url');
  console.log('   VITE_SUPABASE_ANON_KEY=your_anon_key');
  process.exit(1);
}

// Validate URL format
console.log('\n📋 URL Validation:');
if (!supabaseUrl.startsWith('https://')) {
  console.log('❌ Invalid Supabase URL format');
  console.log('   Solution: URL should start with https://');
  process.exit(1);
} else {
  console.log('✅ URL format is valid');
}

// Create Supabase client with detailed logging
console.log('\n📋 Creating Supabase Client:');
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    debug: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'point-art-hub-troubleshooting',
    },
  },
});

console.log('✅ Supabase client created successfully');

// Test connection with timeout
async function testConnection() {
  console.log('\n📋 Testing Connection:');
  
  try {
    console.log('   Testing basic connectivity...');
    
    // Set a timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // Test with a simple query
    const startTime = Date.now();
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .maybeSingle();
    const endTime = Date.now();
    
    clearTimeout(timeoutId);
    
    console.log(`   Request completed in ${endTime - startTime}ms`);
    
    if (error) {
      console.log('❌ Query failed:', error.message);
      
      // Provide specific solutions based on error type
      if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
        console.log('\n🔧 SOLUTION FOR NETWORK/FETCH ERRORS:');
        console.log('   1. Check your internet connection');
        console.log('   2. Verify the Supabase URL is correct');
        console.log('   3. Check if your firewall/antivirus is blocking the connection');
        console.log('   4. Try accessing the Supabase URL directly in your browser');
      } else if (error.message.includes('Invalid API key') || error.message.includes('Unauthorized')) {
        console.log('\n🔧 SOLUTION FOR AUTHENTICATION ERRORS:');
        console.log('   1. Verify your anon key is correct');
        console.log('   2. Check that the key has not expired');
        console.log('   3. Ensure you\'re using the anon key, not the service key');
      } else if (error.message.includes('Relation not found')) {
        console.log('\n🔧 SOLUTION FOR MISSING TABLE ERRORS:');
        console.log('   1. Run the database setup script');
        console.log('   2. Check that all migrations have been applied');
      }
      
      return false;
    }
    
    console.log('✅ Connection test successful');
    console.log('   Response:', data || 'No data returned');
    return true;
    
  } catch (error) {
    console.log('❌ Connection test failed with exception:', error.message);
    
    if (error.name === 'AbortError') {
      console.log('   ⚠️  Request timed out - possible network connectivity issue');
    }
    
    return false;
  }
}

// Test authentication specifically
async function testAuth() {
  console.log('\n📋 Testing Authentication:');
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
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
  console.log('\n🚀 Running Comprehensive Diagnostics...\n');
  
  const connectionSuccess = await testConnection();
  const authSuccess = await testAuth();
  
  console.log('\n📊 DIAGNOSTICS SUMMARY:');
  console.log('======================');
  console.log('Connection Test:', connectionSuccess ? '✅ PASS' : '❌ FAIL');
  console.log('Auth Test:', authSuccess ? '✅ PASS' : '❌ FAIL');
  
  if (connectionSuccess && authSuccess) {
    console.log('\n🎉 All tests passed! Your setup is working correctly.');
    console.log('\n💡 Next steps:');
    console.log('   1. Access the application at http://localhost:8080');
    console.log('   2. If you still see errors in the browser, check the browser console');
    console.log('   3. Clear your browser cache and try again');
  } else {
    console.log('\n🔧 Troubleshooting steps:');
    console.log('   1. Double-check your .env file values');
    console.log('   2. Verify your Supabase project is active');
    console.log('   3. Check the Supabase dashboard for any issues');
    console.log('   4. Restart your development server: npm run dev');
    console.log('   5. Check browser console for specific error messages');
  }
}

// Run the diagnostics
runAllTests().catch(console.error);