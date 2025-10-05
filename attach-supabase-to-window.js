// Script to attach Supabase client to window object for emergency admin access
// Run this in the browser console after the app has loaded

console.log('🔧 Attaching Supabase client to window object...');

// Import the Supabase client
import('/src/integrations/supabase/client.ts')
  .then((module) => {
    // Attach the supabase client to the window object
    window.supabase = module.supabase;
    console.log('✅ Supabase client attached to window.supabase');
    
    // Also attach the grantEmergencyAdmin function if it exists
    if (typeof window.grantEmergencyAdmin === 'function') {
      console.log('✅ grantEmergencyAdmin function is available at window.grantEmergencyAdmin');
    } else {
      console.log('⚠️ grantEmergencyAdmin function not yet available, it will be attached when UserContext loads');
    }
    
    console.log('🚀 You can now use emergency admin functions:');
    console.log('   window.grantEmergencyAdmin() - Grant emergency admin access');
    console.log('   window.makeCurrentUserAdmin() - Force set admin role');
    console.log('   window.checkAdminStatusAndFix() - Check your admin status');
  })
  .catch((error) => {
    console.error('❌ Failed to attach Supabase client:', error);
    
    // Fallback: Try to access the client through other means
    console.log('🔄 Trying alternative method...');
    
    // Try to get the client from the existing application
    if (typeof supabase !== 'undefined') {
      window.supabase = supabase;
      console.log('✅ Supabase client found and attached to window.supabase');
    } else {
      console.log('❌ Could not find Supabase client in the application');
      console.log('💡 Try refreshing the page and running this script again');
    }
  });