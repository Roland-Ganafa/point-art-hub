/**
 * Emergency script to create the audit_log table directly in the database
 * Run this script with Node.js to create the audit_log table
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Read environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

// Create Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAuditLogTable() {
  console.log('Attempting to create audit_log table directly...');
  
  // SQL to create the audit_log table
  const createTableSQL = `
    -- Create audit_log table for tracking admin actions
    CREATE TABLE IF NOT EXISTS public.audit_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
      user_name TEXT,
      action TEXT NOT NULL,
      table_name TEXT,
      record_id UUID,
      old_values JSONB,
      new_values JSONB,
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- Enable Row Level Security
    ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

    -- Create policies
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'audit_log' AND policyname = 'Admins can view audit logs'
      ) THEN
        CREATE POLICY "Admins can view audit logs" 
        ON public.audit_log 
        FOR SELECT 
        TO authenticated 
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
          )
        );
      END IF;
    EXCEPTION
      WHEN duplicate_object THEN
        NULL; -- Policy already exists
    END $$;

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);
    CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON public.audit_log(table_name);
    CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at);

    -- Add comment to describe the table
    COMMENT ON TABLE public.audit_log IS 'Audit trail for tracking admin actions and system changes';
  `;

  try {
    console.log('Executing SQL directly...');
    console.log('This may take a moment...');
    
    // Use Supabase SQL API to execute the SQL directly
    const { error } = await supabase.rpc('pgcode', { query: createTableSQL });
    
    if (error) {
      console.error('Error executing SQL via rpc:', error);
      
      // Alternative approach using direct query
      console.log('Trying direct SQL approach...');
      
      // Try one statement at a time
      const statements = createTableSQL.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.trim().substring(0, 50)}...`);
          const { error: stmtError } = await supabase.from('_sql').select('*').filter('query', 'eq', statement.trim());
          
          if (stmtError) {
            console.warn('Statement may have failed:', stmtError.message);
          }
        }
      }
    }
    
    console.log('SQL execution completed. Verifying table...');
    
    // Verify the table exists by querying it
    const { error: verifyError } = await supabase
      .from('audit_log')
      .select('id')
      .limit(1);
    
    if (verifyError) {
      console.error('Error verifying audit_log table:', verifyError);
      
      // If table verification fails, print manual instructions
      console.log('\nMANUAL INSTRUCTIONS:');
      console.log('Please run the following SQL in your Supabase SQL Editor:');
      console.log(createTableSQL);
      
      return false;
    }
    
    console.log('Audit log table verified - it exists and is accessible!');
    return true;
  } catch (error) {
    console.error('Unexpected error:', error);
    
    // Print manual instructions
    console.log('\nMANUAL INSTRUCTIONS:');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log(createTableSQL);
    
    return false;
  }
}

// Insert a test record to verify the table
async function insertTestRecord() {
  try {
    console.log('Inserting test record...');
    
    const { error } = await supabase
      .from('audit_log')
      .insert([
        {
          user_name: 'System',
          action: 'TABLE_CREATED',
          table_name: 'audit_log',
          new_values: { message: 'Test record to verify audit_log table is working' }
        }
      ])
      .select();
    
    if (error) {
      console.error('Error inserting test record:', error);
      return false;
    }
    
    console.log('Test record inserted successfully!');
    return true;
  } catch (error) {
    console.error('Unexpected error inserting test record:', error);
    return false;
  }
}

// Execute the functions
async function main() {
  console.log('=== Audit Log Table Creation Tool ===');
  console.log('Connecting to Supabase at:', supabaseUrl);
  
  try {
    // Test connection first
    console.log('Testing connection...');
    const { error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profileError) {
      console.error('Connection test failed:', profileError);
      console.log('Please check your Supabase credentials in the .env file');
      return;
    }
    
    console.log('Connection successful!');
    
    // Now try to create the table
    const tableCreated = await createAuditLogTable();
    
    if (tableCreated) {
      await insertTestRecord();
      
      console.log('\n✅ SUCCESS! NEXT STEPS:');
      console.log('1. Refresh your browser page');
      console.log('2. Try accessing the audit log again');
      console.log('3. If the issue persists, clear your browser cache and refresh');
    } else {
      console.log('\n⚠️ TROUBLESHOOTING:');
      console.log('1. Make sure your Supabase service role key has sufficient permissions');
      console.log('2. Check if there are any issues with your Supabase connection');
      console.log('3. Try running the SQL manually in the Supabase SQL Editor');
      console.log('4. Check the browser console for more detailed error messages');
    }
  } catch (error) {
    console.error('Script execution failed:', error);
  }
}

// Run the script
main();