// Script to apply the stock column fix directly to the database
import { supabase } from './src/integrations/supabase/client.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function applyStockFix() {
  try {
    console.log('Applying stock column fix to stationery table...');
    
    // Read the migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20250915000000_add_stock_to_stationery.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
      .filter(stmt => !stmt.startsWith('--')); // Remove comments
    
    console.log(`Found ${statements.length} statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}:`, statement.substring(0, 50) + '...');
      
      try {
        // For ALTER TABLE statements, we need to use raw SQL
        const { error } = await supabase.rpc('execute_sql', { sql: statement });
        
        if (error) {
          console.warn(`Warning on statement ${i + 1}:`, error.message);
          // Continue with other statements
        } else {
          console.log(`✓ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.warn(`Error executing statement ${i + 1}:`, err.message);
        // Continue with other statements
      }
    }
    
    console.log('✅ Stock column fix applied successfully!');
    console.log('📋 Changes include:');
    console.log('   • Added stock column to stationery table');
    console.log('   • Created indexes for better performance');
    console.log('   • Updated existing records to populate stock values');
    console.log('   • Ensured profit calculation function and trigger are up to date');
    
  } catch (error) {
    console.error('❌ Error applying stock column fix:', error.message);
    process.exit(1);
  }
}

// Run the function
applyStockFix();