// Fix Admin Role Script
// This script will create or update your profile to have admin role
// Copy and paste this into your browser console

(async function fixAdminRole() {
  console.log('🔧 Fixing admin role for user: ganafaroland@gmail.com');
  
  // Try to access Supabase client
  let supabaseClient = null;
  
  // Method 1: Try to import the client
  try {
    const module = await import('/src/integrations/supabase/client.ts');
    supabaseClient = module.supabase;
    console.log('✅ Supabase client imported successfully');
  } catch (error) {
    console.log('ℹ️ Could not import Supabase client directly');
  }
  
  // Method 2: Check if available in window
  if (!supabaseClient && typeof window !== 'undefined' && window.supabase) {
    supabaseClient = window.supabase;
    console.log('✅ Found Supabase client in window object');
  }
  
  // Method 3: Try to access through the application
  if (!supabaseClient) {
    // Try common locations where Supabase might be stored
    const locations = [
      window.app?.supabase,
      window.App?.supabase,
      window.pointArtHub?.supabase
    ];
    
    for (const location of locations) {
      if (location) {
        supabaseClient = location;
        console.log('✅ Found Supabase client in application');
        break;
      }
    }
  }
  
  // If we still don't have Supabase client, provide manual instructions
  if (!supabaseClient) {
    console.log('❌ Could not access Supabase client automatically');
    console.log('📋 Manual steps to fix admin role:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Open the SQL Editor');
    console.log('3. Run this query:');
    console.log(`
-- First, check if profile exists
SELECT * FROM profiles WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'ganafaroland@gmail.com'
);

-- If profile exists, update role
UPDATE profiles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'ganafaroland@gmail.com'
);

-- If profile doesn't exist, create it
INSERT INTO profiles (user_id, full_name, role)
SELECT id, 'Ganafaro Land', 'admin'
FROM auth.users 
WHERE email = 'ganafaroland@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin';
    `);
    return;
  }
  
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return;
    }
    
    if (!session) {
      console.error('❌ No active session');
      return;
    }
    
    console.log('📧 Current user:', session.user.email);
    
    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching profile:', fetchError);
      // This might be due to RLS policies, try to bypass by removing RLS
      console.log('💡 This might be due to RLS policies. Try running remove-rls.sql first.');
      return;
    }
    
    if (existingProfile) {
      console.log('👤 Existing profile found:', existingProfile);
      
      // Update existing profile to admin
      const { data: updatedProfile, error: updateError } = await supabaseClient
        .from('profiles')
        .update({ role: 'admin' })
        .eq('user_id', session.user.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Error updating profile:', updateError);
        return;
      }
      
      console.log('✅ Profile updated successfully!');
      console.log('👤 Updated profile:', updatedProfile);
    } else {
      console.log('🆕 No existing profile found, creating new one...');
      
      // Create new profile with admin role
      const { data: newProfile, error: insertError } = await supabaseClient
        .from('profiles')
        .insert([
          {
            user_id: session.user.id,
            full_name: session.user.user_metadata?.full_name || session.user.email || 'Ganafaro Land',
            role: 'admin'
          }
        ])
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Error creating profile:', insertError);
        return;
      }
      
      console.log('✅ New profile created successfully!');
      console.log('👤 New profile:', newProfile);
    }
    
    console.log('🎉 Admin role has been set!');
    console.log('🔄 Please refresh the page to see admin features');
    
  } catch (error) {
    console.error('❌ Error in fixAdminRole:', error);
  }
})();

console.log('🚀 Admin role fix script executed. Check results above.');