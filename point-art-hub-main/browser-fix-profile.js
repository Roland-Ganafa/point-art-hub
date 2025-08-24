/**
 * Browser Console Profile Fix Script
 * 
 * Copy and paste this into your browser console while logged into Point Art Hub
 * to fix missing profile information.
 * 
 * Instructions:
 * 1. Open Point Art Hub in your browser (you should be logged in)
 * 2. Open Developer Tools (F12)
 * 3. Go to Console tab
 * 4. Paste this entire script and press Enter
 */

(async function fixUserProfile() {
  console.log('🔧 Point Art Hub - Profile Fix Tool');
  console.log('══════════════════════════════════');

  try {
    // Import Supabase directly since we can't access the app's instance reliably
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    
    // Use hardcoded credentials (should match your .env file)
    const supabaseUrl = 'https://uizibdtiuvjjikbrkdcv.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpemliZHRpdXZqamlrYnJrZGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NzAxOTYsImV4cCI6MjA3MTQ0NjE5Nn0.iM8TEX8uCSrC-krRGeBguyVO6Kl7tQdt4kBgumrmcFw';
    
    console.log('🔗 Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('❌ No active session found. Please log in first.');
      return;
    }

    const currentUser = session.user;
    console.log(`👤 Current user: ${currentUser.email}`);

    // Get all profiles to determine roles
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (allProfilesError) {
      console.error('❌ Could not fetch profiles:', allProfilesError.message);
      return;
    }

    // Get current user's profile
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();

    if (profileError) {
      console.error('❌ Could not fetch user profile:', profileError.message);
      return;
    }

    console.log('\n🎯 Current profile status:');
    console.log(`   Name: ${currentProfile.full_name || 'Not set'}`);
    console.log(`   Role: ${currentProfile.role || 'Not assigned'}`);
    console.log(`   Initials: ${currentProfile.sales_initials || 'Not assigned'}`);

    // Determine what needs to be updated
    const updates = {};
    
    // Fix missing full name
    if (!currentProfile.full_name || currentProfile.full_name === 'Unknown User') {
      const emailName = currentUser.email.split('@')[0];
      const displayName = emailName.split('.').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' ');
      updates.full_name = displayName;
      console.log(`✓ Will set name to: ${displayName}`);
    }
    
    // Assign admin role if first user or no admin exists
    const hasAdmin = allProfiles.some(p => p.role === 'admin');
    const isFirstUser = allProfiles.length === 1 || 
                       allProfiles.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0].user_id === currentUser.id;
    
    if (!currentProfile.role || (!hasAdmin && isFirstUser)) {
      updates.role = isFirstUser || !hasAdmin ? 'admin' : 'user';
      console.log(`✓ Will assign role: ${updates.role}`);
    }
    
    // Assign sales initials if missing
    if (!currentProfile.sales_initials) {
      const name = updates.full_name || currentProfile.full_name || currentUser.email.split('@')[0];
      const initials = name.split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 3) || 'USR';
      
      updates.sales_initials = initials;
      console.log(`✓ Will assign initials: ${initials}`);
    }

    if (Object.keys(updates).length === 0) {
      console.log('\n✅ Profile is already properly configured!');
      return;
    }

    console.log('\n🔄 Updating profile...');
    
    // Apply updates
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', currentUser.id);

    if (updateError) {
      console.error('❌ Failed to update profile:', updateError.message);
      return;
    }

    console.log('✅ Profile updated successfully!');
    
    console.log('\n🎉 Profile fix completed!');
    console.log('═══════════════════════════════════');
    if (updates.full_name) console.log(`📝 Name set to: ${updates.full_name}`);
    if (updates.role) console.log(`🛡️ Role assigned: ${updates.role}`);
    if (updates.sales_initials) console.log(`🏷️ Initials assigned: ${updates.sales_initials}`);
    
    console.log('\n🔄 Refreshing page to apply changes...');
    setTimeout(() => {
      window.location.reload();
    }, 2000);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.log('\n💡 Alternative solutions:');
    console.log('1. Try refreshing the page and running again');
    console.log('2. Sign out and sign back in');
    console.log('3. Contact system administrator');
  }
})();