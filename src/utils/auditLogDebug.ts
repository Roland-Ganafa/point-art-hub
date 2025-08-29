import { supabase } from "@/integrations/supabase/client";

/**
 * Debug utility for audit log issues
 * Provides detailed information about the audit log table and schema
 */
export const debugAuditLog = async () => {
  console.log("=== Audit Log Debug Information ===");
  
  try {
    // Check if we can access the profiles table (known good table)
    console.log("1. Testing access to profiles table...");
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profileError) {
      console.error("   ❌ Error accessing profiles table:", profileError.message);
    } else {
      console.log("   ✅ Successfully accessed profiles table");
    }
    
    // Check if audit_log table exists in information_schema
    console.log("2. Checking if audit_log table exists in information_schema...");
    const { data: tableInfo, error: tableInfoError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_name', 'audit_log');
    
    if (tableInfoError) {
      console.error("   ❌ Error querying information_schema:", tableInfoError.message);
    } else if (tableInfo && tableInfo.length > 0) {
      console.log("   ✅ audit_log table found in information_schema");
    } else {
      console.log("   ❌ audit_log table NOT found in information_schema");
    }
    
    // Try to access the audit_log table directly
    console.log("3. Testing direct access to audit_log table...");
    const { data: auditData, error: auditError } = await supabase
      .from('audit_log')
      .select('id')
      .limit(1);
    
    if (auditError) {
      console.error("   ❌ Error accessing audit_log table:", auditError.message);
      console.log("   This might be a schema cache issue");
    } else {
      console.log("   ✅ Successfully accessed audit_log table");
    }
    
    // Check if our custom functions exist
    console.log("4. Testing custom audit log functions...");
    const { data: checkFunctionData, error: checkFunctionError } = await supabase
      .rpc('check_audit_log_table_exists');
    
    if (checkFunctionError) {
      console.error("   ❌ Error calling check_audit_log_table_exists:", checkFunctionError.message);
    } else {
      console.log("   ✅ check_audit_log_table_exists function returned:", checkFunctionData);
    }
    
    const { data: resetFunctionData, error: resetFunctionError } = await supabase
      .rpc('reset_audit_log_schema_cache');
    
    if (resetFunctionError) {
      console.error("   ❌ Error calling reset_audit_log_schema_cache:", resetFunctionError.message);
    } else {
      console.log("   ✅ reset_audit_log_schema_cache function executed successfully");
    }
    
    console.log("=== End Audit Log Debug Information ===");
  } catch (error) {
    console.error("Unexpected error during audit log debug:", error);
  }
};

/**
 * Force refresh the Supabase schema by creating a new client instance
 */
export const forceRefreshSchema = async () => {
  console.log("Attempting to force refresh Supabase schema...");
  
  try {
    // This is a workaround - in a real application, you might need to 
    // recreate the Supabase client instance or clear local cache
    console.log("Clearing localStorage and sessionStorage...");
    localStorage.clear();
    sessionStorage.clear();
    
    // Wait a bit for cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("Schema refresh simulation completed. Please reload the page.");
  } catch (error) {
    console.error("Error during schema refresh:", error);
  }
};