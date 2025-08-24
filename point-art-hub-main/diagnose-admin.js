// Direct database query script to check profiles and fix admin role
// Run this in browser console when logged in

async function diagnoseAdminIssue() {
  console.log('🔍 Diagnosing admin role issue...');
  console.log('=====================================');
  
  try {
    // Check if Supabase is available
    if (!window.supabase) {
      console.error('❌ Supabase not found. Make sure you\'re on the Point Art Hub website.');
      return;
    }
    
    // Get all profiles
    const { data: allProfiles, error: profilesError } = await window.supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }
    
    console.log('📊 Total profiles found:', allProfiles.length);
    console.log('');
    
    // Display all profiles
    console.log('👥 All user profiles:');
    allProfiles.forEach((profile, index) => {
      console.log(`${index + 1}. Name: ${profile.full_name || 'No name'}`);
      console.log(`   User ID: ${profile.user_id}`);
      console.log(`   Role: ${profile.role || 'No role'}`);
      console.log(`   Initials: ${profile.sales_initials || 'None'}`);
      console.log(`   Created: ${profile.created_at}`);
      console.log('   ---');
    });
    
    // Get current user session
    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error getting session:', sessionError);
      return;
    }
    
    if (!session) {
      console.error('❌ No active session. Please log in first.');
      return;
    }
    
    console.log('👤 Current logged-in user:');
    console.log(`   Email: ${session.user.email}`);
    console.log(`   User ID: ${session.user.id}`);
    
    // Find current user's profile
    const currentProfile = allProfiles.find(p => p.user_id === session.user.id);
    
    if (!currentProfile) {
      console.log('❌ No profile found for current user!');
      console.log('🔧 Creating profile...');
      
      // Create profile if it doesn't exist
      const { data: newProfile, error: createError } = await window.supabase
        .from('profiles')
        .insert({
          user_id: session.user.id,
          full_name: session.user.email.split('@')[0].replace('.', ' '),
          role: 'admin', // Assign admin role if this is ganafaroland@gmail
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating profile:', createError);
        return;
      }
      
      console.log('✅ Profile created:', newProfile);
    } else {
      console.log('✅ Current user profile found:');
      console.log(`   Name: ${currentProfile.full_name}`);
      console.log(`   Role: ${currentProfile.role}`);
      console.log(`   Initials: ${currentProfile.sales_initials}`);
    }
    
    // Check for ganafaroland@gmail specifically
    const ganaProfile = allProfiles.find(p => 
      // Check by email pattern (we might not have direct email access)
      p.full_name?.toLowerCase().includes('gana') || 
      p.user_id === session.user.id && session.user.email === 'ganafaroland@gmail.com'
    );
    
    if (session.user.email === 'ganafaroland@gmail.com') {
      console.log('');
      console.log('🎯 This is the ganafaroland@gmail account!');
      
      if (currentProfile?.role !== 'admin') {
        console.log('🔧 Fixing admin role...');
        
        const { data: updatedProfile, error: updateError } = await window.supabase
          .from('profiles')
          .update({ 
            role: 'admin',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', session.user.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('❌ Error updating role:', updateError);
        } else {
          console.log('✅ Admin role assigned successfully!');
          console.log('📄 Updated profile:', updatedProfile);
          console.log('');
          console.log('🔄 Refresh the page to see the admin button.');
        }
      } else {
        console.log('✅ Admin role is already assigned!');
        console.log('');
        console.log('🤔 If admin button is still missing, the issue might be:');
        console.log('   1. UserContext not refreshing properly');
        console.log('   2. Page needs to be refreshed');
        console.log('   3. Browser cache issue');
        console.log('');
        console.log('🔄 Try refreshing the page or clearing browser cache.');
      }
    }
    
    // Summary
    console.log('');
    console.log('📈 Summary:');
    const adminCount = allProfiles.filter(p => p.role === 'admin').length;
    const userCount = allProfiles.filter(p => p.role === 'user').length;
    const noRoleCount = allProfiles.filter(p => !p.role).length;
    
    console.log(`   👑 Admins: ${adminCount}`);
    console.log(`   👤 Users: ${userCount}`);
    console.log(`   ❓ No role: ${noRoleCount}`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Export functions
window.diagnoseAdminIssue = diagnoseAdminIssue;

// Also provide a quick fix function
window.forceAdminRole = async function() {
  try {
    const { data: { session } } = await window.supabase.auth.getSession();
    
    if (!session) {
      console.error('❌ Not logged in');
      return;
    }
    
    if (session.user.email !== 'ganafaroland@gmail.com') {
      console.error('❌ This function is only for ganafaroland@gmail.com');
      return;
    }
    
    const { data, error } = await window.supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('user_id', session.user.id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Admin role forced!', data);
      console.log('🔄 Refresh the page now.');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

console.log('🛠️  Admin Diagnosis Script Loaded!');
console.log('');
console.log('📞 Available functions:');
console.log('   • diagnoseAdminIssue() - Full diagnosis');
console.log('   • forceAdminRole() - Quick fix for ganafaroland@gmail');
console.log('');
console.log('🚀 Run diagnoseAdminIssue() to start!');