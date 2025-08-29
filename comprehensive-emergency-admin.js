// Comprehensive Emergency Admin Access Script
// This script provides multiple methods to diagnose and fix admin access issues

console.log('🔧 Comprehensive Emergency Admin Access Script');
console.log('=============================================');

// Function to check current admin status with detailed information
async function checkAdminStatusDetailed() {
  console.log('🔍 Checking admin status with detailed information...');
  
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    console.error('❌ This script must be run in a browser console');
    return;
  }
  
  // Check if Supabase is available
  if (!window.supabase) {
    console.error('❌ Supabase client not found. Are you on the Point Art Hub website?');
    return;
  }
  
  try {
    // Get current session
    console.log('📡 Getting current session...');
    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return;
    }
    
    if (!session || !session.user) {
      console.error('❌ No active session found. Please log in first.');
      return;
    }
    
    console.log('✅ Session found for user:', session.user.email);
    console.log('🆔 User ID:', session.user.id);
    
    // Get user profile with detailed information
    console.log('👤 Fetching user profile...');
    const { data: profile, error: profileError } = await window.supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
      
    if (profileError) {
      console.error('❌ Profile fetch error:', profileError);
      return;
    }
    
    console.log('📄 Full profile data:', profile);
    console.log('🔐 Current role:', profile.role);
    console.log('📅 Profile created:', profile.created_at);
    console.log('🔄 Profile updated:', profile.updated_at);
    
    // Check admin status
    if (profile.role === 'admin') {
      console.log('✅ You ARE an admin!');
      console.log('✨ Admin privileges confirmed.');
    } else {
      console.log('❌ You are NOT an admin');
      console.log('🛠️ Current role:', profile.role);
      console.log('🔧 To fix this, run: makeAdminWithDebug()');
    }
    
    // Check localStorage for emergency admin flag
    const emergencyFlag = localStorage.getItem('emergency_admin');
    console.log('🚩 Emergency admin flag in localStorage:', emergencyFlag);
    
  } catch (error) {
    console.error('❌ Unexpected error during admin status check:', error);
  }
}

// Function to make current user admin with detailed debugging
async function makeAdminWithDebug() {
  console.log('👑 Attempting to make current user admin with debugging...');
  
  if (typeof window === 'undefined') {
    console.error('❌ This script must be run in a browser console');
    return;
  }
  
  if (!window.supabase) {
    console.error('❌ Supabase client not found');
    return;
  }
  
  try {
    // Get current session
    console.log('📡 Getting current session...');
    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return;
    }
    
    if (!session || !session.user) {
      console.error('❌ No active session found. Please log in first.');
      return;
    }
    
    console.log('✅ Session found for user:', session.user.email);
    console.log('🆔 User ID:', session.user.id);
    
    // Get current profile before update
    console.log('📄 Fetching current profile...');
    const { data: currentProfile, error: fetchError } = await window.supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
      
    if (fetchError) {
      console.error('❌ Error fetching current profile:', fetchError);
      return;
    }
    
    console.log('📄 Current profile:', currentProfile);
    
    // Update role to admin
    console.log('🔄 Updating role to admin...');
    const { data: updatedProfile, error: updateError } = await window.supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('user_id', session.user.id)
      .select()
      .single();
      
    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      console.log('💡 Troubleshooting tips:');
      console.log('   1. Check if you have the necessary permissions');
      console.log('   2. Verify the profiles table exists and is accessible');
      console.log('   3. Check Supabase database policies');
      return;
    }
    
    console.log('✅ Successfully updated profile to admin:', updatedProfile);
    
    // Set emergency admin flag in localStorage
    console.log('💾 Setting emergency admin flag in localStorage...');
    localStorage.setItem('emergency_admin', 'true');
    console.log('✅ Emergency admin flag set');
    
    // Verify the update
    console.log('🔍 Verifying update...');
    const { data: verifiedProfile, error: verifyError } = await window.supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();
      
    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
    } else {
      console.log('✅ Verified role:', verifiedProfile.role);
    }
    
    console.log('🔄 Refreshing page in 3 seconds to apply changes...');
    console.log('💡 If the admin button still doesn\'t appear after refresh:');
    console.log('   1. Clear browser cache and cookies');
    console.log('   2. Hard refresh (Ctrl+F5 or Cmd+Shift+R)');
    console.log('   3. Check browser console for errors');
    
    setTimeout(() => {
      window.location.reload();
    }, 3000);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('💡 If you\'re seeing errors, try:');
    console.log('   1. Checking your internet connection');
    console.log('   2. Verifying Supabase credentials in .env file');
    console.log('   3. Checking if the database is properly set up');
  }
}

// Function to clear emergency admin flag
function clearEmergencyAdminFlag() {
  console.log('🧹 Clearing emergency admin flag...');
  localStorage.removeItem('emergency_admin');
  console.log('✅ Emergency admin flag cleared');
}

// Function to show all available emergency functions
function showEmergencyFunctions() {
  console.log('📞 Available Emergency Admin Functions:');
  console.log('=====================================');
  console.log('checkAdminStatusDetailed() - Check your admin status with detailed info');
  console.log('makeAdminWithDebug() - Make current user admin with debugging');
  console.log('clearEmergencyAdminFlag() - Clear the emergency admin flag');
  console.log('');
  console.log('🚀 Quick Start:');
  console.log('1. checkAdminStatusDetailed() - Check your current status');
  console.log('2. makeAdminWithDebug() - Make yourself admin if needed');
  console.log('');
  console.log('💡 Pro Tips:');
  console.log('- Run these functions in the browser console (F12 → Console tab)');
  console.log('- Always check your status before making changes');
  console.log('- Clear cache and hard refresh if changes don\'t appear');
}

// Export functions to global scope
window.checkAdminStatusDetailed = checkAdminStatusDetailed;
window.makeAdminWithDebug = makeAdminWithDebug;
window.clearEmergencyAdminFlag = clearEmergencyAdminFlag;
window.showEmergencyFunctions = showEmergencyFunctions;

// Show available functions on load
showEmergencyFunctions();

console.log('');
console.log('✅ Emergency Admin Script Ready!');
console.log('Type showEmergencyFunctions() to see all available functions');