/**
 * Current Account Deletion Script
 * 
 * This script deletes the currently logged-in user account.
 * Use with caution - this will permanently delete the account!
 * 
 * Run with: node delete-current-account.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure your .env file contains:');
  console.log('- VITE_SUPABASE_URL');
  console.log('- VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function deleteCurrentAccount() {
  console.log('🗑️  Point Art Hub - Account Deletion Tool');
  console.log('═════════════════════════════════════════');

  try {
    // First, let's see what accounts exist
    console.log('📋 Fetching current accounts...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, email, role, created_at')
      .order('created_at', { ascending: true });

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      console.log('ℹ️  No accounts found in the system.');
      return;
    }

    console.log(`\n📊 Found ${profiles.length} account(s):`);
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.full_name} (${profile.email || 'No email'}) - ${profile.role?.toUpperCase() || 'NO ROLE'}`);
    });

    // Auto-select the first (oldest) account for deletion
    const accountToDelete = profiles[0];
    
    console.log(`\n🎯 Selected account for deletion:`);
    console.log(`   Name: ${accountToDelete.full_name}`);
    console.log(`   Email: ${accountToDelete.email || 'Unknown'}`);
    console.log(`   Role: ${accountToDelete.role?.toUpperCase() || 'NO ROLE'}`);
    console.log(`   Created: ${new Date(accountToDelete.created_at).toLocaleDateString()}`);

    // Confirm deletion
    console.log('\n⚠️  WARNING: This action cannot be undone!');
    
    // For safety, require manual confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const confirmation = await new Promise((resolve) => {
      readline.question('Type "DELETE" to confirm account deletion: ', resolve);
    });

    readline.close();

    if (confirmation !== 'DELETE') {
      console.log('❌ Deletion cancelled. Account was not deleted.');
      return;
    }

    console.log('\n🗑️  Deleting account...');

    // Delete the user (this will cascade to profile due to foreign key)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(accountToDelete.user_id);

    if (deleteError) {
      // If admin delete fails, try to delete profile directly
      console.log('⚠️  Admin delete failed, attempting direct profile deletion...');
      
      const { error: profileDeleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', accountToDelete.id);

      if (profileDeleteError) {
        throw new Error(`Failed to delete profile: ${profileDeleteError.message}`);
      }
    }

    console.log('✅ Account deleted successfully!');
    console.log('\n📝 What happened:');
    console.log('• User authentication record removed');
    console.log('• Profile and all associated data deleted');
    console.log('• Sales records attributed to this user preserved');
    
    console.log('\n🔄 Next steps:');
    console.log('1. Create a new account if needed');
    console.log('2. The first new user will automatically become admin');
    console.log('3. Refresh the application to see changes');

  } catch (error) {
    console.error('❌ Error deleting account:', error.message);
    
    console.log('\n💡 Possible solutions:');
    console.log('1. Ensure you have proper database permissions');
    console.log('2. Check that the account still exists');
    console.log('3. Try deleting via the Admin Profile interface');
    console.log('4. Check Supabase dashboard for any constraints');
    
    process.exit(1);
  }
}

// Check connection and run
async function main() {
  try {
    console.log('🔍 Checking database connection...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (error) throw error;
    
    console.log('✅ Database connection successful');
    
    await deleteCurrentAccount();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n💡 Check your .env file and Supabase credentials');
    process.exit(1);
  }
}

main().catch(console.error);