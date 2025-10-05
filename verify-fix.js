#!/usr/bin/env node

/**
 * Verification Script for Point Art Hub Database Fix
 * This script verifies that the stationery table has the required columns
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

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

async function verifyFix() {
  console.log('🔍 Verifying database fix for stationery table...');
  
  try {
    // Test 1: Check if we can connect to the database
    console.log('🔗 Testing database connection...');
    const { data: testConnection, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError.message);
      process.exit(1);
    }
    console.log('✅ Database connection successful');
    
    // Test 2: Check stationery table schema
    console.log('📋 Checking stationery table schema...');
    const { data: schemaData, error: schemaError } = await supabase
      .from('stationery')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.error('❌ Error querying stationery table:', schemaError.message);
      process.exit(1);
    }
    
    if (schemaData && schemaData.length > 0) {
      const firstItem = schemaData[0];
      console.log('✅ Successfully queried stationery table');
      
      // Check for required columns
      const requiredColumns = ['stock', 'profit_per_unit', 'low_stock_threshold'];
      const missingColumns = [];
      
      for (const column of requiredColumns) {
        if (column in firstItem) {
          console.log(`✅ Column '${column}' exists`);
        } else {
          console.warn(`⚠️  Column '${column}' is missing`);
          missingColumns.push(column);
        }
      }
      
      if (missingColumns.length > 0) {
        console.warn(`\n⚠️  Some columns are missing. You may need to apply the database fix.`);
        console.warn(`Missing columns: ${missingColumns.join(', ')}`);
      } else {
        console.log('\n🎉 All required columns are present!');
      }
      
      // Test 3: Try to insert a test item
      console.log('\n🧪 Testing item insertion...');
      const testItem = {
        item: 'Verification Test Item',
        category: 'Test',
        description: 'Test item to verify fix',
        quantity: 5,
        rate: 10.00,
        stock: 5,
        selling_price: 15.00,
        profit_per_unit: 5.00,
        low_stock_threshold: 2
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('stationery')
        .insert([testItem])
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Error inserting test item:', insertError.message);
        if (insertError.code === '42501') {
          console.error('This indicates a row-level security policy violation.');
          console.error('Please apply the database fix as described in DATABASE-FIX-INSTRUCTIONS.md');
        }
      } else {
        console.log('✅ Successfully inserted test item');
        
        // Clean up
        const { error: deleteError } = await supabase
          .from('stationery')
          .delete()
          .eq('id', insertData.id);
        
        if (deleteError) {
          console.warn('⚠️  Warning: Could not clean up test item');
        } else {
          console.log('✅ Cleaned up test item');
        }
      }
    } else {
      console.log('⚠️  Stationery table is empty or does not exist');
    }
    
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    process.exit(1);
  }
}

// Run verification
verifyFix();