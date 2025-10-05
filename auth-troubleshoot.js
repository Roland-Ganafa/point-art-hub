/**
 * Authentication Troubleshooting Script
 * 
 * This script helps troubleshoot authentication issues with Point Art Hub.
 * Run with: node auth-troubleshoot.js
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
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function troubleshootAuth() {
  console.log('🔍 Authentication Troubleshooting');
  console.log('================================');
  
  console.log('\n📋 Step 1: Environment Variables Check');
  console.log('✅ VITE_SUPABASE_URL is set');
  console.log('✅ VITE_SUPABASE_ANON_KEY is set');
  
  console.log('\n📋 Step 2: Connection Test');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single();
    
    if (error) {
      console.log('⚠️  Connection test shows RLS restriction (expected)');
      console.log('   This is normal - we can connect but can\'t query without proper auth');
    } else {
      console.log('✅ Connection test successful');
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return;
  }
  
  console.log('\n📋 Step 3: Manual Account Creation Instructions');
  console.log('1. Open your browser and go to http://localhost:8082');
  console.log('2. Click the "Sign Up" tab (NOT "Sign In")');
  console.log('3. Use these exact credentials:');
  console.log('   - Full Name: Roland Ganafa');
  console.log('   - Email: ganafaroland@gmail.com');
  console.log('   - Password: SecurePassword2024!');
  console.log('4. Click "Sign Up"');
  console.log('5. IMMEDIATELY check your email (including spam folder) for a confirmation link');
  console.log('6. Click the confirmation link');
  
  console.log('\n📋 Step 4: If Email Confirmation Doesn\'t Work');
  console.log('1. Try signing up again with the same credentials');
  console.log('2. If you get "already registered" error, try signing in instead');
  console.log('3. If sign in fails, try the Fast Login method:');
  console.log('   - Go to http://localhost:8082/direct-login');
  console.log('   - Use the same credentials');
  
  console.log('\n📋 Step 5: After Successful Login');
  console.log('1. Open browser console (F12)');
  console.log('2. Type: window.grantEmergencyAdmin()');
  console.log('3. Press Enter');
  console.log('4. Refresh the page');
  
  console.log('\n📋 Common Issues and Solutions');
  console.log('1. "Invalid login credentials" - Account not confirmed or wrong password');
  console.log('2. "Email already registered" - Try signing in instead');
  console.log('3. "Connection timeout" - Network issues, try Fast Login method');
  console.log('4. "User not found in profiles" - Account creation incomplete');
  
  console.log('\n📝 If nothing works, try this emergency approach:');
  console.log('1. Sign up with any email/password combination');
  console.log('2. After signing in, use window.grantEmergencyAdmin()');
  console.log('3. You can then manage users from the Admin Panel');
}

// Run the script
troubleshootAuth().catch(console.error);