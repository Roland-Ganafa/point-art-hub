#!/usr/bin/env node

/**
 * Delete Admin Account
 * This script completely removes the admin account from the system
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL || 'ganafaroland@gmail.com';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('   Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteAdminAccount() {
  const forceDelete = process.argv.includes('--force');
  
  console.log('═'.repeat(80));
  console.log('  DELETE ADMIN ACCOUNT');
  console.log('═'.repeat(80));
  console.log();
  console.log('⚠️  WARNING: This will permanently delete the admin account!');
  console.log('📧 Email:', adminEmail);
  if (forceDelete) {
    console.log('🔥 FORCE MODE: Will delete all associated records!');
  }
  console.log();

  try {
    // Step 1: Find the user
    console.log('🔍 Step 1: Looking for user...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      return false;
    }

    const user = users.find(u => u.email === adminEmail);
    
    if (!user) {
      console.log('❌ User not found:', adminEmail);
      console.log('   The account may have already been deleted.');
      return false;
    }

    console.log('✅ User found');
    console.log('   User ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Created:', user.created_at);
    console.log();

    // Step 2: Check profile
    console.log('🔍 Step 2: Checking profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (profile) {
      console.log('✅ Profile found');
      console.log('   Name:', profile.full_name);
      console.log('   Role:', profile.role);
    } else {
      console.log('⚠️  No profile found (profile may have been auto-deleted)');
    }
    console.log();

    // Step 3: Handle foreign key constraints
    console.log('🔍 Step 3: Checking for related records...');
    
    // Check all tables that might reference the profile
    const referencesToCheck = [
      { table: 'stationery', column: 'sold_by' },
      { table: 'stationery', column: 'updated_by' },
      { table: 'gift_store', column: 'sold_by' },
      { table: 'gift_store', column: 'updated_by' },
      { table: 'embroidery', column: 'done_by' },
      { table: 'embroidery', column: 'updated_by' },
      { table: 'machines', column: 'done_by' },
      { table: 'machines', column: 'updated_by' },
      { table: 'art_services', column: 'done_by' },
      { table: 'art_services', column: 'updated_by' },
      { table: 'stationery_sales', column: 'sold_by' },
      { table: 'gift_daily_sales', column: 'sold_by' },
    ];
    
    let hasRecords = false;
    const recordsToDelete = [];
    
    for (const ref of referencesToCheck) {
      const { count, error } = await supabase
        .from(ref.table)
        .select('*', { count: 'exact', head: true })
        .eq(ref.column, profile.id);
      
      if (!error && count && count > 0) {
        console.log(`   ⚠️  Found ${count} records in ${ref.table}.${ref.column}`);
        hasRecords = true;
        recordsToDelete.push(ref);
      }
    }
    
    if (hasRecords) {
      console.log();
      
      if (!forceDelete) {
        console.log('⚠️  Cannot delete: Admin has created records in the system');
        console.log('   Options:');
        console.log('   1. Reassign records to another user');
        console.log('   2. Delete all admin-created records first');
        console.log();
        console.log('💡 To force delete with all records, run:');
        console.log('   node delete-admin-account.js --force');
        console.log();
        return false;
      }
      
      console.log('🗑️  Force deleting all admin-created records...');
      
      // Delete records from each table/column combination
      for (const ref of recordsToDelete) {
        const { error: deleteError } = await supabase
          .from(ref.table)
          .delete()
          .eq(ref.column, profile.id);
        
        if (deleteError) {
          console.log(`   ⚠️  Error deleting from ${ref.table}.${ref.column}:`, deleteError.message);
        } else {
          console.log(`   ✅ Deleted records from ${ref.table}.${ref.column}`);
        }
      }
      
      console.log('✅ All admin-created records deleted');
      console.log();
    } else {
      console.log('✅ No related records found');
      console.log();
    }
    
    // Step 4: Delete profile
    if (profile) {
      console.log('🗑️  Step 4: Deleting profile...');
      const { error: deleteProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id);
      
      if (deleteProfileError) {
        console.error('⚠️  Error deleting profile:', deleteProfileError.message);
        console.log('   Profile may be auto-deleted with user (CASCADE)');
      } else {
        console.log('✅ Profile deleted successfully');
      }
      console.log();
    }

    // Step 5: Delete user from auth
    console.log('🗑️  Step 5: Deleting user from authentication...');
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);
    
    if (deleteUserError) {
      console.error('❌ Error deleting user:', deleteUserError.message);
      return false;
    }

    console.log('✅ User deleted from authentication');
    console.log();

    // Step 6: Verify deletion
    console.log('🔍 Step 6: Verifying deletion...');
    const { data: { users: verifyUsers } } = await supabase.auth.admin.listUsers();
    const stillExists = verifyUsers.find(u => u.email === adminEmail);
    
    if (stillExists) {
      console.error('❌ User still exists! Deletion may have failed.');
      return false;
    }

    console.log('✅ Deletion verified - user no longer exists');
    console.log();

    console.log('═'.repeat(80));
    console.log('✅ SUCCESS! Admin account deleted completely');
    console.log('═'.repeat(80));
    console.log();
    console.log('📋 What was deleted:');
    console.log('   ✅ User authentication record');
    console.log('   ✅ User profile data');
    console.log('   ✅ All associated sessions');
    console.log();
    console.log('💡 To create a new admin account, run:');
    console.log('   node create-and-make-admin.js');
    console.log();

    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

// Run the deletion
deleteAdminAccount().then(success => {
  process.exit(success ? 0 : 1);
});
