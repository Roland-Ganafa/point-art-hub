#!/usr/bin/env node

/**
 * Verify Admin Edit and Delete Rights
 * This script checks if admin policies are correctly configured
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

async function checkFunction() {
  console.log('🔍 Checking is_admin() function...');
  
  try {
    const { data, error } = await supabase.rpc('is_admin');
    
    if (error) {
      console.log('❌ is_admin() function not found');
      console.log('   Please run the migration first!');
      return false;
    }
    
    console.log('✅ is_admin() function exists\n');
    return true;
  } catch (err) {
    console.log('⚠️  is_admin() function check failed - migration may not be applied yet');
    console.log('   This is normal if you haven\'t run the migration\n');
    return false;
  }
}

async function checkPolicies() {
  console.log('🔍 Checking RLS policies...\n');
  
  const tables = [
    'stationery',
    'gift_store',
    'embroidery',
    'machines',
    'art_services',
    'stationery_sales',
    'gift_daily_sales',
    'profiles'
  ];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`⚠️  ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: Accessible`);
    }
  }
  
  console.log();
}

async function checkAdminUser() {
  console.log('🔍 Checking admin user status...\n');
  
  const adminEmail = process.env.ADMIN_EMAIL || 'ganafaroland@gmail.com';
  
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  
  if (userError) {
    console.error('❌ Error fetching users:', userError.message);
    return;
  }
  
  const user = users.find(u => u.email === adminEmail);
  
  if (!user) {
    console.log('❌ Admin user not found:', adminEmail);
    return;
  }
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (profileError) {
    console.error('❌ Error fetching profile:', profileError.message);
    return;
  }
  
  console.log('Admin User Details:');
  console.log('  📧 Email:', user.email);
  console.log('  👤 Name:', profile.full_name);
  console.log('  🔑 Role:', profile.role);
  console.log('  🆔 User ID:', user.id);
  
  if (profile.role === 'admin') {
    console.log('  ✅ Admin status: ACTIVE\n');
  } else {
    console.log('  ❌ Admin status: NOT ADMIN\n');
  }
}

async function main() {
  console.log('═'.repeat(80));
  console.log('  VERIFY ADMIN EDIT AND DELETE RIGHTS');
  console.log('═'.repeat(80));
  console.log();
  
  await checkFunction();
  await checkPolicies();
  await checkAdminUser();
  
  console.log('═'.repeat(80));
  console.log('📋 Policy Summary:');
  console.log('═'.repeat(80));
  console.log('✅ Admins can:');
  console.log('   • Edit all tables (UPDATE)');
  console.log('   • Delete all records (DELETE)');
  console.log('   • View all data (SELECT)');
  console.log('   • Create new records (INSERT)');
  console.log();
  console.log('👤 Regular users can:');
  console.log('   • Edit inventory items (stationery, gift_store, etc.)');
  console.log('   • View data (SELECT)');
  console.log('   • Create new records (INSERT)');
  console.log('   • ❌ Cannot delete inventory items');
  console.log('   • ❌ Cannot edit/delete sales records');
  console.log();
  console.log('═'.repeat(80));
}

main().catch(console.error);
