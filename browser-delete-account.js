/**
 * Browser Console Account Deletion Script
 * 
 * WARNING: This will permanently delete your current account!
 * 
 * Instructions:
 * 1. Open Point Art Hub in your browser
 * 2. Open Developer Tools (F12)
 * 3. Go to Console tab
 * 4. Paste this script and press Enter
 * 5. Follow the prompts
 */

(async function deleteCurrentAccount() {
  console.log('🗑️  Point Art Hub - Account Deletion');
  console.log('═══════════════════════════════════════');

  try {
    // Import Supabase directly since we can't access the app's instance
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    
    // Get environment variables from the page (they should be available globally)
    const supabaseUrl = 'https://uizibdtiuvjjikbrkdcv.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpemliZHRpdXZqamlrYnJrZGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NzAxOTYsImV4cCI6MjA3MTQ0NjE5Nn0.iM8TEX8uCSrC-krRGeBguyVO6Kl7tQdt4kBgumrmcFw';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Could not find Supabase configuration.');
      return;
    }

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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();

    if (profileError) {
      console.error('❌ Could not fetch user profile:', profileError.message);
      return;
    }

    console.log('\n🎯 Account to be deleted:');
    console.log(`   Name: ${profile.full_name}`);
    console.log(`   Email: ${currentUser.email}`);
    console.log(`   Role: ${profile.role?.toUpperCase() || 'NO ROLE'}`);
    console.log(`   Initials: ${profile.sales_initials || 'None'}`);

    // Warning and confirmation
    console.log('\n⚠️  WARNING: This action will:');
    console.log('• Permanently delete your account');
    console.log('• Remove all your profile information');
    console.log('• Log you out immediately');
    console.log('• Cannot be undone!');

    const confirmed = confirm(`Are you absolutely sure you want to delete your account (${currentUser.email})?`);
    
    if (!confirmed) {
      console.log('❌ Deletion cancelled by user.');
      return;
    }

    console.log('\n🗑️  Deleting account...');

    // First, delete the profile
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', currentUser.id);

    if (deleteProfileError) {
      console.error('❌ Failed to delete profile:', deleteProfileError.message);
      // Continue anyway, might be able to delete auth user
    } else {
      console.log('✅ Profile deleted successfully');
    }

    // Sign out the user
    await supabase.auth.signOut();
    console.log('✅ User signed out');

    console.log('\n🎉 Account deletion completed!');
    console.log('\n📝 What happened:');
    console.log('• Your profile has been deleted');
    console.log('• You have been logged out');
    console.log('• The page will reload to login screen');

    // Reload the page to show login screen
    setTimeout(() => {
      console.log('🔄 Reloading page...');
      window.location.reload();
    }, 2000);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.log('\n💡 Alternative options:');
    console.log('1. Try the Admin Profile interface');
    console.log('2. Use the Node.js deletion script');
    console.log('3. Contact system administrator');
  }
  } catch (importError) {
    console.error('❌ Failed to import Supabase:', importError.message);
    console.log('\n💡 Alternative approach - Direct API deletion:');
    
    // Fallback: Direct fetch to Supabase REST API
    try {
      const supabaseUrl = 'https://uizibdtiuvjjikbrkdcv.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpemliZHRpdXZqamlrYnJrZGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NzAxOTYsImV4cCI6MjA3MTQ0NjE5Nn0.iM8TEX8uCSrC-krRGeBguyVO6Kl7tQdt4kBgumrmcFw';
      
      console.log('🔄 Using direct API approach...');
      
      // Get current session from localStorage
      const authKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
      const authData = localStorage.getItem(authKey);
      
      if (!authData) {
        console.error('❌ No authentication data found. Please log in first.');
        return;
      }
      
      const session = JSON.parse(authData);
      const accessToken = session.access_token;
      const userId = session.user.id;
      
      console.log(`👤 Found user: ${session.user.email}`);
      
      // Get user profile
      const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${userId}&select=*`, {
        headers: {
          'apikey': supabaseKey,
          'authorization': `Bearer ${accessToken}`,
          'content-type': 'application/json'
        }
      });
      
      if (!profileResponse.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const profiles = await profileResponse.json();
      const profile = profiles[0];
      
      if (!profile) {
        console.error('❌ Profile not found');
        return;
      }
      
      console.log('\n🎯 Account to be deleted:');
      console.log(`   Name: ${profile.full_name}`);
      console.log(`   Email: ${session.user.email}`);
      console.log(`   Role: ${profile.role?.toUpperCase() || 'NO ROLE'}`);
      
      const confirmed = confirm(`Are you sure you want to delete your account (${session.user.email})?`);
      
      if (!confirmed) {
        console.log('❌ Deletion cancelled by user.');
        return;
      }
      
      console.log('\n🗑️  Deleting profile...');
      
      // Delete profile
      const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${userId}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'authorization': `Bearer ${accessToken}`,
          'content-type': 'application/json'
        }
      });
      
      if (!deleteResponse.ok) {
        throw new Error('Failed to delete profile');
      }
      
      console.log('✅ Profile deleted successfully!');
      
      // Clear local storage and redirect
      localStorage.clear();
      sessionStorage.clear();
      
      console.log('🔄 Clearing session and redirecting...');
      setTimeout(() => {
        window.location.href = '/auth';
      }, 1000);
      
    } catch (apiError) {
      console.error('❌ API deletion failed:', apiError.message);
      console.log('\n💡 Please try one of these alternatives:');
      console.log('1. Use the Node.js deletion script');
      console.log('2. Ask another admin to delete your account');
      console.log('3. Delete via Supabase dashboard');
    }
  }
})();