import { supabase } from "@/integrations/supabase/client";

/**
 * Reset Supabase schema cache
 * This function helps resolve issues when tables are not found in the schema cache
 */
export const resetSupabaseSchemaCache = async (): Promise<boolean> => {
  try {
    // This is a workaround to reset the schema cache
    // We're making a simple query to force a schema refresh
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error("Error resetting schema cache:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error resetting schema cache:", error);
    return false;
  }
};

/**
 * Check if a table exists in the database
 * @param tableName The name of the table to check
 */
export const checkTableExists = async (tableName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
    
    // If we get an error about the table not existing, return false
    if (error && (error.message.includes('not found in schema cache') || error.message.includes('does not exist'))) {
      return false;
    }
    
    // If we get data or any other error, the table likely exists
    return true;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
};

/**
 * Wait for a table to become available
 * @param tableName The name of the table to wait for
 * @param maxRetries Maximum number of retries
 * @param delay Delay between retries in milliseconds
 */
export const waitForTable = async (
  tableName: string, 
  maxRetries: number = 5, 
  delay: number = 1000
): Promise<boolean> => {
  for (let i = 0; i < maxRetries; i++) {
    const exists = await checkTableExists(tableName);
    if (exists) {
      return true;
    }
    
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return false;
};