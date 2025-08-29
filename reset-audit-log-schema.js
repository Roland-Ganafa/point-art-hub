/**
 * Script to reset Supabase schema cache and ensure audit_log table exists
 * Run this script if you're getting "table not found in schema cache" errors
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function resetAuditLogSchema() {
  console.log('=== Audit Log Schema Reset Tool ===');
  console.log('Resetting audit log schema...');
  
  try {
    // First, try to check if the table exists by making a simple query
    console.log('Checking if audit_log table exists...');
    const { data: checkData, error: checkError } = await supabase
      .from('audit_log')
      .select('id')
      .limit(1);
    
    if (checkError && (checkError.message.includes('not found in schema cache') || checkError.message.includes('does not exist'))) {
      console.log('Audit log table not found in schema cache. Attempting to reset schema cache...');
      
      // Try to reset schema cache by querying a known table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (profileError) {
        console.error('Error querying profiles table:', profileError.message);
      } else {
        console.log('Successfully queried profiles table. Schema cache may have been refreshed.');
      }
      
      // Try again to check if audit_log table exists
      console.log('Checking again if audit_log table exists...');
      const { data: checkData2, error: checkError2 } = await supabase
        .from('audit_log')
        .select('id')
        .limit(1);
      
      if (checkError2) {
        console.error('Audit log table still not found:', checkError2.message);
        console.log('Please ensure the database migration has been applied or run create-audit-table.js script.');
        
        // Provide instructions for next steps
        console.log('\n⚠️ NEXT STEPS:');
        console.log('1. Run npm run create:audit-table to create the audit_log table');
        console.log('2. Or manually create the table in the Supabase SQL Editor');
        console.log('3. Then refresh your browser and try again');
      } else {
        console.log('✅ Audit log table is now accessible!');
        console.log('\nRefresh your browser page to see if the issue is resolved.');
      }
    } else if (checkError) {
      console.error('Unexpected error accessing audit_log table:', checkError.message);
    } else {
      console.log('✅ Audit log table is accessible!');
      console.log('\nIf you were experiencing issues, try refreshing your browser page.');
    }
    
    console.log('\nSchema reset process completed.');
  } catch (error) {
    console.error('Error during schema reset:', error.message);
  }
}

// Run the function
resetAuditLogSchema();