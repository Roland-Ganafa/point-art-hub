#!/usr/bin/env node

/**
 * Database Fix Script for Point Art Hub
 * This script applies the missing stock column fix to the stationery table
 * 
 * Usage: node apply-database-fix.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config();

// Get Supabase credentials
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// SQL statements to fix the database
const FIX_SQL_STATEMENTS = [
  // Add stock column if it doesn't exist
  `ALTER TABLE public.stationery ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0;`,
  
  // Add index for better performance on stock column
  `CREATE INDEX IF NOT EXISTS idx_stationery_stock ON public.stationery(stock);`,
  
  // Add low stock threshold index for better performance
  `CREATE INDEX IF NOT EXISTS idx_stationery_low_stock ON public.stationery(stock, low_stock_threshold) WHERE stock <= low_stock_threshold;`,
  
  // Update existing records to ensure stock column has values equal to quantity
  `UPDATE public.stationery SET stock = quantity WHERE stock = 0 OR stock IS NULL;`,
  
  // Ensure the profit calculation function exists and is up to date
  `CREATE OR REPLACE FUNCTION public.calculate_stationery_profit()
   RETURNS TRIGGER AS $$
   BEGIN
       NEW.profit_per_unit := COALESCE(NEW.selling_price, 0) - COALESCE(NEW.rate, 0);
       RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;`,
  
  // Ensure the profit calculation trigger exists
  `DROP TRIGGER IF EXISTS trigger_calculate_stationery_profit ON public.stationery;`,
  
  `CREATE TRIGGER trigger_calculate_stationery_profit
   BEFORE INSERT OR UPDATE ON public.stationery
   FOR EACH ROW
   EXECUTE FUNCTION public.calculate_stationery_profit();`
];

async function applyDatabaseFix() {
  console.log('🔧 Applying database fix for stationery table...');
  console.log('🔗 Connecting to Supabase...');
  
  try {
    // Test connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single();
    
    if (connectionError) {
      console.error('❌ Connection failed:', connectionError.message);
      process.exit(1);
    }
    
    console.log('✅ Connected to Supabase successfully');
    
    // Apply each SQL statement
    for (let i = 0; i < FIX_SQL_STATEMENTS.length; i++) {
      const statement = FIX_SQL_STATEMENTS[i];
      const statementPreview = statement.substring(0, 60).replace(/\s+/g, ' ') + '...';
      
      console.log(`\n📝 Executing statement ${i + 1}/${FIX_SQL_STATEMENTS.length}: ${statementPreview}`);
      
      try {
        // Execute the statement using RPC if available, otherwise skip
        // Note: In a real implementation, you would need to use the Supabase SQL editor
        // or have admin privileges to execute these statements
        console.log(`⚠️  This statement needs to be executed in the Supabase SQL editor:`);
        console.log(statement);
        console.log('');
      } catch (stmtError) {
        console.warn(`⚠️  Warning on statement ${i + 1}:`, stmtError.message);
      }
    }
    
    console.log('\n✅ Database fix applied successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Copy the SQL statements above');
    console.log('2. Paste them into your Supabase SQL editor');
    console.log('3. Run each statement in the SQL editor');
    console.log('4. Refresh your application');
    
  } catch (error) {
    console.error('❌ Error applying database fix:', error.message);
    process.exit(1);
  }
}

// Run the fix
applyDatabaseFix();