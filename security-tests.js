/**
 * Security Test Script for Point Art Hub
 * Tests authentication, authorization, and data security
 */

import fs from 'fs';
import path from 'path';

// Colors for console output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

const log = {
  success: (msg) => console.log(`${GREEN}✓ SUCCESS: ${msg}${RESET}`),
  error: (msg) => console.log(`${RED}✗ ERROR: ${msg}${RESET}`),
  warn: (msg) => console.log(`${YELLOW}⚠ WARNING: ${msg}${RESET}`),
  info: (msg) => console.log(`ℹ INFO: ${msg}`),
};

/**
 * Tests environment variables security
 */
function testEnvironmentVariables() {
  log.info('\n--- Testing Environment Variables ---');
  
  try {
    // Check if .env file exists and contains sensitive information
    
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      log.success('.env file exists');
      
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n').filter(line => line.trim() !== '');
      
      // Check for required environment variables
      const hasSupabaseUrl = envLines.some(line => line.startsWith('VITE_SUPABASE_URL='));
      const hasSupabaseKey = envLines.some(line => line.startsWith('VITE_SUPABASE_ANON_KEY='));
      
      if (hasSupabaseUrl) {
        log.success('VITE_SUPABASE_URL is configured in .env file');
      } else {
        log.error('VITE_SUPABASE_URL is missing from .env file!');
      }
      
      if (hasSupabaseKey) {
        log.success('VITE_SUPABASE_ANON_KEY is configured in .env file');
      } else {
        log.error('VITE_SUPABASE_ANON_KEY is missing from .env file!');
      }
      
      // Check for emergency admin access configuration
      const hasEmergencyAdmin = envLines.some(line => line.startsWith('VITE_ENABLE_EMERGENCY_ADMIN=true'));
      if (hasEmergencyAdmin) {
        log.error('SECURITY RISK: Emergency admin access is enabled in .env file!');
        log.info('This should only be enabled during development or emergency situations');
      } else {
        log.success('Emergency admin access is not explicitly enabled in .env file');
      }
    } else {
      log.error('.env file not found!');
      log.info('Make sure to create an .env file based on .env.example');
    }
  } catch (error) {
    log.error(`Error checking environment variables: ${error.message}`);
  }
}

/**
 * Tests secure storage practices
 */
function testSecureStorage() {
  log.info('\n--- Testing Secure Storage Practices ---');
  
  try {
    // Check for hardcoded credentials in the codebase
    
    const sensitivePatterns = [
      /password\s*[:=]\s*['"]([^'"]+)['"]/, 
      /apiKey\s*[:=]\s*['"]([^'"]+)['"]/, 
      /secret\s*[:=]\s*['"]([^'"]+)['"]/, 
      /token\s*[:=]\s*['"]([^'"]+)['"]/, 
    ];
    
    const srcDir = path.join(process.cwd(), 'src');
    if (!fs.existsSync(srcDir)) {
      log.error('src directory not found!');
      return;
    }
    
    const files = getAllFiles(srcDir, ['.js', '.jsx', '.ts', '.tsx']);
    let hardcodedCredentialsFound = false;
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      
      for (const pattern of sensitivePatterns) {
        const match = content.match(pattern);
        if (match && !content.includes('process.env') && !content.includes('import.meta.env')) {
          log.error(`Potential hardcoded credential in ${path.relative(process.cwd(), file)}`);
          hardcodedCredentialsFound = true;
          break;
        }
      }
    }
    
    if (!hardcodedCredentialsFound) {
      log.success('No obvious hardcoded credentials found in the codebase');
    }
  } catch (error) {
    log.error(`Error checking for hardcoded credentials: ${error.message}`);
  }
}

/**
 * Recursively gets all files with specified extensions
 */
function getAllFiles(dir, extensions) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && file !== 'node_modules' && file !== 'dist') {
      results = results.concat(getAllFiles(filePath, extensions));
    } else if (stat.isFile() && extensions.some(ext => file.endsWith(ext))) {
      results.push(filePath);
    }
  }
  
  return results;
}

/**
 * Tests for auth-related security issues in the codebase
 */
