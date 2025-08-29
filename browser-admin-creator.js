/**
 * Browser Console Admin Creator
 * 
 * Copy and paste this into your browser console while on the Point Art Hub site
 * to create an admin account.
 * 
 * Instructions:
 * 1. Open Point Art Hub in your browser
 * 2. Open Developer Tools (F12)
 * 3. Go to Console tab
 * 4. Paste this entire script and press Enter
 */

(async function createAdminAccount() {
  console.log('🚀 Point Art Hub - Admin Account Creator');
  console.log('═══════════════════════════════════════');

  // Check if we're on the right site
  if (!window.location.href.includes('localhost') && !window.location.href.includes('pointarthub')) {
    console.error('❌ This script should be run on the Point Art Hub website');
    return;
  }

  // Admin account details
  const adminEmail = 'admin@pointarthub.com';
  const adminPassword = 'PointArt2024!';
  const adminName = 'System Administrator';

  try {
    // Get supabase from window object (assuming it's available globally)
    const supabase = window.supabase || window.__SUPABASE_CLIENT__;
    
    if (!supabase) {
      console.error('❌ Supabase client not found. Make sure you\'re on the Point Art Hub site.');
      return;
    }

    console.log('📧 Creating admin account...');

    // First, try to sign up normally
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          full_name: adminName
        }
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('ℹ️  User already exists, trying to sign in...');
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: adminPassword
        });

        if (signInError) {
          throw new Error(`Sign in failed: ${signInError.message}`);
        }

        console.log('✅ Signed in successfully');
        
        // Check if user is already admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', signInData.user.id)
          .single();

        if (profile?.role === 'admin') {
          console.log('✅ User is already an admin');
        } else {
          // Update role to admin
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('user_id', signInData.user.id);

          if (updateError) {
            console.error('❌ Failed to update role:', updateError.message);
          } else {
            console.log('✅ Updated user role to admin');
          }
        }
      } else {
        throw new Error(`Sign up failed: ${signUpError.message}`);
      }
    } else {
      console.log('✅ Account created successfully');
      
      // Update the profile to have admin role
      if (signUpData.user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('user_id', signUpData.user.id);

        if (updateError) {
          console.error('❌ Failed to set admin role:', updateError.message);
        } else {
          console.log('✅ Admin role assigned successfully');
        }
      }
    }

    // Success message
    console.log('\n🎉 Admin account ready!');
    console.log('═══════════════════════════════════════');
    console.log(`📧 Email:    ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`👤 Name:     ${adminName}`);
    console.log(`🛡️  Role:     Admin`);
    console.log('═══════════════════════════════════════');
    console.log('\n📝 You can now:');
    console.log('• Refresh the page to see admin features');
    console.log('• Go to Admin Profile to manage users');
    console.log('• Change the password in your profile');
    
    // Auto-refresh to apply changes
    setTimeout(() => {
      console.log('🔄 Refreshing page to apply changes...');
      window.location.reload();
    }, 2000);

  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
    console.log('\n💡 Alternative options:');
    console.log('1. Sign up normally - the first user becomes admin automatically');
    console.log('2. Use the Admin Profile page if you already have admin access');
    console.log('3. Check that the database is properly set up');
  }
})();