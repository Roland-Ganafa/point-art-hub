#!/usr/bin/env node

/**
 * Environment Variables Check Script
 * 
 * This script checks if the environment variables are properly loaded.
 * Run with: node check-env-variables.js
 */

import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const result = config({ path: join(__dirname, '.env') });

console.log('🔍 Environment Variables Check');
console.log('============================');

if (result.error) {
  console.error('❌ Error loading .env file:', result.error);
  process.exit(1);
}

console.log('✅ .env file loaded successfully');
console.log('Loaded variables count:', Object.keys(result.parsed).length);

// Check specific variables
const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD'
];

console.log('\n📋 Required Variables Check:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: SET (${value.length} characters)`);
    
    // Additional validation for URL
    if (varName === 'VITE_SUPABASE_URL') {
      if (value.startsWith('https://')) {
        console.log('   📡 URL format: Valid');
      } else {
        console.log('   ⚠️  URL format: Invalid (should start with https://)');
      }
    }
    
    // Additional validation for keys
    if (varName.includes('KEY') && value.length < 20) {
      console.log('   ⚠️  Key length: Potentially too short');
    }
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

// Check for hidden characters or formatting issues
console.log('\n🔍 Detailed Variable Analysis:');
Object.entries(result.parsed).forEach(([key, value]) => {
  // Check for hidden characters
  const hiddenChars = value.match(/[\u0000-\u001F\u007F-\u009F]/g);
  if (hiddenChars) {
    console.log(`⚠️  ${key} contains hidden characters:`, hiddenChars);
  }
  
  // Check for leading/trailing whitespace
  if (value !== value.trim()) {
    console.log(`⚠️  ${key} has leading/trailing whitespace`);
  }
});

console.log('\n📋 All Loaded Variables:');
Object.entries(process.env).forEach(([key, value]) => {
  if (key.startsWith('VITE_') || key.includes('SUPABASE') || key.includes('ADMIN')) {
    console.log(`${key}=${value ? value.substring(0, 30) + (value.length > 30 ? '...' : '') : 'undefined'}`);
  }
});