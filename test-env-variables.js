#!/usr/bin/env node

/**
 * Script to test Point Art Hub environment variables
 * This script verifies if the environment variables are properly set
 */

import { config } from 'dotenv';

// Load environment variables
config();

// Check if environment variables are set
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Point Art Hub environment variables...');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase environment variables are not set.');
  console.error('Please ensure your .env file contains:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('✅ VITE_SUPABASE_URL: SET');
console.log('   Value:', supabaseUrl);
console.log('✅ VITE_SUPABASE_ANON_KEY: SET');
console.log('   Value: ***REDACTED***');
console.log('   Length:', supabaseKey.length);

console.log('\n🎉 Environment variables are properly configured!');