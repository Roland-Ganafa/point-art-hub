#!/usr/bin/env node

/**
 * Supabase Client Test Script
 * 
 * This script tests the Supabase client configuration and authentication
 * exactly as the frontend does.
 * Run with: node test-supabase-client.js
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

// Read environment variables exactly as the frontend does
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

console.log('🔍 Supabase Client Test');
console.log('======================');
console.log('Environment Variables:');
console.log(`VITE_SUPABASE_URL: ${SUPABASE_URL ? 'SET' : 'NOT SET'}`);
console.log(`VITE_SUPABASE_ANON_KEY: ${SUPABASE_PUBLISHABLE_KEY ? 'SET' : 'NOT SET'}`);
console.log(`ADMIN_EMAIL: ${adminEmail ? 'SET' : 'NOT SET'}`);
console.log(`ADMIN_PASSWORD: ${adminPassword ? 'SET' : 'NOT SET'}`);

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('❌ Missing required environment variables:');
  if (!SUPABASE_URL) console.error('   - VITE_SUPABASE_URL');
  if (!SUPABASE_PUBLISHABLE_KEY) console.error('   - VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create custom storage handler exactly as in the frontend
const storage = {
  getItem: (key) => {
    try {
      if (typeof global !== 'undefined') {
        // For Node.js environment, we don't have localStorage
        return null;
      }
    } catch (error) {
      console.error('Error accessing storage:', error);
    }
    return null;
  },
  setItem: (key, value) => {
    try {
      if (typeof global !== 'undefined') {
        // For Node.js environment, we don't have localStorage
        return;
      }
    } catch (error) {
      console.error('Error writing to storage:', error);
    }
  },
  removeItem: (key) => {
    try {
      if (typeof global !== 'undefined') {
        // For Node.js environment, we don't have localStorage
        return;
      }
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  },
};

// Custom fetch implementation exactly as in the frontend
const customFetch = async (url, options = {}) => {
  // Increase timeout for better reliability
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
  
  try {
    // Ensure proper Content-Type for JSON requests
    const headers = {
      ...options.headers,
      'apikey': SUPABASE_PUBLISHABLE_KEY, // Include the API key
      'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`, // Include as Authorization header
      'X-Client-Info': 'point-art-hub/1.0',
    };
    
    // If we're sending JSON data, make sure Content-Type is set correctly
    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
      try {
        JSON.parse(options.body);
        headers['Content-Type'] = 'application/json';
      } catch (e) {
        // Not JSON, don't set Content-Type
      }
    }
    
    const response = await fetch(url, { 
      ...options, 
      signal: controller.signal,
      headers
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    // Log timeout errors specifically
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Request timeout after 15 seconds:', url);
      throw new Error('REQUEST_TIMEOUT');
    }
    throw error;
  }
};

// Create Supabase client exactly as in the frontend
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: storage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Enhanced session-related options
    storageKey: 'point-art-hub-auth',
    debug: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'point-art-hub/1.0',
      'X-Connection-Quality': 'high',
    },
    fetch: customFetch, // Use our custom fetch implementation
  },
  db: {
    schema: 'public',
  },
  // Reduce timeout settings for faster feedback
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  }
});

async function testAuthentication() {
  console.log('\n🔍 Testing Authentication...');
  
  if (!adminEmail || !adminPassword) {
    console.error('❌ Admin credentials not found in environment variables');
    process.exit(1);
  }
  
  console.log(`Testing with email: ${adminEmail}`);
  
  try {
    // This mimics exactly what Auth.tsx does
    console.log('Attempting to sign in with password...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });
    
    if (error) {
      console.error('❌ Authentication failed:', error);
      console.error('Error code:', error.status);
      console.error('Error message:', error.message);
      
      // Additional debugging
      if (error.message.includes('Invalid login credentials')) {
        console.log('\n🔍 Detailed Analysis:');
        console.log('This error typically means:');
        console.log('1. Wrong email or password');
        console.log('2. User account does not exist');
        console.log('3. User account is disabled');
        console.log('4. Network connectivity issues');
        console.log('5. Supabase project configuration issues');
      }
      
      return false;
    } else {
      console.log('✅ Authentication successful!');
      console.log('User ID:', data.user.id);
      console.log('Email:', data.user.email);
      console.log('Session token length:', data.session.access_token.length);
      return true;
    }
  } catch (error) {
    console.error('❌ Authentication exception:', error);
    return false;
  }
}

// Run the test
testAuthentication().then(success => {
  if (success) {
    console.log('\n🎉 Authentication test completed successfully!');
  } else {
    console.log('\n❌ Authentication test failed!');
    console.log('\n💡 Troubleshooting steps:');
    console.log('1. Verify the email and password are correct');
    console.log('2. Check if the user exists in Supabase Auth');
    console.log('3. Ensure the Supabase project is properly configured');
    console.log('4. Check network connectivity');
    console.log('5. Try resetting the user password');
  }
});