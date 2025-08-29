// Script to check and fix admin role for ganafaroland@gmail
// Run this in the browser console when logged in as ganafaroland@gmail

async function checkAndFixAdminRole() {
  console.log('🔍 Checking admin role for current user...');
  
  try {
    // Get current user session
    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error getting session:', sessionError);
      return;
    }
    
    if (!session) {
      console.error('❌ No active session found. Please log in first.');
      return;
    }
    
    const currentUser = session.user;
    console.log('📧 Current user email:', currentUser.email);
    console.log('🆔 Current user ID:', currentUser.id);
    
    // Check if this is the ganafaroland@gmail user
    if (currentUser.email !== 'ganafaroland@gmail.com') {
      console.log('⚠️  This script is specifically for ganafaroland@gmail.com');
      console.log('   Current user:', currentUser.email);
      return;
    }
    
    // Get current profile
    const { data: currentProfile, error: profileError } = await window.supabase
      .from('profiles')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();
    
    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      return;
    }
    
    console.log('👤 Current profile:', currentProfile);
    console.log('🔐 Current role:', currentProfile?.role || 'No role assigned');
    
    // Check if role is already admin
    if (currentProfile?.role === 'admin') {
      console.log('✅ User already has admin role! The issue might be elsewhere.');
      console.log('   Check if the page has been refreshed or if UserContext is loading correctly.');
      
      // Check UserContext state
      if (window.React && window.ReactDOM) {
        console.log('🔄 Suggestion: Try refreshing the page to reload UserContext');
      }
      return;
    }
    
    // Get all profiles to check if there are other admins
    const { data: allProfiles, error: allProfilesError } = await window.supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (allProfilesError) {
      console.error('❌ Error fetching all profiles:', allProfilesError);
      return;
    }
    
    console.log('📊 Total users in system:', allProfiles.length);
    const adminUsers = allProfiles.filter(p => p.role === 'admin');
    console.log('👑 Current admin users:', adminUsers.length);
    
    if (adminUsers.length > 0) {
      console.log('👑 Existing admins:');
      adminUsers.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.full_name} (${admin.user_id})`);
      });
    }
    
    // Assign admin role to ganafaroland@gmail
    console.log('🔧 Assigning admin role to ganafaroland@gmail...');
    
    const { data: updatedProfile, error: updateError } = await window.supabase
      .from('profiles')
      .update({ 
        role: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', currentUser.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      return;
    }
    
    console.log('✅ Successfully assigned admin role!');
    console.log('📄 Updated profile:', updatedProfile);
    console.log('');
    console.log('🔄 Please refresh the page to see the admin button.');
    console.log('   The admin button should now appear in the header.');
    
    // Suggest page refresh
    if (confirm('Admin role has been assigned! Would you like to refresh the page now to see the changes?')) {
      window.location.reload();
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Export to window for easy access
window.checkAndFixAdminRole = checkAndFixAdminRole;

console.log('🛠️  Admin Role Fix Script Loaded!');
console.log('📞 To check and fix admin role, run: checkAndFixAdminRole()');
console.log('⚠️  Make sure you are logged in as ganafaroland@gmail.com first!');

// Auto-run if we're in the right context
if (typeof window !== 'undefined' && window.supabase) {
  console.log('🔍 Supabase detected, ready to run checks...');
  console.log('🚀 Run checkAndFixAdminRole() to start the fix process');
} else {
  console.log('⚠️  Supabase not detected. Make sure you run this in the browser console on the Point Art Hub website.');
}