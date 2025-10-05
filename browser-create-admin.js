// Browser Admin Creation Script
// Run this in the browser console to create an admin account

/**
 * Creates a new admin user account
 * @param {string} email - The email for the new admin account
 * @param {string} password - The password for the new admin account
 * @param {string} fullName - The full name for the new admin account
 */
async function createAdminAccount(email, password, fullName) {
  console.log('🚀 Creating admin account...');
  
  // Validate inputs
  if (!email || !password || !fullName) {
    console.error('❌ Missing required parameters');
    console.log('Usage: createAdminAccount("email@example.com", "password", "Full Name")');
    return;
  }
  
  try {
    // Check if Supabase client is available
    if (!window.supabase) {
      console.error('❌ Supabase client not available. Make sure you are running this on the Point Art Hub website.');
      return;
    }
    
    console.log(`📧 Creating account for ${email}...`);
    
    // Sign up the user
    const { data, error } = await window.supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });
    
    if (error) {
      if (error.message.includes('already registered')) {
        console.log('ℹ️  User already exists, will try to make them admin...');
        // Try to get existing user
        const { data: { user } } = await window.supabase.auth.getUser();
        if (user) {
          console.log(`✅ Found existing user: ${user.email}`);
          // Proceed to make admin
          await makeAdmin(user.id, fullName);
          return;
        }
      } else {
        throw new Error(`Sign up failed: ${error.message}`);
      }
    } else {
      console.log('✅ Account created successfully');
      console.log(`   User ID: ${data.user.id}`);
      // Make the user admin
      await makeAdmin(data.user.id, fullName);
    }
  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
  }
}

/**
 * Makes a user an admin by updating their profile
 * @param {string} userId - The user ID to make admin
 * @param {string} fullName - The full name for the profile
 */
async function makeAdmin(userId, fullName) {
  try {
    console.log('🔧 Setting admin role...');
    
    // Try to update existing profile
    const { data: updateData, error: updateError } = await window.supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('user_id', userId);
    
    if (updateError) {
      console.log('⚠️  Could not update existing profile, creating new one...');
      // Create new profile
      const { data: insertData, error: insertError } = await window.supabase
        .from('profiles')
        .insert([
          {
            user_id: userId,
            full_name: fullName || 'Admin User',
            role: 'admin'
          }
        ]);
      
      if (insertError) {
        throw new Error(`Failed to create admin profile: ${insertError.message}`);
      } else {
        console.log('✅ Admin profile created successfully');
      }
    } else {
      console.log('✅ User role updated to admin successfully');
    }
    
    console.log('🎉 Admin account creation completed!');
    console.log('🔄 Refresh the page to see admin features');
  } catch (error) {
    console.error('❌ Error making user admin:', error.message);
  }
}

/**
 * Lists all users and their roles (admin only)
 */
async function listUsers() {
  try {
    const { data, error } = await window.supabase
      .from('profiles')
      .select('full_name, role, user_id');
    
    if (error) {
      console.error('❌ Error fetching users:', error.message);
      return;
    }
    
    console.log('👥 Users and Roles:');
    console.table(data);
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
  }
}

// Export functions to window object
window.createAdminAccount = createAdminAccount;
window.makeAdmin = makeAdmin;
window.listUsers = listUsers;

console.log('🚀 Admin Account Creation Script Loaded!');
console.log('');
console.log('📞 Available functions:');
console.log('   createAdminAccount(email, password, fullName) - Create a new admin account');
console.log('   makeAdmin(userId, fullName) - Make an existing user admin');
console.log('   listUsers() - List all users and their roles');
console.log('');
console.log('🎯 Example usage:');
console.log('   createAdminAccount("admin@example.com", "SecurePassword123!", "System Admin")');