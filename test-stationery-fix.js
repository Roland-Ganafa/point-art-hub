// Test script to verify the stationery stock fix
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testStationeryFix() {
  try {
    console.log('Testing stationery table schema...');
    
    // Test 1: Check if we can query the stationery table
    const { data: testData, error: testError } = await supabase
      .from('stationery')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error querying stationery table:', testError.message);
      return;
    }
    
    console.log('✅ Successfully queried stationery table');
    
    // Test 2: Check if stock column exists
    if (testData && testData.length > 0) {
      const firstItem = testData[0];
      if ('stock' in firstItem) {
        console.log('✅ Stock column exists in stationery table');
        console.log('Sample stock value:', firstItem.stock);
      } else {
        console.error('❌ Stock column is missing from stationery table');
        return;
      }
    }
    
    // Test 3: Try to insert a test item with all required columns
    const testItem = {
      item: 'Test Item',
      category: 'Office Supplies',
      description: 'Test item for verification',
      quantity: 10,
      rate: 50.00,
      stock: 10,
      selling_price: 75.00,
      profit_per_unit: 25.00,
      low_stock_threshold: 5
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('stationery')
      .insert([testItem])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error inserting test item:', insertError.message);
      console.error('Error details:', insertError);
      return;
    }
    
    console.log('✅ Successfully inserted test item');
    console.log('Inserted item ID:', insertData.id);
    
    // Clean up: Delete the test item
    const { error: deleteError } = await supabase
      .from('stationery')
      .delete()
      .eq('id', insertData.id);
    
    if (deleteError) {
      console.warn('Warning: Could not delete test item:', deleteError.message);
    } else {
      console.log('✅ Successfully cleaned up test item');
    }
    
    console.log('\n🎉 All tests passed! The stationery stock fix is working correctly.');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    process.exit(1);
  }
}

// Run the test
testStationeryFix();