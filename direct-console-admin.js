// Direct Console Admin Access
// Copy and paste this entire block into your browser console and press Enter

(async function grantAdminAccess() {
  console.log('🔐 Attempting to grant admin access...');
  
  // Check if we're in the right environment
  if (typeof window === 'undefined') {
    console.error('❌ This script must be run in a browser console');
    return;
  }
  
  // Try to find the Supabase client
  let supabase = null;
  
  // Method 1: Check if it's directly available
  if (typeof window.supabase !== 'undefined') {
    supabase = window.supabase;
    console.log('✅ Found Supabase client in window.supabase');
  }
  
  // Method 2: Try to access through the app
  if (!supabase) {
    // Look for Supabase in common places
    const candidates = [
      window.app?.supabase,
      window.App?.supabase,
      window.pointArtHub?.supabase,
      window.supabaseClient
    ];
    
    for (const candidate of candidates) {
      if (candidate) {
        supabase = candidate;
        console.log('✅ Found Supabase client in application object');
        break;
      }
    }
  }
  
  // Method 3: If still not found, try a different approach
  if (!supabase) {
    console.log('ℹ️ Trying alternative method to access Supabase...');
    
    // Try to get session info through localStorage
    try {
      const authData = localStorage.getItem('point-art-hub-auth');
      if (authData) {
        const auth = JSON.parse(authData);
        if (auth?.session?.user) {
          console.log('📧 Current user:', auth.session.user.email);
        }
      }
    } catch (e) {
      console.log('ℹ️ Could not parse auth data from localStorage');
    }
  }
  
  // Try to use the built-in grantEmergencyAdmin function
  if (typeof window.grantEmergencyAdmin === 'function') {
    console.log('🔧 Using built-in grantEmergencyAdmin function...');
    try {
      const result = await window.grantEmergencyAdmin();
      if (result) {
        console.log('✅ Admin access granted via built-in function!');
        console.log('🔄 Please refresh the page to see admin features');
        return true;
      } else {
        console.log('❌ Built-in function failed');
      }
    } catch (error) {
      console.error('❌ Error calling built-in function:', error);
    }
  } else {
    console.log('ℹ️ Built-in grantEmergencyAdmin function not available');
  }
  
  // If we still don't have Supabase client, show instructions
  if (!supabase) {
    console.log('💡 To manually grant admin access:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to Table Editor');
    console.log('3. Open the "profiles" table');
    console.log('4. Find your user record');
    console.log('5. Edit the "role" field to "admin"');
    console.log('6. Save changes');
    console.log('7. Refresh this page');
    return false;
  }
  
  // If we have Supabase client, try to get session and update profile
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
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
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('user_id', session.user.id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error updating profile:', error);
      console.log('💡 This might be due to RLS policies.');
      console.log('💡 Try running the remove-rls.sql script in your Supabase SQL editor.');
      return false;
    }
    
    console.log('✅ Admin access granted!');
    console.log('👤 Updated profile:', data);
    console.log('🔄 Please refresh the page to see admin features');
    
    return true;
  } catch (error) {
    console.error('❌ Error granting admin access:', error);
    return false;
  }
})();

console.log('🚀 Admin access script executed. Check the results above.');