// Emergency Admin Access Recovery Script
// Specifically designed for ganafaroland@gmail.com
// Run this in the browser console while logged in

console.log('🔐 Admin Access Recovery Tool');
console.log('================================');
console.log('Target Account: ganafaroland@gmail.com');
console.log('');

async function fixMyAdminAccess() {
  console.log('🚀 Starting admin access recovery...\n');
  
  // Step 1: Verify environment
  console.log('Step 1: Verifying environment...');
  if (typeof window === 'undefined') {
    console.error('❌ ERROR: Must run in browser console');
    return false;
  }
  
  // Check for Supabase client
  const supabase = window.supabase;
  if (!supabase) {
    console.error('❌ ERROR: Supabase client not found');
    console.log('💡 Make sure you are on the Point Art Hub website');
    return false;
  }
  console.log('✅ Supabase client found\n');
  
  try {
    // Step 2: Check current session
    console.log('Step 2: Checking authentication session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session Error:', sessionError.message);
      return false;
    }
    
    if (!session || !session.user) {
      console.error('❌ ERROR: No active session');
      console.log('💡 Please log in first with ganafaroland@gmail.com');
      return false;
    }
    
    console.log('✅ Logged in as:', session.user.email);
    console.log('   User ID:', session.user.id);
    
    // Verify correct account
    if (session.user.email !== 'ganafaroland@gmail.com') {
      console.warn('⚠️  WARNING: You are not logged in as ganafaroland@gmail.com');
      console.log('   Current account:', session.user.email);
      console.log('💡 Please log out and sign in with ganafaroland@gmail.com');
      return false;
    }
    console.log('✅ Correct account verified\n');
    
    // Step 3: Check profile
    console.log('Step 3: Checking user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Profile Error:', profileError.message);
      return false;
    }
    
    if (!profile) {
      console.log('⚠️  No profile found - creating one...');
      
      // Create profile with admin role
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{
          user_id: session.user.id,
          full_name: 'Roland Ganafa',
          role: 'admin',
          sales_initials: 'RG'
        }])
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Failed to create profile:', createError.message);
        return false;
      }
      
      console.log('✅ Profile created with admin role');
      console.log('   Profile:', newProfile);
    } else {
      console.log('✅ Profile found');
      console.log('   Name:', profile.full_name);
      console.log('   Current Role:', profile.role);
      console.log('   Sales Initials:', profile.sales_initials);
      
      // Step 4: Update to admin if needed
      if (profile.role !== 'admin') {
        console.log('\nStep 4: Granting admin access...');
        
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('user_id', session.user.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('❌ Failed to update role:', updateError.message);
          console.log('\n💡 Troubleshooting:');
          console.log('   1. Check database policies in Supabase dashboard');
          console.log('   2. Verify RLS policies allow profile updates');
          console.log('   3. Try using the Emergency Admin button in the UI');
          return false;
        }
        
        console.log('✅ Admin role granted!');
        console.log('   Updated profile:', updatedProfile);
      } else {
        console.log('✅ Already has admin role\n');
      }
    }
    
    // Step 5: Verify admin access
    console.log('\nStep 5: Verifying admin access...');
    const { data: finalProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();
    
    if (finalProfile?.role === 'admin') {
      console.log('✅ Admin access verified!\n');
      console.log('=================================');
      console.log('✨ SUCCESS! Admin access restored');
      console.log('=================================\n');
      console.log('Next steps:');
      console.log('1. Refresh the page (F5)');
      console.log('2. Look for the Admin button in the header');
      console.log('3. You should now have full admin access');
      console.log('\n🔄 Refreshing page in 3 seconds...\n');
      
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
      return true;
    } else {
      console.error('❌ Verification failed - role is:', finalProfile?.role);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check browser console for errors');
    console.log('   2. Verify internet connection');
    console.log('   3. Check Supabase credentials in .env');
    console.log('   4. Try the alternative method: window.grantEmergencyAdmin()');
    return false;
  }
}

// Alternative method using the built-in function
async function useBuiltInEmergencyAdmin() {
  console.log('🔧 Using built-in emergency admin function...\n');
  
  if (typeof window.grantEmergencyAdmin === 'function') {
    const success = await window.grantEmergencyAdmin();
    if (success) {
      console.log('✅ Emergency admin access granted!');
      console.log('🔄 Refreshing page...');
      setTimeout(() => window.location.reload(), 2000);
    } else {
      console.error('❌ Failed to grant emergency admin access');
    }
  } else {
    console.error('❌ Emergency admin function not available');
    console.log('💡 Try running: fixMyAdminAccess()');
  }
}

// Quick status check
async function checkMyAdminStatus() {
  console.log('🔍 Quick Admin Status Check\n');
  
  const supabase = window.supabase;
  if (!supabase) {
    console.error('❌ Supabase not available');
    return;
  }
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('❌ Not logged in');
      return;
    }
    
    console.log('Email:', session.user.email);
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role, sales_initials')
      .eq('user_id', session.user.id)
      .single();
    
    if (profile) {
      console.log('Name:', profile.full_name);
      console.log('Role:', profile.role);
      console.log('Admin:', profile.role === 'admin' ? '✅ YES' : '❌ NO');
      
      if (profile.role !== 'admin') {
        console.log('\n💡 Run fixMyAdminAccess() to get admin access');
      }
    } else {
      console.log('❌ No profile found');
      console.log('💡 Run fixMyAdminAccess() to create admin profile');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Export functions to global scope
window.fixMyAdminAccess = fixMyAdminAccess;
window.useBuiltInEmergencyAdmin = useBuiltInEmergencyAdmin;
window.checkMyAdminStatus = checkMyAdminStatus;

// Show instructions
console.log('📋 Available Commands:');
console.log('================================');
console.log('checkMyAdminStatus()         - Check current status');
console.log('fixMyAdminAccess()           - Fix admin access (recommended)');
console.log('useBuiltInEmergencyAdmin()   - Use alternative method');
console.log('');
console.log('🚀 Quick Start: Run checkMyAdminStatus() first');
console.log('');
