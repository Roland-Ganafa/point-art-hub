/**
 * Create and Make Admin Script
 * 
 * This script attempts to create an auth user and make them admin.
 * Run with: node create-and-make-admin.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Read environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const adminName = process.env.ADMIN_NAME;

// Validate required environment variables
const requiredEnvVars = {
  'VITE_SUPABASE_URL': supabaseUrl,
  'VITE_SUPABASE_ANON_KEY': supabaseAnonKey,
  'ADMIN_EMAIL': adminEmail,
  'ADMIN_PASSWORD': adminPassword,
  'ADMIN_NAME': adminName
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.log('\n📝 Please add these to your .env file:');
  console.log('ADMIN_EMAIL=your-admin@example.com');
  console.log('ADMIN_PASSWORD=YourSecurePassword123!');
  console.log('ADMIN_NAME=Your Full Name');
  process.exit(1);
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
function isValidPassword(password) {
  // At least 8 characters, one uppercase, one lowercase, one number, one special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function attemptSignIn(email, password) {
  console.log('🔐 Attempting to sign in existing user...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.log('ℹ️  Sign in failed (user might not exist yet):', error.message);
      return null;
    }
    
    console.log('✅ Successfully signed in existing user');
    console.log('   User ID:', data.user?.id);
    return data.user;
  } catch (error) {
    console.log('ℹ️  Sign in exception:', error.message);
    return null;
  }
}

async function createAndMakeAdmin() {
  console.log('🚀 Create and Make Admin Process');
  console.log('==============================');
  
  // Validate input
  if (!isValidEmail(adminEmail)) {
    console.error('❌ Invalid email format:', adminEmail);
    process.exit(1);
  }
  
  if (!isValidPassword(adminPassword)) {
    console.error('❌ Password does not meet requirements:');
    console.error('   - At least 8 characters');
    console.error('   - One uppercase letter');
    console.error('   - One lowercase letter');
    console.error('   - One number');
    console.error('   - One special character (@$!%*?&)');
    process.exit(1);
  }
  
  console.log(`\n📧 Processing user: ${adminEmail}`);
  console.log(`👤 Name: ${adminName}`);
  
  // First, try to sign in (in case user already exists and is confirmed)
  const existingUser = await attemptSignIn(adminEmail, adminPassword);
  
  if (existingUser) {
    console.log('\n🎉 User already exists and is confirmed!');
    console.log('   You can proceed to make them admin.');
  } else {
    // Try to create new user
    console.log('\n📝 Step 1: Creating new user account...');
    
    try {
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
          console.log('ℹ️  User already exists but may need email confirmation');
          console.log('   Check your email or use the direct login option below');
        } else if (error.message.includes('Invalid email')) {
          console.error('❌ Invalid email address');
          process.exit(1);
        } else if (error.message.includes('Password')) {
          console.error('❌ Password error:', error.message);
          process.exit(1);
        } else {
          console.error('❌ Sign up failed:', error.message);
          console.log('   This might be a temporary issue. Try again later.');
        }
      } else {
        console.log('✅ Sign up request sent successfully');
        if (data.user?.email_confirmed_at) {
          console.log('✅ Email confirmed automatically');
        } else {
          console.log('📧 Check your email for a confirmation link');
        }
        console.log('   User ID:', data.user?.id);
      }
    } catch (error) {
      console.error('❌ Sign up exception:', error.message);
    }
  }
  
  console.log('\n🔧 Next Steps to Grant Admin Access:');
  console.log('=====================================');
  console.log('1. If you received a confirmation email, click the link first');
  console.log('2. Sign in through your application');
  console.log('3. Open browser console (F12 → Console tab)');
  console.log('4. Type: window.grantEmergencyAdmin() and press Enter');
  console.log('5. Refresh the page to see admin features');
  
  console.log('\n🚨 Alternative Direct Login (if email confirmation fails):');
  console.log('1. Go to: http://localhost:8082/direct-login');
  console.log('2. Use your credentials to log in');
  console.log('3. Follow steps 3-5 above');
  
  console.log('\n💡 Troubleshooting:');
  console.log('- If email confirmation link expires, you can resend it from the login page');
  console.log('- Make sure your email provider isn\'t blocking Supabase emails');
  console.log('- Check spam/junk folder for the confirmation email');
  console.log('- The direct login option bypasses email confirmation requirements');
}

// Handle script termination gracefully
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Script interrupted by user');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled promise rejection:', reason);
  process.exit(1);
});

// Run the script
console.log('🔄 Starting admin creation process...\n');
createAndMakeAdmin().catch((error) => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});