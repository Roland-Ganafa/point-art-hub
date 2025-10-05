// Script to verify the RLS fix works
// This needs to be run in a browser console or similar environment with access to the Supabase client

console.log('=== RLS Fix Verification ===');
console.log('This script should be run in the browser console after applying the RLS fix.');

console.log(`
To verify the fix:

1. Open your browser's developer console (F12)
2. Paste the following code and run it:

// Check if Supabase is available
if (typeof supabase !== 'undefined') {
  console.log('✅ Supabase client found');
  
  // Test a minimal insert
  const testItem = { 
    item: 'RLS Fix Verification Item',
    quantity: 1,
    rate: 1.00,
    selling_price: 2.00
  };
  
  supabase
    .from('stationery')
    .insert([testItem])
    .select()
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Insert failed:', error);
        console.error('Error code:', error.code);
      } else {
        console.log('✅ Insert succeeded:', data);
        
        // Clean up
        if (data && data[0] && data[0].id) {
          supabase
            .from('stationery')
            .delete()
            .eq('id', data[0].id)
            .then(() => {
              console.log('✅ Test item cleaned up');
            });
        }
      }
    });
} else {
  console.error('❌ Supabase client not found. Make sure you are on the app page.');
}

console.log('After running this code, check the console output to see if the insert succeeded.');
`);