// Fix Admin Role Script
// Run this in the browser console to fix admin role issues

/**
 * Diagnose and fix admin role issues for the current user
 */
async function diagnoseAndFixAdminRole() {
  console.log('🔍 Diagnosing admin role issues...');
  
  // Check if Supabase client is available
  if (!window.supabase) {
    console.error('❌ Supabase client not available');
    return false;
  }
  
  // Get current user
  const { data: { user }, error: userError } = await window.supabase.auth.getUser();
  if (userError || !user) {
    console.error('❌ Not logged in or error getting user:', userError?.message || 'Not logged in');
    return false;
  }
  
  console.log('✅ Current user:', user.email);
  
  // Check if profile exists
  console.log('🔍 Checking for existing profile...');
  const { data: profile, error: profileError } = await window.supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (profileError && profileError.code !== 'PGRST116') {
    console.error('❌ Error fetching profile:', profileError.message);
    return false;
  }
  
  if (!profile) {
    console.log('⚠️ No profile found, creating one with admin role...');
    const { data: newProfile, error: createError } = await window.supabase
      .from('profiles')
      .insert([
        {
          user_id: user.id,
          full_name: user.user_metadata?.full_name || user.email || 'Admin User',
          role: 'admin'
        }
      ])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating profile:', createError.message);
      return false;
    }
    
    console.log('✅ Profile created successfully with admin role:', newProfile);
    console.log('🔄 Refresh the page to see changes');
    return true;
  }
  
  console.log('✅ Profile found:', profile);
  
  // Check current role
  if (profile.role === 'admin') {
    console.log('✅ User is already an admin');
    return true;
  }
  
  // Update role to admin
  console.log('🔧 Updating role to admin...');
  const { data: updatedProfile, error: updateError } = await window.supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('user_id', user.id)
    .select()
    .single();
  
  if (updateError) {
    console.error('❌ Error updating profile:', updateError.message);
    return false;
  }
  
  console.log('✅ Profile updated to admin role:', updatedProfile);
  console.log('🔄 Refresh the page to see changes');
  return true;
}

/**
 * Force admin role by first deleting any existing profile and creating a new one
 */
async function forceAdminRole() {
  console.log('🔧 Forcing admin role...');
  
  // Check if Supabase client is available
  if (!window.supabase) {
    console.error('❌ Supabase client not available');
    return false;
  }
  
  // Get current user
  const { data: { user }, error: userError } = await window.supabase.auth.getUser();
  if (userError || !user) {
    console.error('❌ Not logged in or error getting user:', userError?.message || 'Not logged in');
    return false;
  }
  
  console.log('✅ Current user:', user.email);
  
  // Delete existing profile if it exists
  console.log('🗑️ Deleting existing profile (if any)...');
  const { error: deleteError } = await window.supabase
    .from('profiles')
    .delete()
    .eq('user_id', user.id);
  
  if (deleteError) {
    console.error('❌ Error deleting profile:', deleteError.message);
    // Continue anyway as the profile might not exist
  }
  
  // Create new profile with admin role
  console.log('🆕 Creating new profile with admin role...');
  const fullName = user.user_metadata?.full_name || user.email || 'Admin User';
  const { data: newProfile, error: createError } = await window.supabase
    .from('profiles')
    .insert([
      {
        user_id: user.id,
        full_name: fullName,
        role: 'admin'
      }
    ])
    .select()
    .single();
  
  if (createError) {
    console.error('❌ Error creating profile:', createError.message);
    return false;
  }
  
  console.log('✅ New profile created with admin role:', newProfile);
  console.log('🔄 Refresh the page to see changes');
  return true;
}

// Export functions
window.diagnoseAndFixAdminRole = diagnoseAndFixAdminRole;
window.forceAdminRole = forceAdminRole;

console.log('🔧 Admin Role Fix Scripts Loaded!');
console.log('');
console.log('Available functions:');
console.log('  diagnoseAndFixAdminRole() - Diagnose and fix admin role issues');
console.log('  forceAdminRole() - Force create admin profile (deletes existing first)');
console.log('');
console.log('Example usage:');
console.log('  await diagnoseAndFixAdminRole()');