// Simple Emergency Admin Access Script
// Copy and paste this directly into your browser console

(function() {
  console.log('🚨 Simple Emergency Admin Access');

  // Function to grant emergency admin access
  async function simpleEmergencyAdminAccess() {
    console.log('🔧 Attempting to grant emergency admin access...');
    
    // First, try to get the session
    try {
      // Try different ways to access the Supabase client
      let supabaseClient = null;
      
      // Method 1: Try to import the client
      try {
        const clientModule = await import('./src/integrations/supabase/client.ts');
        supabaseClient = clientModule.supabase;
        console.log('✅ Supabase client imported successfully');
      } catch (importError) {
        console.log('ℹ️ Could not import Supabase client directly');
      }
      
      // Method 2: Check if it's already available globally
      if (!supabaseClient && typeof supabase !== 'undefined') {
        supabaseClient = supabase;
        console.log('✅ Found Supabase client in global scope');
      }
      
      // Method 3: Try to access through window (if attached by another script)
      if (!supabaseClient && typeof window !== 'undefined' && window.supabase) {
        supabaseClient = window.supabase;
        console.log('✅ Found Supabase client in window object');
      }
      
      // Method 4: Try to access through the app's internal structure
      if (!supabaseClient) {
        // Try to find Supabase client in common locations
        const possibleLocations = [
          window.app?.supabase,
          window.App?.supabase,
          window.pointArtHub?.supabase
        ];
        
        for (const location of possibleLocations) {
          if (location) {
            supabaseClient = location;
            console.log('✅ Found Supabase client in application object');
            break;
          }
        }
      }
      
      if (!supabaseClient) {
        console.error('❌ Could not access Supabase client');
        console.log('💡 Please ensure you are running this on the application page');
        console.log('💡 Try refreshing the page and running this script again');
        return false;
      }
      
      // Get the current session
      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        return false;
      }
      
      if (!session) {
        console.error('❌ No active session. Please log in first.');
        return false;
      }
      
      console.log('📧 Current user:', session.user.email);
      
      // Update the user's profile to admin
      const { data, error } = await supabaseClient
        .from('profiles')
        .update({ role: 'admin' })
        .eq('user_id', session.user.id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error updating profile:', error);
        console.log('💡 This might be due to RLS policies. Try running the remove-rls.sql script first.');
        console.log('💡 You can also try using the built-in grantEmergencyAdmin function if available:');
        console.log('   typeof window.grantEmergencyAdmin === "function" && window.grantEmergencyAdmin()');
        return false;
      }
      
      console.log('✅ Emergency admin access granted!');
      console.log('👤 Updated profile:', data);
      console.log('🔄 Please refresh the page to see admin features');
      
      return true;
    } catch (error) {
      console.error('❌ Error in emergency admin access:', error);
      return false;
    }
  }

  // Make the function available globally
  window.simpleEmergencyAdminAccess = simpleEmergencyAdminAccess;

  console.log('🚀 Emergency admin function ready!');
  console.log('🔧 Run: simpleEmergencyAdminAccess() to grant yourself admin access');
  console.log('📝 Note: You must be logged in to the application first');
  
  // Also provide a direct method using the built-in function if available
  console.log('🔧 Alternative: If window.grantEmergencyAdmin is available, run:');
  console.log('   window.grantEmergencyAdmin()');
})();