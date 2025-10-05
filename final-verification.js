#!/usr/bin/env node

/**
 * Final verification script for the Stationery Module fix
 * This script performs all checks to verify the fix is working
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

console.log('🔍 Final Verification of Stationery Module Fix');
console.log('==============================================');

async function finalVerification() {
  try {
    // Step 1: Check authentication
    console.log('\n1. Checking authentication...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message);
      return false;
    }
    
    if (!session) {
      console.error('❌ No active session. Please log in to the application first.');
      return false;
    }
    
    console.log('✅ User is authenticated');
    console.log('   User ID:', session.user?.id);
    
    // Step 2: Check user profile and role
    console.log('\n2. Checking user profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile error:', profileError.message);
      return false;
    }
    
    console.log('✅ Profile found');
    console.log('   Full Name:', profileData.full_name);
    console.log('   Role:', profileData.role || 'No role assigned');
    console.log('   Sales Initials:', profileData.sales_initials || 'Not set');
    
    // Step 3: Check table schema
    console.log('\n3. Checking stationery table schema...');
    const { data: schemaData, error: schemaError } = await supabase
      .from('stationery')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.error('❌ Schema error:', schemaError.message);
      return false;
    }
    
    if (schemaData && schemaData.length > 0) {
      const firstItem = schemaData[0];
      console.log('✅ Stationery table accessible');
      
      // Check for required columns
      const requiredColumns = ['stock', 'profit_per_unit', 'low_stock_threshold'];
      let allColumnsPresent = true;
      
      for (const column of requiredColumns) {
        if (column in firstItem) {
          console.log(`   ✅ Column '${column}' exists`);
        } else {
          console.error(`   ❌ Column '${column}' is missing`);
          allColumnsPresent = false;
        }
      }
      
      if (!allColumnsPresent) {
        console.error('❌ Required columns are missing. Please apply the database fix.');
        return false;
      }
    } else {
      console.log('⚠️  Stationery table is empty');
    }
    
    // Step 4: Test insert operation
    console.log('\n4. Testing insert operation...');
    const testData = {
      category: 'Verification',
      item: 'Final Verification Test Item',
      description: 'Test item for final verification',
      quantity: 5,
      rate: 10.00,
      stock: 5,
      selling_price: 15.00,
      profit_per_unit: 5.00,
      low_stock_threshold: 2
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('stationery')
      .insert([testData])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError.message);
      console.error('   Error code:', insertError.code);
      
      if (insertError.code === '42501') {
        console.error('   This is an RLS policy violation. Please check the policies.');
        return false;
      }
      
      return false;
    }
    
    console.log('✅ Insert successful');
    console.log('   Item ID:', insertData.id);
    
    // Step 5: Clean up test data
    console.log('\n5. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('stationery')
      .delete()
      .eq('id', insertData.id);
    
    if (deleteError) {
      console.warn('⚠️  Warning: Could not clean up test data:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up successfully');
    }
    
    // Step 6: Summary
    console.log('\n🎉 Final Verification Complete!');
    console.log('================================');
    console.log('✅ All checks passed!');
    console.log('✅ The Stationery Module should now work correctly.');
    console.log('✅ You can now use the "Add Item" button without errors.');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error during final verification:', error.message);
    return false;
  }
}

// Run the verification
finalVerification().then(success => {
  if (!success) {
    console.log('\n❌ Final verification failed. Please check the errors above and apply the necessary fixes.');
    console.log('📋 Refer to COMPREHENSIVE-FIX.md for detailed instructions.');
    process.exit(1);
  }
});