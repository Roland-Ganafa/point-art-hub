#!/usr/bin/env node

/**
 * Script to check RLS policies for the stationery table
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

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS policies for stationery table...');
  
  try {
    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message);
      return;
    }
    
    if (!session) {
      console.log('⚠️  No active session. Some checks may be limited.');
    } else {
      console.log('✅ User is authenticated');
      console.log('User ID:', session.user?.id);
    }
    
    // Check if RLS is enabled on the stationery table
    console.log('\n📋 Checking if RLS is enabled on stationery table...');
    
    // We can't directly query the RLS policies through the API, but we can test access
    console.log('🧪 Testing SELECT access...');
    const { data: selectData, error: selectError } = await supabase
      .from('stationery')
      .select('id')
      .limit(1);
    
    if (selectError) {
      console.error('❌ SELECT failed:', selectError.message);
      console.error('Error code:', selectError.code);
    } else {
      console.log('✅ SELECT successful');
    }
    
    console.log('\n🧪 Testing INSERT access with minimal data...');
    const testData = {
      item: 'RLS Test Item',
      quantity: 1,
      rate: 1.00,
      selling_price: 2.00
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('stationery')
      .insert([testData])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ INSERT failed:', insertError.message);
      console.error('Error code:', insertError.code);
      if (insertError.code === '42501') {
        console.error('This is an RLS policy violation error');
      }
    } else {
      console.log('✅ INSERT successful');
      
      // Clean up test data
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
    
    // Check user role
    if (session?.user?.id) {
      console.log('\n📋 Checking user role...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      
      if (profileError) {
        console.error('❌ Could not fetch profile:', profileError.message);
      } else {
        console.log('User role:', profileData.role || 'No role assigned');
      }
    }
    
    console.log('\n✅ RLS policy check complete');
    
  } catch (error) {
    console.error('❌ Error checking RLS policies:', error.message);
    process.exit(1);
  }
}

// Run the check
checkRLSPolicies();