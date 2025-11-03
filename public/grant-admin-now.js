// Direct Admin Grant Script
// Run this in browser console while logged in as ganafaroland@gmail.com

(async function grantAdminNow() {
  console.log('🚀 Starting admin grant process...');
  console.log('Target: ganafaroland@gmail.com');
  console.log('');
  
  // Check for Supabase client
  if (!window.supabase) {
    console.error('❌ Supabase client not found!');
    console.log('Make sure you are on Point Art Hub');
    return;
  }
  
  try {
    // Step 1: Get current session
    console.log('Step 1: Getting current session...');
    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return;
    }
    
    if (!session) {
      console.error('❌ No session found. Please log in first.');
      return;
    }
    
    console.log('✅ Session found:', session.user.email);
    const userId = session.user.id;
    console.log('✅ User ID:', userId);
    console.log('');
    
    // Step 2: Check current profile
    console.log('Step 2: Checking current profile...');
    const { data: currentProfile, error: fetchError } = await window.supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching profile:', fetchError);
    }
    
    if (currentProfile) {
      console.log('✅ Profile found:');
      console.log('   - Name:', currentProfile.full_name);
      console.log('   - Current Role:', currentProfile.role || 'undefined');
      console.log('   - ID:', currentProfile.id);
      console.log('');
    } else {
      console.log('⚠️  No profile found - will create one');
      console.log('');
    }
    
    // Step 3: Update or create profile with admin role
    if (currentProfile) {
      console.log('Step 3: Updating profile to admin...');
      const { data: updatedProfile, error: updateError } = await window.supabase
        .from('profiles')
        .update({ 
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Error updating profile:', updateError);
        console.log('');
        console.log('💡 Trying alternative method...');
        
        // Alternative: Try using upsert
        const { data: upsertData, error: upsertError } = await window.supabase
          .from('profiles')
          .upsert({ 
            user_id: userId,
            full_name: currentProfile.full_name || session.user.email,
            role: 'admin'
          }, { 
            onConflict: 'user_id' 
          })
          .select()
          .single();
        
        if (upsertError) {
          console.error('❌ Upsert also failed:', upsertError);
          return;
        }
        
        console.log('✅ Admin role granted via upsert!');
        console.log('Updated profile:', upsertData);
      } else {
        console.log('✅ Admin role granted successfully!');
        console.log('Updated profile:', updatedProfile);
      }
    } else {
      console.log('Step 3: Creating new profile with admin role...');
      const { data: newProfile, error: createError } = await window.supabase
        .from('profiles')
        .insert([{
          user_id: userId,
          full_name: session.user.user_metadata?.full_name || session.user.email || 'Roland Ganafa',
          role: 'admin',
          sales_initials: 'RG'
        }])
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating profile:', createError);
        return;
      }
      
      console.log('✅ New admin profile created!');
      console.log('Profile:', newProfile);
    }
    
    console.log('');
    console.log('═══════════════════════════════════');
    console.log('✨ SUCCESS! Admin access granted!');
    console.log('═══════════════════════════════════');
    console.log('');
    console.log('Next steps:');
    console.log('1. Refresh the page (F5)');
    console.log('2. Look for the Admin button');
    console.log('3. You should now have full admin access');
    console.log('');
    console.log('🔄 Auto-refreshing in 3 seconds...');
    
    setTimeout(() => {
      window.location.reload();
    }, 3000);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('');
    console.log('💡 Please try:');
    console.log('1. Checking your internet connection');
    console.log('2. Verifying you are logged in');
    console.log('3. Running the script again');
  }
})();

console.log('Script loaded. Granting admin access...');
