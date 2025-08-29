// Test script to check gift_store insertion directly
const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://uizibdtiuvjjikbrkdcv.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key_here';

console.log('Testing gift_store insertion...');
console.log('Supabase URL:', SUPABASE_URL);
console.log('Service Key available:', !!SUPABASE_SERVICE_KEY && SUPABASE_SERVICE_KEY !== 'your_service_role_key_here');

// Create Supabase client with service role key for full access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testInsert() {
  try {
    // Test data
    const testData = {
      item: 'Test Item',
      category: 'kids_toys',
      quantity: 10,
      rate: 500,
      stock: 10,
      selling_price: 750,
      profit_per_unit: 250,
      low_stock_threshold: 5,
      sales: 0,
      date: new Date().toISOString().split('T')[0]
    };

    console.log('Inserting test data:', testData);

    // Try to insert
    const { data, error } = await supabase
      .from('gift_store')
      .insert([testData])
      .select();

    if (error) {
      console.error('Insert error:', error);
      return;
    }

    console.log('Insert successful:', data);

    // Clean up - delete the test item
    if (data && data[0] && data[0].id) {
      const { error: deleteError } = await supabase
        .from('gift_store')
        .delete()
        .eq('id', data[0].id);

      if (deleteError) {
        console.error('Cleanup error:', deleteError);
      } else {
        console.log('Test item cleaned up successfully');
      }
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

testInsert();