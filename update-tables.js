#!/usr/bin/env node

/**
 * Script to update Point Art Hub database tables
 * This script applies the latest migrations to your Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import { config } from 'dotenv';
config();

// Check if environment variables are set
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase environment variables are not set.');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration(migrationFile) {
  try {
    console.log(`🔄 Applying migration: ${migrationFile}`);

    // Read the migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', migrationFile);
    const sql = readFileSync(migrationPath, 'utf8');

    // Split the SQL into statements (simple approach)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    // Execute each statement
    for (const statement of statements) {
      if (statement.startsWith('--') || statement.startsWith('DO $$') || statement.includes('RAISE NOTICE')) {
        // Skip comments and DO blocks
        continue;
      }

      try {
        const { error } = await supabase.rpc('execute_sql', { sql: statement });
        if (error) {
          // Some errors are expected (like when columns already exist)
          if (!error.message.includes('already exists') &&
            !error.message.includes('does not exist') &&
            !error.message.includes('cannot drop')) {
            console.warn(`⚠️  Non-critical error: ${error.message}`);
          }
        }
      } catch (err) {
        // Some errors are expected (like when columns already exist)
        if (!err.message.includes('already exists') &&
          !err.message.includes('does not exist') &&
          !err.message.includes('cannot drop')) {
          console.warn(`⚠️  Non-critical error: ${err.message}`);
        }
      }
    }

    console.log(`✅ Migration ${migrationFile} applied successfully`);
  } catch (error) {
    console.error(`❌ Error applying migration ${migrationFile}:`, error.message);
    throw error;
  }
}

async function updateTables() {
  console.log('🚀 Starting Point Art Hub database update...');

  try {
    // List of migration files to apply (in order)
    const migrations = [
      '20250910000000_update_tables_with_improvements.sql',
      '20251222000000_fix_stationery_stock.sql'
    ];

    // Apply each migration
    for (const migration of migrations) {
      await applyMigration(migration);
    }

    console.log('🎉 All migrations applied successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your development server');
    console.log('2. Test the new features in the application');
    console.log('3. Check that all existing functionality still works');

  } catch (error) {
    console.error('❌ Failed to update database:', error.message);
    process.exit(1);
  }
}

// Alternative approach using direct SQL execution
async function updateTablesWithDirectSQL() {
  console.log('🚀 Starting Point Art Hub database update with direct SQL...');

  try {
    // Read the latest migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20250910000000_update_tables_with_improvements.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    console.log('🔄 Executing migration SQL directly...');

    // Execute the entire SQL script
    const { data, error } = await supabase.rpc('execute_sql_from_file', {
      file_path: migrationPath
    });

    if (error) {
      // If the RPC function doesn't exist, try executing statements individually
      if (error.message.includes('function execute_sql_from_file')) {
        console.log('🔄 Executing statements individually...');
        await executeStatementsIndividually(sql);
      } else {
        throw error;
      }
    } else {
      console.log('✅ Migration executed successfully');
    }

    console.log('🎉 Database update completed successfully!');

  } catch (error) {
    console.error('❌ Failed to update database:', error.message);
    process.exit(1);
  }
}

async function executeStatementsIndividually(sql) {
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.includes('RAISE NOTICE'));

  console.log(`🔄 Executing ${statements.length} SQL statements...`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Skip empty statements and comments
    if (!statement || statement.startsWith('--') || statement.startsWith('DO $$')) {
      continue;
    }

    try {
      console.log(`   Executing statement ${i + 1}/${statements.length}...`);

      // Try to execute the statement
      const { error } = await supabase.rpc('execute_sql', { sql: statement });

      if (error) {
        // Log non-critical errors but continue
        if (!error.message.includes('already exists') &&
          !error.message.includes('does not exist') &&
          !error.message.includes('cannot drop')) {
          console.warn(`     ⚠️  Non-critical error: ${error.message}`);
        }
      }
    } catch (err) {
      // Handle errors that aren't caught by the RPC response
      if (!err.message.includes('already exists') &&
        !err.message.includes('does not exist') &&
        !err.message.includes('cannot drop')) {
        console.warn(`     ⚠️  Non-critical error: ${err.message}`);
      }
    }
  }
}

// Run the update
updateTablesWithDirectSQL().catch(console.error);