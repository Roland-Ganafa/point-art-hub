// Check User Profile Script
// This script checks if a user profile exists and creates one if it doesn't
// REQUIRES: Service Role Key (not anon key)

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Read environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // NOT anon key!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure your .env file contains:');
  console.log('- VITE_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY (from Supabase Dashboard → Settings → API)');
  console.log('');
  console.log('⚠️  WARNING: Never use the service role key in client-side code!');
  console.log('   This script should only be run server-side or locally.');
  process.exit(1);
}

// Create Supabase client with service role key
// auth: { autoRefreshToken: false, persistSession: false } for server-side use
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUserProfile(email) {
  console.log(`🔍 Checking profile for user: ${email}`);
  console.log('='.repeat(50));
  
  try {
    // Use Auth Admin API to find the user
    console.log('\n📧 Looking for user in auth system...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      console.log('   Make sure you\'re using the SERVICE_ROLE_KEY, not ANON_KEY');
      return false;
    }
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.log('❌ User not found in auth system');
      console.log(`   No user exists with email: ${email}`);
      console.log('   They need to sign up first!');
      return false;
    }
    
    const userId = user.id;
    console.log(`✅ Found user in auth system`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Created: ${user.created_at}`);
    
    // Check if profile exists
    console.log('\n👤 Checking for existing profile...');
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle to avoid error on no rows
    
    if (profileError) {
      console.error('❌ Error querying profiles:', profileError.message);
      console.error('   Code:', profileError.code);
      console.error('   Details:', profileError.details);
      return false;
    }
    
    if (!existingProfile) {
      console.log('⚠️  No profile found for this user');
      console.log('   Creating profile...');
      
      // Get full name from user metadata
      const fullName = user.user_metadata?.full_name || 
                       user.user_metadata?.name || 
                       email.split('@')[0];
      
      // Create profile
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: userId,
            full_name: fullName,
            role: 'user' // Start as regular user
          }
        ])
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating profile:', createError.message);
        console.error('   Code:', createError.code);
        
        if (createError.code === '42501') {
          console.error('   This is an RLS policy error. You may need to:');
          console.error('   1. Use the service role key (already doing this)');
          console.error('   2. Check RLS policies on the profiles table');
        }
        
        return false;
      }
      
      console.log('✅ Profile created successfully!');
      console.log('   User ID:', newProfile.user_id);
      console.log('   Full Name:', newProfile.full_name);
      console.log('   Role:', newProfile.role);
    } else {
      console.log('✅ Profile already exists');
      console.log('   User ID:', existingProfile.user_id);
      console.log('   Full Name:', existingProfile.full_name);
      console.log('   Current Role:', existingProfile.role);
    }
    
    // Grant admin role
    console.log('\n🔑 Granting admin role...');
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating profile to admin:', updateError.message);
      console.error('   Code:', updateError.code);
      return false;
    }
    
    console.log('✅ User successfully granted admin role!');
    console.log('   User ID:', updatedProfile.user_id);
    console.log('   Full Name:', updatedProfile.full_name);
    console.log('   Role:', updatedProfile.role);
    console.log('   Updated:', updatedProfile.updated_at);
    
    console.log('\n🎉 All operations completed successfully!');
    console.log('   The user can now log in with admin privileges.');
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('   Stack:', error.stack);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 User Profile Check & Admin Grant Script');
  console.log('='.repeat(50));
  console.log('⚠️  WARNING: This script uses the SERVICE ROLE KEY');
  console.log('   Never expose this key in client-side code!');
  console.log('');
  
  // Get email from command line argument or use default
  const email = process.argv[2] || 'ganafaroland@gmail.com';
  
  if (process.argv[2]) {
    console.log(`📧 Email provided via command line: ${email}`);
  } else {
    console.log(`📧 Using default email: ${email}`);
    console.log('   (You can pass a different email as a command line argument)');
  }
  console.log('');
  
  const success = await checkUserProfile(email);
  
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  } else {
    console.log('❌ Script completed with errors');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});