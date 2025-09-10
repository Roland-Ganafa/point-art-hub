/**
 * Authentication Troubleshooter Utility
 * Helps diagnose and resolve common authentication and connection issues
 */

interface DiagnosticResult {
  passed: boolean;
  message: string;
  severity: 'info' | 'warning' | 'error';
  fix?: string;
}

export class AuthTroubleshooter {
  static async runDiagnostics(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];
    
    // Check 1: Environment variables
    const envCheck = this.checkEnvironmentVariables();
    results.push(envCheck);
    
    // Check 2: Network connectivity
    const networkCheck = await this.checkNetworkConnectivity();
    results.push(networkCheck);
    
    // Check 3: Supabase client initialization
    const clientCheck = this.checkSupabaseClient();
    results.push(clientCheck);
    
    // Check 4: Storage access
    const storageCheck = this.checkStorageAccess();
    results.push(storageCheck);
    
    return results;
  }
  
  private static checkEnvironmentVariables(): DiagnosticResult {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        passed: false,
        message: 'Missing Supabase environment variables',
        severity: 'error',
        fix: 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file'
      };
    }
    
    // Validate URL format
    if (!supabaseUrl.startsWith('https://')) {
      return {
        passed: false,
        message: 'Invalid Supabase URL format',
        severity: 'error',
        fix: 'Supabase URL should start with https://'
      };
    }
    
    return {
      passed: true,
      message: 'Environment variables are properly configured',
      severity: 'info'
    };
  }
  
  private static async checkNetworkConnectivity(): Promise<DiagnosticResult> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (!supabaseUrl) {
      return {
        passed: false,
        message: 'Cannot check network - Supabase URL missing',
        severity: 'error'
      };
    }
    
    try {
      // Test with a timeout to avoid hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      return {
        passed: true,
        message: 'Network connectivity to Supabase is working',
        severity: 'info'
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          passed: false,
          message: 'Network request timed out (5s)',
          severity: 'error',
          fix: 'Check your internet connection or Supabase project status'
        };
      }
      
      return {
        passed: false,
        message: `Network connectivity failed: ${error.message}`,
        severity: 'error',
        fix: 'Check your internet connection and firewall settings'
      };
    }
  }
  
  private static checkSupabaseClient(): DiagnosticResult {
    try {
      // Try to import and initialize the Supabase client
      const clientModule = require('../integrations/supabase/client');
      const supabase = clientModule.supabase;
      
      if (!supabase) {
        return {
          passed: false,
          message: 'Supabase client failed to initialize',
          severity: 'error',
          fix: 'Check the supabase/client.ts file for errors'
        };
      }
      
      return {
        passed: true,
        message: 'Supabase client initialized successfully',
        severity: 'info'
      };
    } catch (error: any) {
      return {
        passed: false,
        message: `Supabase client error: ${error.message}`,
        severity: 'error',
        fix: 'Check the supabase/client.ts file for configuration errors'
      };
    }
  }
  
  private static checkStorageAccess(): DiagnosticResult {
    try {
      // Test localStorage access
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      return {
        passed: true,
        message: 'Storage access is working properly',
        severity: 'info'
      };
    } catch (error: any) {
      return {
        passed: false,
        message: `Storage access error: ${error.message}`,
        severity: 'error',
        fix: 'Check browser storage permissions or try clearing site data'
      };
    }
  }
  
  static async attemptRecovery(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];
    
    // Attempt 1: Refresh session
    try {
      const clientModule = require('../integrations/supabase/client');
      const supabase = clientModule.supabase;
      
      if (supabase) {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
          results.push({
            passed: false,
            message: `Session refresh failed: ${error.message}`,
            severity: 'warning'
          });
        } else {
          results.push({
            passed: true,
            message: 'Session refreshed successfully',
            severity: 'info'
          });
        }
      }
    } catch (error: any) {
      results.push({
        passed: false,
        message: `Recovery attempt failed: ${error.message}`,
        severity: 'error'
      });
    }
    
    return results;
  }
  
  static getTroubleshootingGuide(): string[] {
    return [
      "1. Check your .env file for correct Supabase credentials",
      "2. Verify your Supabase project is active and accessible",
      "3. Ensure you have a stable internet connection",
      "4. Check browser console for specific error messages",
      "5. Try clearing browser cache and site data",
      "6. Verify firewall settings are not blocking connections",
      "7. Check if your Supabase project region matches your location",
      "8. Ensure your Supabase project has the correct database schema"
    ];
  }
}

export default AuthTroubleshooter;