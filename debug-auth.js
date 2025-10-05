// Debug authentication issues
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

async function debugAuth() {
  console.log('=== Authentication Debug ===');
  
  try {
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return;
    }
    
    console.log('Session exists:', !!session);
    if (session) {
      console.log('User ID:', session.user?.id);
      console.log('User email:', session.user?.email);
      console.log('Expires at:', session.expires_at);
    }
    
    // Check if user exists in profiles table
    if (session?.user?.id) {
      console.log('\n=== Profile Check ===');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      if (profileError) {
        console.error('Profile error:', profileError);
      } else {
        console.log('Profile found:', profile);
      }
    }
    
    // Try a simple select from stationery
    console.log('\n=== Stationery Access Test ===');
    const { data: stationery, error: stationeryError } = await supabase
      .from('stationery')
      .select('id')
      .limit(1);
    
    if (stationeryError) {
      console.error('Stationery SELECT error:', stationeryError);
    } else {
      console.log('Stationery SELECT success, found:', stationery?.length || 0, 'items');
    }
    
    // Try to insert a minimal item
    console.log('\n=== Minimal Insert Test ===');
    const { data: insertResult, error: insertError } = await supabase
      .from('stationery')
      .insert([{ item: 'Debug Test Item' }])
      .select()
      .single();
    
    if (insertError) {
      console.error('Insert error:', insertError);
      console.error('Error code:', insertError.code);
    } else {
      console.log('Insert success:', insertResult);
      
      // Clean up
      if (insertResult?.id) {
        await supabase
          .from('stationery')
          .delete()
          .eq('id', insertResult.id);
        console.log('Cleaned up test item');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

debugAuth();