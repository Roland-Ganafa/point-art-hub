// Authentication status check
import { createClient } from '@supabase/supabase-js';

// Since we can't easily load env vars in this context, let's use a different approach
// This script is meant to be run in the browser console

console.log('=== Authentication Status Check ===');

// This would be run in the browser console:
/*
// Get the Supabase client from the window object if available
const supabase = window.supabase;

if (supabase) {
  console.log('Supabase client found');
  
  // Check session
  supabase.auth.getSession().then(({ data, error }) => {
    console.log('Session data:', data);
    console.log('Session error:', error);
    
    if (data.session) {
      console.log('User ID:', data.session.user.id);
      console.log('User email:', data.session.user.email);
      
      // Check profile
      supabase.from('profiles').select('*').eq('user_id', data.session.user.id).single().then(({ data: profile, error: profileError }) => {
        console.log('Profile:', profile);
        console.log('Profile error:', profileError);
        
        // Try a simple insert
        const testItem = { item: 'Auth Test Item' };
        supabase.from('stationery').insert([testItem]).then(({ data, error }) => {
          console.log('Insert result:', data);
          console.log('Insert error:', error);
          
          // Clean up
          if (!error) {
            supabase.from('stationery').delete().ilike('item', '%Auth Test Item').then(() => {
              console.log('Test item cleaned up');
            });
          }
        });
      });
    }
  });
} else {
  console.log('Supabase client not found in window object');
}
*/

console.log('To run this check, copy the commented code above and paste it in your browser console.');