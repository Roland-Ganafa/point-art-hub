// Make Current User Admin Script
// Run this in your browser console (F12 -> Console tab) to make yourself an admin

async function makeCurrentUserAdmin() {
  console.log('🔧 Attempting to make current user an admin...');
  
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.error('❌ This script must be run in a browser console');
    return;
  }
  
  // Check if Supabase is available
  if (!window.supabase) {
    console.error('❌ Supabase client not found. Make sure you are on the Point Art Hub website.');
    return;
  }
  
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error getting session:', sessionError);
      return;
    }
    
    if (!session || !session.user) {
      console.error('❌ No active session found. Please log in first.');
      return;
    }
    
    console.log('✅ Current user:', session.user.email);
    
    // Get user profile
    const { data: profile, error: profileError } = await window.supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
      
    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      return;
    }
    
    console.log('👤 Current profile:', profile);
    
    // Update role to admin
    const { data: updatedProfile, error: updateError } = await window.supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('user_id', session.user.id)
      .select()
      .single();
      
    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      return;
    }
    
    console.log('✅ Successfully updated profile to admin:', updatedProfile);
    console.log('🔄 Refreshing page to apply changes...');
    
    // Set a flag in localStorage to preserve admin status on reload
    localStorage.setItem('emergency_admin', 'true');
    
    // Reload the page to reflect changes
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Also create a function to check admin status
async function checkAdminStatus() {
  console.log('🔍 Checking admin status...');
  
  if (typeof window === 'undefined') {
    console.error('❌ This script must be run in a browser console');
    return;
  }
  
  if (!window.supabase) {
    console.error('❌ Supabase client not found');
    return;
  }
  
  try {
    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error getting session:', sessionError);
      return;
    }
    
    if (!session || !session.user) {
      console.log('❌ No active session found');
      return;
    }
    
    console.log('📧 Current user:', session.user.email);
    
    const { data: profile, error: profileError } = await window.supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
      
    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      return;
    }
    
    console.log('👤 Profile:', profile);
    
    if (profile.role === 'admin') {
      console.log('✅ You ARE an admin!');
    } else {
      console.log('❌ You are NOT an admin');
      console.log('🛠️ To become admin, run: makeCurrentUserAdmin()');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Export functions to global scope
window.makeCurrentUserAdmin = makeCurrentUserAdmin;
window.checkAdminStatus = checkAdminStatus;

console.log('✅ Admin Management Scripts Loaded!');
console.log('');
console.log('Available functions:');
console.log('  makeCurrentUserAdmin() - Make current user an admin');
console.log('  checkAdminStatus() - Check current admin status');
console.log('');
console.log('Example usage:');
console.log('  makeCurrentUserAdmin()');