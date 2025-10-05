// Comprehensive debug script for the stationery module issue
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function comprehensiveDebug() {
  console.log('=== Comprehensive Debug for Stationery Module ===\n');
  
  try {
    // 1. Check session
    console.log('1. Checking session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return;
    }
    
    console.log('✅ Session status:', session ? 'Authenticated' : 'Not authenticated');
    if (session) {
      console.log('   User ID:', session.user?.id);
      console.log('   User email:', session.user?.email);
    }
    
    // 2. Check user profile
    if (session?.user?.id) {
      console.log('\n2. Checking user profile...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      if (profileError) {
        console.error('❌ Profile error:', profileError);
      } else {
        console.log('✅ Profile found');
        console.log('   Profile ID:', profile.id);
        console.log('   Full name:', profile.full_name);
        console.log('   Role:', profile.role || 'No role');
        console.log('   Sales initials:', profile.sales_initials || 'Not set');
      }
    }
    
    // 3. Check table schema
    console.log('\n3. Checking stationery table schema...');
    const { data: columns, error: columnsError } = await supabase
      .from('stationery')
      .select('*')
      .limit(1);
    
    if (columnsError) {
      console.error('❌ Table access error:', columnsError);
    } else {
      console.log('✅ Table accessible');
      if (columns && columns.length > 0) {
        const firstRow = columns[0];
        console.log('   Available columns:', Object.keys(firstRow).sort());
        
        // Check for required columns
        const requiredColumns = ['stock', 'profit_per_unit', 'low_stock_threshold', 'sold_by'];
        console.log('   Checking required columns:');
        for (const col of requiredColumns) {
          console.log(`     ${col}:`, col in firstRow ? '✅ Present' : '❌ Missing');
        }
      } else {
        console.log('   Table is empty');
      }
    }
    
    // 4. Test different insert scenarios
    console.log('\n4. Testing insert scenarios...');
    
    // Test A: Minimal insert
    console.log('   A. Minimal insert test...');
    const minimalItem = { item: 'Minimal Test Item' };
    const { error: minimalError } = await supabase
      .from('stationery')
      .insert([minimalItem]);
    
    console.log('      Result:', minimalError ? `❌ Failed - ${minimalError.message}` : '✅ Success');
    
    // Test B: Standard insert (what the app is trying to do)
    console.log('   B. Standard insert test...');
    const standardItem = {
      category: 'Office Supplies',
      item: 'Standard Test Item',
      description: 'Test description',
      quantity: 10,
      rate: 5.00,
      stock: 10,
      selling_price: 7.50,
      profit_per_unit: 2.50,
      low_stock_threshold: 5
    };
    
    const { error: standardError } = await supabase
      .from('stationery')
      .insert([standardItem]);
    
    console.log('      Result:', standardError ? `❌ Failed - ${standardError.message}` : '✅ Success');
    if (standardError) {
      console.log('      Error code:', standardError.code);
      console.log('      Error details:', standardError);
    }
    
    // Test C: Insert with only basic required fields
    console.log('   C. Basic fields insert test...');
    const basicItem = {
      item: 'Basic Test Item',
      quantity: 5,
      rate: 3.00,
      selling_price: 4.50
    };
    
    const { error: basicError } = await supabase
      .from('stationery')
      .insert([basicItem]);
    
    console.log('      Result:', basicError ? `❌ Failed - ${basicError.message}` : '✅ Success');
    
    // 5. Clean up test items
    console.log('\n5. Cleaning up test items...');
    const { error: cleanupError } = await supabase
      .from('stationery')
      .delete()
      .ilike('item', '%Test Item');
    
    if (cleanupError) {
      console.warn('⚠️  Cleanup warning:', cleanupError.message);
    } else {
      console.log('✅ Cleanup completed');
    }
    
    console.log('\n=== Debug Complete ===');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

comprehensiveDebug();