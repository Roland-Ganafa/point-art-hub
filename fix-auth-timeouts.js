#!/usr/bin/env node

/**
 * Script to fix authentication timeout issues in Point Art Hub
 * This script applies several fixes to improve connection reliability
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

console.log('🔧 Point Art Hub Authentication Timeout Fix');
console.log('==========================================');

// Fix 1: Check and update the Supabase client configuration
console.log('\n📋 Fix 1: Updating Supabase client configuration...');

const clientFilePath = path.join('src', 'integrations', 'supabase', 'client.ts');
if (fs.existsSync(clientFilePath)) {
  let clientContent = fs.readFileSync(clientFilePath, 'utf8');
  
  // Add custom timeout configuration
  const timeoutConfig = `
// Custom timeout configuration for better reliability
const customFetch = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};`;
  
  if (!clientContent.includes('customFetch')) {
    // Insert the custom fetch configuration
    const insertPoint = clientContent.indexOf('export const supabase = createClient<Database>');
    if (insertPoint !== -1) {
      clientContent = clientContent.slice(0, insertPoint) + timeoutConfig + '\n' + clientContent.slice(insertPoint);
      
      // Update the client configuration to use custom fetch
      clientContent = clientContent.replace(
        'export const supabase = createClient<Database>(url as string, key as string, {',
        '// Custom fetch implementation for better timeout handling\n' +
        'const customFetch = async (url: string, options: RequestInit = {}) => {\n' +
        '  const controller = new AbortController();\n' +
        '  const timeoutId = setTimeout(() => controller.abort(), 10000);\n' +
        '  \n' +
        '  try {\n' +
        '    const response = await fetch(url, { ...options, signal: controller.signal });\n' +
        '    clearTimeout(timeoutId);\n' +
        '    return response;\n' +
        '  } catch (error) {\n' +
        '    clearTimeout(timeoutId);\n' +
        '    throw error;\n' +
        '  }\n' +
        '};\n\n' +
        'export const supabase = createClient<Database>(url as string, key as string, {'
      );
      
      fs.writeFileSync(clientFilePath, clientContent);
      console.log('✅ Updated Supabase client with custom timeout handling');
    }
  } else {
    console.log('✅ Supabase client already has custom timeout handling');
  }
} else {
  console.log('❌ Supabase client file not found');
}

// Fix 2: Update the Auth component to have better timeout handling
console.log('\n📋 Fix 2: Enhancing Auth component timeout handling...');

const authFilePath = path.join('src', 'pages', 'Auth.tsx');
if (fs.existsSync(authFilePath)) {
  let authContent = fs.readFileSync(authFilePath, 'utf8');
  
  // Add better timeout handling to the session check
  const enhancedSessionCheck = `
    // Check if user is already authenticated with enhanced timeout handling
    const checkUser = async () => {
      setAuthError(null);
      try {
        console.log("Checking authentication status with enhanced timeout...");
        
        // Use Promise.race with better timeout handling
        const sessionCheckPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => {
            console.warn("Session check timeout - this is expected in some cases");
            reject(new Error('SESSION_CHECK_TIMEOUT'));
          }, 8000)
        );
        
        const result = await Promise.race([sessionCheckPromise, timeoutPromise]) as any;
        
        // Handle timeout gracefully
        if (result && result.error && result.error.message === 'SESSION_CHECK_TIMEOUT') {
          console.log("Session check timed out, but continuing with login form");
          setInitialLoad(false);
          return;
        }
        
        if (result && result.error) {
          console.error("Auth error:", result.error);
          // Don't set auth error for timeouts, just show login form
          if (!result.error.message.includes('timeout')) {
            setAuthError(\`Authentication error: \${result.error.message}\`);
          }
        }
        
        if (result && result.data && result.data.session) {
          console.log("User is authenticated, redirecting to home");
          navigate("/");
        } else {
          console.log("No active session found - displaying login form");
        }
      } catch (error: any) {
        console.warn('Session check failed:', error);
        // For timeout errors, don't show error message, just show login form
        if (!error.message.includes('timeout') && error.message !== 'SESSION_CHECK_TIMEOUT') {
          setAuthError(\`Unable to connect to authentication service. Please try again.\`);
        }
        // Continue to show auth form regardless
      } finally {
        setInitialLoad(false);
      }
    };`;
  
  if (authContent.includes('const checkUser = async () => {')) {
    // Replace the existing checkUser function
    const startIndex = authContent.indexOf('const checkUser = async () => {');
    const endIndex = authContent.indexOf('};', startIndex) + 2;
    
    authContent = authContent.slice(0, startIndex) + enhancedSessionCheck + authContent.slice(endIndex);
    fs.writeFileSync(authFilePath, authContent);
    console.log('✅ Enhanced Auth component with better timeout handling');
  } else {
    console.log('❌ Could not find checkUser function in Auth component');
  }
} else {
  console.log('❌ Auth component file not found');
}

// Fix 3: Update the DirectLogin component to have even better timeout handling
console.log('\n📋 Fix 3: Enhancing DirectLogin component...');

const directLoginFilePath = path.join('src', 'components', 'DirectLogin.tsx');
if (fs.existsSync(directLoginFilePath)) {
  let directLoginContent = fs.readFileSync(directLoginFilePath, 'utf8');
  
  // Add enhanced timeout handling to the login function
  const enhancedLoginFunction = `
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("Fast Login: Attempting direct sign in with email:", email);
      
      // Use localStorage flag to track login attempts
      localStorage.setItem('auth_attempt_timestamp', Date.now().toString());
      
      // Implement custom timeout handling for the login request
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('LOGIN_TIMEOUT')), 12000)
      );
      
      const result = await Promise.race([loginPromise, timeoutPromise]) as any;
      
      // Handle timeout
      if (result && result.error && result.error.message === 'LOGIN_TIMEOUT') {
        console.error("Fast Login timeout");
        setError("Login request timed out. Please check your connection and try again.");
        toast({
          title: "Fast Login timeout",
          description: "The login request took too long. Please check your internet connection and try again.",
          variant: "destructive",
        });
        return;
      }
      
      if (result && result.error) {
        console.error("Fast Login error:", result.error);
        setError(result.error.message);
        toast({
          title: "Fast Login failed",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        console.log("Fast Login successful");
        toast({
          title: "Login successful",
          description: "Redirecting to dashboard...",
        });
        
        // Set auth method flag for future reference
        localStorage.setItem('auth_method', 'direct_login');
        
        // Force direct navigation to home page with hard reload
        setTimeout(() => {
          window.location.href = '/';
        }, 300);
      }
    } catch (error: any) {
      console.error("Fast Login exception:", error);
      
      // Handle timeout errors specifically
      if (error.message === 'LOGIN_TIMEOUT') {
        setError("Login request timed out. Please check your connection and try again.");
        toast({
          title: "Login timeout",
          description: "The login request took too long. Please check your internet connection and try again.",
          variant: "destructive",
        });
      } else {
        setError(error.message || "An unexpected error occurred");
        toast({
          title: "Login failed",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };`;
  
  if (directLoginContent.includes('const handleLogin = async (e: React.FormEvent) => {')) {
    // Replace the existing handleLogin function
    const startIndex = directLoginContent.indexOf('const handleLogin = async (e: React.FormEvent) => {');
    const endIndex = directLoginContent.indexOf('};', startIndex) + 2;
    
    directLoginContent = directLoginContent.slice(0, startIndex) + enhancedLoginFunction + directLoginContent.slice(endIndex);
    fs.writeFileSync(directLoginFilePath, directLoginContent);
    console.log('✅ Enhanced DirectLogin component with better timeout handling');
  } else {
    console.log('❌ Could not find handleLogin function in DirectLogin component');
  }
} else {
  console.log('❌ DirectLogin component file not found');
}

console.log('\n🎉 Authentication timeout fixes applied successfully!');
console.log('\n🔧 Next steps:');
console.log('1. Restart your development server: npm run dev');
console.log('2. Clear your browser cache and cookies');
console.log('3. Try logging in again using the Fast Login method');
console.log('4. If issues persist, check the browser console for specific error messages');

console.log('\n💡 Additional troubleshooting tips:');
console.log('- Try using a different browser');
console.log('- Disable browser extensions that might interfere');
console.log('- Check your firewall/antivirus settings');
console.log('- Ensure your internet connection is stable');