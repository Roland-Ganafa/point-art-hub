#!/usr/bin/env node

/**
 * Point Art Hub Troubleshooting Script
 * Helps diagnose and fix common issues with the application
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Point Art Hub Troubleshooting Script');
console.log('=====================================\n');

// Function to check environment variables
function checkEnvFile() {
  console.log('🔍 Checking environment variables...');
  
  const envPath = join(__dirname, '.env');
  if (!existsSync(envPath)) {
    console.log('❌ .env file not found!');
    console.log('   Solution: Create a .env file with your Supabase credentials');
    console.log('   Example content:');
    console.log('   VITE_SUPABASE_URL=your_supabase_project_url');
    console.log('   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key\n');
    return false;
  }
  
  const envContent = readFileSync(envPath, 'utf8');
  const hasUrl = envContent.includes('VITE_SUPABASE_URL=');
  const hasKey = envContent.includes('VITE_SUPABASE_ANON_KEY=');
  
  if (!hasUrl || !hasKey) {
    console.log('❌ Missing Supabase credentials in .env file!');
    console.log('   Solution: Add both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY\n');
    return false;
  }
  
  console.log('✅ Environment variables found\n');
  return true;
}

// Function to check dependencies
function checkDependencies() {
  console.log('🔍 Checking dependencies...');
  
  const packagePath = join(__dirname, 'package.json');
  if (!existsSync(packagePath)) {
    console.log('❌ package.json not found!\n');
    return false;
  }
  
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  const dependencies = Object.keys(packageJson.dependencies || {});
  const devDependencies = Object.keys(packageJson.devDependencies || {});
  const allDeps = [...dependencies, ...devDependencies];
  
  const requiredDeps = [
    '@supabase/supabase-js',
    'react',
    'react-dom',
    'react-router-dom'
  ];
  
  const missingDeps = requiredDeps.filter(dep => !allDeps.includes(dep));
  
  if (missingDeps.length > 0) {
    console.log('❌ Missing required dependencies:', missingDeps.join(', '));
    console.log('   Solution: Run "npm install" to install all dependencies\n');
    return false;
  }
  
  console.log('✅ All required dependencies found\n');
  return true;
}

// Function to check migration status
function checkMigrations() {
  console.log('🔍 Checking database migrations...');
  
  const migrationsPath = join(__dirname, 'supabase', 'migrations');
  if (!existsSync(migrationsPath)) {
    console.log('❌ Migrations directory not found!');
    console.log('   Solution: Ensure the supabase/migrations directory exists\n');
    return false;
  }
  
  const migrations = readFileSync(migrationsPath, { withFileTypes: true })
    .filter(dirent => dirent.isFile() && dirent.name.endsWith('.sql'))
    .map(dirent => dirent.name);
  
  if (migrations.length === 0) {
    console.log('❌ No migration files found!');
    console.log('   Solution: Add migration files to supabase/migrations\n');
    return false;
  }
  
  console.log(`✅ Found ${migrations.length} migration files\n`);
  return true;
}

// Function to reset development mode
function resetDevelopmentMode() {
  console.log('🔧 Resetting development mode...');
  
  // This would normally interact with localStorage, but in Node.js we can't
  // Instead, we'll provide instructions
  console.log('   To reset development mode:');
  console.log('   1. Open your browser');
  console.log('   2. Open developer tools (F12)');
  console.log('   3. Go to Application/Storage tab');
  console.log('   4. Clear localStorage items:');
  console.log('      - mock_auth_active');
  console.log('      - mock_user');
  console.log('   5. Refresh the page\n');
}

// Function to check for common issues
function checkCommonIssues() {
  console.log('🔍 Checking for common issues...\n');
  
  // Check if we're in the right directory
  const requiredFiles = ['.env', 'package.json', 'src'];
  const missingFiles = requiredFiles.filter(file => !existsSync(join(__dirname, file)));
  
  if (missingFiles.length > 0) {
    console.log('❌ Required files/directories missing:', missingFiles.join(', '));
    console.log('   Solution: Make sure you are in the project root directory\n');
    return false;
  }
  
  console.log('✅ Project structure looks correct\n');
  return true;
}

// Main troubleshooting function
async function troubleshoot() {
  console.log('Starting troubleshooting process...\n');
  
  const checks = [
    checkCommonIssues,
    checkEnvFile,
    checkDependencies,
    checkMigrations
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    const result = check();
    if (result === false) {
      allPassed = false;
    }
  }
  
  if (allPassed) {
    console.log('🎉 All checks passed! Your setup looks good.');
    console.log('\nIf you are still experiencing issues:');
    console.log('1. Check the browser console for specific error messages');
    console.log('2. Refer to the TROUBLESHOOTING.md file for detailed guidance');
    console.log('3. Try clearing your browser cache and localStorage');
    console.log('4. Restart the development server');
  } else {
    console.log('⚠️  Some issues were detected. Please review the suggestions above.');
    console.log('\nFor more detailed troubleshooting, please refer to the TROUBLESHOOTING.md file.');
  }
  
  console.log('\n🔧 Additional tools:');
  console.log('- Run "npm run dev" to start the development server');
  console.log('- Run "npm run build" to build the production version');
  console.log('- Run "npm test" to run tests');
  console.log('- Navigate to /auth/diagnostic in the app for enhanced diagnostics');
}

// Run the troubleshooter
troubleshoot().catch(console.error);