function testAuthImplementation() {
  log.info('\n--- Testing Authentication Implementation ---');
  
  try {
    
    // Look for the Supabase client configuration
    const supabaseClientPath = path.join(process.cwd(), 'src', 'integrations', 'supabase', 'client.ts');
    
    if (fs.existsSync(supabaseClientPath)) {
      log.success('Supabase client configuration file found');
      
      const content = fs.readFileSync(supabaseClientPath, 'utf8');
      
      // Check for proper environment variable usage
      if (content.includes('import.meta.env.VITE_SUPABASE_URL') && 
          content.includes('import.meta.env.VITE_SUPABASE_ANON_KEY')) {
        log.success('Supabase client uses environment variables for configuration');
      } else {
        log.error('Supabase client may not be using environment variables for configuration');
      }
      
      // Check for proper authentication options
      if (content.includes('persistSession: true') && 
          content.includes('autoRefreshToken: true')) {
        log.success('Supabase client has proper session persistence and token refresh');
      } else {
        log.warn('Supabase client may not have proper session persistence or token refresh');
      }
      
      // Check for PKCE flow (more secure than implicit flow)
      if (content.includes('flowType: \'pkce\'')) {
        log.success('Supabase client uses PKCE flow for better security');
      } else {
        log.warn('Supabase client may not be using PKCE flow');
      }
    } else {
      log.error('Supabase client configuration file not found!');
    }
    
    // Check for UserContext implementation
    const userContextPath = path.join(process.cwd(), 'src', 'contexts', 'UserContext.tsx');
    
    if (fs.existsSync(userContextPath)) {
      log.success('User context file found');
      
      const content = fs.readFileSync(userContextPath, 'utf8');
      
      // Check for proper session management
      if (content.includes('getSession()') && content.includes('onAuthStateChange')) {
        log.success('User context properly manages authentication state');
      } else if (content.includes('getSession()')) {
        log.warn('User context gets session but may not properly handle auth state changes');
      } else {
        log.error('User context may not properly manage authentication state');
      }
      
      // Check for role-based access control
      if (content.includes('isAdmin') && (content.includes('\'admin\'') || content.includes('"admin"'))) {
        log.success('User context implements role-based access control');
      } else {
        log.warn('User context may not implement proper role-based access control');
      }
      
      // Check for emergency admin function security
      if (content.includes('grantEmergencyAdmin') && 
          content.includes('role: \'admin\'') && 
          content.includes('if (!user)')) {
        log.success('Emergency admin function has basic security checks');
      } else if (content.includes('grantEmergencyAdmin')) {
        log.error('Emergency admin function may not have proper security checks');
      }
    } else {
      log.error('User context file not found!');
    }
  } catch (error) {
    log.error(`Error checking authentication implementation: ${error.message}`);
  }
}

/**
 * Tests database security implementation
 */
function testDatabaseSecurity() {
  log.info('\n--- Testing Database Security Implementation ---');
  
  try {
    
    // Check for SQL migrations to ensure RLS is implemented
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    
    if (fs.existsSync(migrationsDir)) {
      log.success('Database migrations directory found');
      
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .map(file => path.join(migrationsDir, file));
      
      if (migrationFiles.length === 0) {
        log.warn('No SQL migration files found');
        return;
      }
      
      let rlsEnabled = false;
      let policiesCreated = false;
      
      for (const file of migrationFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('ENABLE ROW LEVEL SECURITY')) {
          rlsEnabled = true;
        }
        
        if (content.includes('CREATE POLICY')) {
          policiesCreated = true;
        }
      }
      
      if (rlsEnabled) {
        log.success('Row Level Security (RLS) is enabled in migrations');
      } else {
        log.error('Row Level Security (RLS) may not be enabled in migrations');
      }
      
      if (policiesCreated) {
        log.success('RLS policies are created in migrations');
      } else {
        log.error('RLS policies may not be created in migrations');
      }
    } else {
      log.error('Database migrations directory not found!');
    }
  } catch (error) {
    log.error(`Error checking database security: ${error.message}`);
  }
}

/**
 * Tests for proper input validation and sanitization
 */
function testInputValidation() {
  log.info('\n--- Testing Input Validation ---');
  
  try {
    
    let validationFound = false;
    const srcDir = path.join(process.cwd(), 'src');
    
    if (!fs.existsSync(srcDir)) {
      log.error('src directory not found!');
      return;
    }
    
    const files = getAllFiles(srcDir, ['.js', '.jsx', '.ts', '.tsx']);
    
    // Check for common validation patterns
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('zod') || 
          content.includes('yup') || 
          content.includes('validator') || 
          (content.includes('validate') && content.includes('form')) ||
          content.includes('required') && content.includes('input')) {
        validationFound = true;
        break;
      }
    }
    
    if (validationFound) {
      log.success('Input validation appears to be implemented');
    } else {
      log.warn('Could not detect clear evidence of input validation');
      log.info('Ensure all user inputs are properly validated');
    }
  } catch (error) {
    log.error(`Error checking input validation: ${error.message}`);
  }
}

/**
 * Run all security tests
 */
function runSecurityTests() {
  console.log('\n=== POINT ART HUB SECURITY TESTS ===\n');
  
  try {
    testEnvironmentVariables();
    testSecureStorage();
    testAuthImplementation();
    testDatabaseSecurity();
    testInputValidation();
    
    console.log('\n=== SECURITY TEST SUMMARY ===');
    console.log('Note: These tests provide a basic security assessment.');
    console.log('For a comprehensive security audit, additional tests and professional review are recommended.');
  } catch (error) {
    console.error('\n=== SECURITY TEST FAILED ===');
    console.error('Error:', error);
  }
}

// Run the tests
runSecurityTests();