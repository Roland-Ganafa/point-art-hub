/**
 * Authentication Debugger Utility
 * 
 * This utility provides functions to debug authentication issues in the browser console.
 * To use, import this file in your browser console or add it to the window object.
 */

// Import the Supabase client
import { supabase } from '@/integrations/supabase/client';

// Enhanced authentication debugger
export const authDebugger = {
  // Check current session status
  async checkSession() {
    try {
      console.log('🔍 Checking current session...');
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Session check failed:', error);
        return { success: false, error };
      }
      
      console.log('✅ Session check completed');
      console.log('Session data:', data);
      
      if (data?.session) {
        console.log('✅ Active session found');
        console.log('User ID:', data.session.user?.id);
        console.log('User email:', data.session.user?.email);
        return { success: true, session: data.session };
      } else {
        console.log('ℹ️ No active session');
        return { success: true, session: null };
      }
    } catch (error) {
      console.error('❌ Session check exception:', error);
      return { success: false, error };
    }
  },
  
  // Test authentication with specific credentials
  async testAuth(email: string, password: string) {
    try {
      console.log(`🔍 Testing authentication for ${email}...`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Authentication test failed:', error);
        return { success: false, error };
      }
      
      console.log('✅ Authentication test successful');
      console.log('User data:', data.user);
      console.log('Session data:', data.session);
      
      return { success: true, data };
    } catch (error) {
      console.error('❌ Authentication test exception:', error);
      return { success: false, error };
    }
  },
  
  // Force refresh the session
  async refreshSession() {
    try {
      console.log('🔄 Refreshing session...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Session refresh failed:', error);
        return { success: false, error };
      }
      
      console.log('✅ Session refresh completed');
      console.log('Refreshed session:', data.session);
      
      return { success: true, data };
    } catch (error) {
      console.error('❌ Session refresh exception:', error);
      return { success: false, error };
    }
  },
  
  // Sign out and clear all auth data
  async signOut() {
    try {
      console.log('🚪 Signing out...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Sign out failed:', error);
        return { success: false, error };
      }
      
      console.log('✅ Signed out successfully');
      localStorage.clear();
      sessionStorage.clear();
      
      return { success: true };
    } catch (error) {
      console.error('❌ Sign out exception:', error);
      return { success: false, error };
    }
  },
  
  // Get user profile
  async getProfile() {
    try {
      console.log('👤 Getting user profile...');
      
      // First get the current user
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Failed to get session:', sessionError);
        return { success: false, error: sessionError };
      }
      
      if (!sessionData?.session?.user) {
        console.log('ℹ️ No authenticated user found');
        return { success: true, profile: null };
      }
      
      const userId = sessionData.session.user.id;
      console.log('User ID:', userId);
      
      // Get the profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (profileError) {
        console.error('❌ Profile fetch failed:', profileError);
        return { success: false, error: profileError };
      }
      
      console.log('✅ Profile fetched successfully');
      console.log('Profile data:', profileData);
      
      return { success: true, profile: profileData };
    } catch (error) {
      console.error('❌ Profile fetch exception:', error);
      return { success: false, error };
    }
  },
  
  // Run comprehensive diagnostics
  async runDiagnostics() {
    console.log('🔬 Running comprehensive authentication diagnostics...');
    
    // Check environment
    console.log('\n1. Environment Check:');
    console.log('Supabase client available:', !!supabase);
    
    // Check session
    console.log('\n2. Session Check:');
    const sessionResult = await this.checkSession();
    
    // If we have a session, check profile
    if (sessionResult.success && sessionResult.session) {
      console.log('\n3. Profile Check:');
      await this.getProfile();
    }
    
    console.log('\n📋 Diagnostics completed');
  }
};

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).authDebugger = authDebugger;
  
  // Also make supabase available globally for direct access
  (window as any).supabase = supabase;
}

export default authDebugger;