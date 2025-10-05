#!/usr/bin/env node

/**
 * Script to check the current user's role and permissions
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

async function checkUserRole() {
  console.log('🔍 Checking user role and permissions...');
  
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message);
      return;
    }
    
    if (!session) {
      console.log('⚠️  No active session. Please log in to the application first.');
      return;
    }
    
    console.log('✅ User is authenticated');
    console.log('User ID:', session.user?.id);
    console.log('User Email:', session.user?.email);
    
    // Check user profile
    console.log('\n📋 Checking user profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile error:', profileError.message);
      return;
    }
    
    console.log('Profile ID:', profileData.id);
    console.log('Full Name:', profileData.full_name);
    console.log('Role:', profileData.role || 'No role assigned');
    console.log('Sales Initials:', profileData.sales_initials || 'Not set');
    
    // Check if user is admin
    const isAdmin = profileData.role === 'admin';
    console.log('Is Admin:', isAdmin);
    
    // Test stationery access
    console.log('\n🧪 Testing stationery access...');
    
    // Test SELECT
    const { data: selectData, error: selectError } = await supabase
      .from('stationery')
      .select('id')
      .limit(1);
    
    if (selectError) {
      console.error('❌ SELECT failed:', selectError.message);
    } else {
      console.log('✅ SELECT successful');
    }
    
    // Test INSERT with minimal data
    const testData = {
      item: 'Permission Test Item'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('stationery')
      .insert([testData])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ INSERT failed:', insertError.message);
      console.error('Error code:', insertError.code);
    } else {
      console.log('✅ INSERT successful');
      
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
    
    console.log('\n✅ User role check complete');
    
  } catch (error) {
    console.error('❌ Error checking user role:', error.message);
    process.exit(1);
  }
}

// Run the check
checkUserRole();