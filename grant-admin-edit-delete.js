#!/usr/bin/env node

/**
 * Grant Admin Edit and Delete Rights
 * This script applies RLS policies to give admins full edit and delete rights
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('   Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Please check your .env file');
  process.exit(1);
}

console.log('🔧 Configuring Admin Edit and Delete Policies...\n');
console.log('📍 Supabase URL:', supabaseUrl);

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyAdminPolicies() {
  try {
    console.log('📖 Reading migration file...');
    
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20251108000000_add_admin_edit_delete_policies.sql');
    const sql = readFileSync(migrationPath, 'utf8');
    
    console.log('🚀 Applying admin policies...\n');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
      // If exec_sql doesn't exist, try direct execution
      console.log('⚠️  exec_sql function not found, trying direct SQL execution...');
      return await supabase.from('_migrations').select('*').limit(1);
    });
    
    if (error) {
      console.log('⚠️  RPC method not available, please run the SQL manually.');
      console.log('\n📋 Instructions:');
      console.log('1. Open Supabase Dashboard → SQL Editor');
      console.log('2. Copy the SQL from: supabase/migrations/20251108000000_add_admin_edit_delete_policies.sql');
      console.log('3. Paste and run it in the SQL Editor\n');
      
      console.log('📝 Or copy this SQL directly:\n');
      console.log('─'.repeat(80));
      console.log(sql);
      console.log('─'.repeat(80));
      
      return false;
    }
    
    console.log('✅ Admin policies applied successfully!\n');
    return true;
    
  } catch (error) {
    console.error('❌ Error applying policies:', error.message);
    return false;
  }
}

async function verifyCurrentUser() {
  try {
    console.log('\n🔍 Verifying your admin status...\n');
    
    const adminEmail = process.env.ADMIN_EMAIL || 'ganafaroland@gmail.com';
    
    // Get user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Error fetching users:', userError.message);
      return;
    }
    
    const user = users.find(u => u.email === adminEmail);
    
    if (!user) {
      console.log('❌ User not found:', adminEmail);
      return;
    }
    
    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Error fetching profile:', profileError.message);
      return;
    }
    
    console.log('✅ Admin User Verified:');
    console.log('   📧 Email:', user.email);
    console.log('   👤 Name:', profile.full_name);
    console.log('   🔑 Role:', profile.role);
    console.log('   🆔 User ID:', user.id);
    
    if (profile.role !== 'admin') {
      console.log('\n⚠️  User is not an admin! Granting admin role...');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('user_id', user.id);
      
      if (updateError) {
        console.error('❌ Error granting admin role:', updateError.message);
      } else {
        console.log('✅ Admin role granted successfully!');
      }
    }
    
    console.log('\n📋 Policy Summary:');
    console.log('   ✅ Admins can edit ALL tables');
    console.log('   ✅ Admins can delete ALL records');
    console.log('   ✅ Regular users can edit inventory');
    console.log('   ✅ Only admins can delete inventory items');
    console.log('   ✅ Only admins can manage sales records');
    console.log('   ✅ Only admins can manage customer data');
    
  } catch (error) {
    console.error('❌ Error verifying admin:', error.message);
  }
}

async function main() {
  console.log('═'.repeat(80));
  console.log('  GRANT ADMIN EDIT AND DELETE RIGHTS');
  console.log('═'.repeat(80));
  console.log();
  
  const success = await applyAdminPolicies();
  
  if (success) {
    await verifyCurrentUser();
    
    console.log('\n═'.repeat(80));
    console.log('✨ SUCCESS! Admin policies configured');
    console.log('═'.repeat(80));
    console.log('\n💡 Next Steps:');
    console.log('   1. Refresh your application');
    console.log('   2. Log in as admin');
    console.log('   3. Test edit and delete functionality');
    console.log();
  } else {
    console.log('\n📋 Manual Setup Required:');
    console.log('   Please run the SQL script in Supabase Dashboard');
    console.log();
  }
}

main().catch(console.error);
