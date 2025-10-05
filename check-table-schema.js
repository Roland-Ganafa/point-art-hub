#!/usr/bin/env node

/**
 * Script to check the exact schema of the stationery table
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

async function checkTableSchema() {
  console.log('🔍 Checking stationery table schema...');
  
  try {
    // Try to get table info using Supabase meta tables
    console.log('\n📋 Getting table information...');
    
    // First, let's try to insert a minimal record to see what columns are required
    console.log('\n🧪 Testing minimal insert...');
    const minimalData = {
      item: 'Schema Test Item'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('stationery')
      .insert([minimalData])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Minimal insert failed:', insertError.message);
      console.error('Error details:', JSON.stringify(insertError, null, 2));
    } else {
      console.log('✅ Minimal insert successful');
      
      // Clean up
      const { error: deleteError } = await supabase
        .from('stationery')
        .delete()
        .eq('id', insertData.id);
      
      if (deleteError) {
        console.warn('⚠️  Could not clean up test data:', deleteError.message);
      } else {
        console.log('✅ Cleaned up test data');
      }
    }
    
    // Try a more complete insert matching what the app is sending
    console.log('\n🧪 Testing complete insert (matching app)...');
    const completeData = {
      category: 'Office Supplies',
      item: 'Complete Test Item',
      description: 'Test item description',
      quantity: 10,
      rate: 5.00,
      stock: 10,
      selling_price: 7.50,
      profit_per_unit: 2.50,
      low_stock_threshold: 5
    };
    
    const { data: completeInsertData, error: completeInsertError } = await supabase
      .from('stationery')
      .insert([completeData])
      .select()
      .single();
    
    if (completeInsertError) {
      console.error('❌ Complete insert failed:', completeInsertError.message);
      console.error('Error details:', JSON.stringify(completeInsertError, null, 2));
      
      // Check if it's a column mismatch error
      if (completeInsertError.message.includes('column') && completeInsertError.message.includes('does not exist')) {
        console.error('This suggests a column name mismatch between the app and database');
      }
    } else {
      console.log('✅ Complete insert successful');
      
      // Clean up
      const { error: deleteError } = await supabase
        .from('stationery')
        .delete()
        .eq('id', completeInsertData.id);
      
      if (deleteError) {
        console.warn('⚠️  Could not clean up test data:', deleteError.message);
      } else {
        console.log('✅ Cleaned up test data');
      }
    }
    
    console.log('\n✅ Table schema check complete');
    
  } catch (error) {
    console.error('❌ Error checking table schema:', error.message);
    process.exit(1);
  }
}

// Run the check
checkTableSchema();