/**
 * Try Different Email Script
 * 
 * This script attempts to create an account with a different email address.
 * Run with: node try-different-email.js
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

async function tryDifferentEmail() {
  console.log('🚀 Trying Different Email Approach');
  console.log('==============================');
  
  // Try with a different email address to avoid conflicts
  const adminEmail = 'roland.ganafa.work@gmail.com';
  const adminPassword = 'SecurePassword2024!';
  const adminName = 'Roland Ganafa';
  
  console.log(`\n📧 Step 1: Attempting to create user ${adminEmail}`);
  
  try {
    // Try to sign up
    const { data, error } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          full_name: adminName
        }
      }
    });
    
    if (error) {
      if (error.message.includes('already registered')) {
        console.log('ℹ️  User already exists');
        console.log('   You should try signing in instead');
      } else {
        console.error('❌ Sign up failed:', error.message);
        console.log('   This might be a temporary issue. Try again.');
      }
    } else {
      console.log('✅ Sign up request sent successfully');
      console.log('   Check your email for a confirmation link');
      console.log('   User ID (if available):', data.user?.id);
    }
  } catch (error) {
    console.error('❌ Sign up exception:', error.message);
  }
  
  console.log('\n📝 Next Steps:');
  console.log('1. Check your email for a confirmation link from Supabase');
  console.log('2. Click the confirmation link to activate your account');
  console.log('3. After confirming, sign in through the application');
  console.log('4. Open browser console (F12)');
  console.log('5. Type: window.grantEmergencyAdmin() and press Enter');
  console.log('6. Refresh the page');
  
  console.log('\n🔧 Alternative if email confirmation fails:');
  console.log('1. Go to http://localhost:8082/direct-login');
  console.log('2. Use the credentials:');
  console.log(`   - Email: ${adminEmail}`);
  console.log(`   - Password: ${adminPassword}`);
  console.log('3. After logging in, use the emergency admin method above');
  
  console.log('\n📋 If this also fails:');
  console.log('1. Try signing up through the application UI manually');
  console.log('2. Use any email and password combination');
  console.log('3. After signing in, use window.grantEmergencyAdmin()');
}

// Run the script
tryDifferentEmail().catch(console.error);