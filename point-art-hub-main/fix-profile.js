/**
 * Profile Initialization Script
 * 
 * This script fixes missing profile information for existing users
 * and assigns proper roles and initials.
 * 
 * Run with: node fix-profile.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure your .env file contains:');
  console.log('- VITE_SUPABASE_URL');
  console.log('- VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixUserProfiles() {
  console.log('🔧 Point Art Hub - Profile Initialization');
  console.log('═══════════════════════════════════════');

  try {
    // Get all profiles
    console.log('📋 Fetching user profiles...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      console.log('ℹ️  No profiles found in the system.');
      return;
    }

    console.log(`\n📊 Found ${profiles.length} profile(s):`);
    
    let updatesNeeded = [];
    
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.full_name || 'Unnamed'} (${profile.role || 'No role'})`);
      
      const updates = {};
      
      // Fix missing full name
      if (!profile.full_name || profile.full_name === 'Unknown User') {
        updates.full_name = `User ${index + 1}`;
      }
      
      // Assign admin role to first user if no admin exists
      if (index === 0 && !profiles.some(p => p.role === 'admin')) {
        updates.role = 'admin';
        console.log('   → Will assign admin role (first user)');
      } else if (!profile.role) {
        updates.role = 'user';
        console.log('   → Will assign user role');
      }
      
      // Assign sales initials if missing
      if (!profile.sales_initials) {
        // Generate initials from full name or email
        const name = updates.full_name || profile.full_name || `User${index + 1}`;
        const initials = name.split(' ')
          .map(word => word.charAt(0).toUpperCase())
          .join('')
          .substring(0, 3) || `U${index + 1}`;
        
        updates.sales_initials = initials;
        console.log(`   → Will assign initials: ${initials}`);
      }
      
      if (Object.keys(updates).length > 0) {
        updatesNeeded.push({
          id: profile.id,
          updates: updates
        });
      }
    });

    if (updatesNeeded.length === 0) {
      console.log('\n✅ All profiles are properly configured!');
      return;
    }

    console.log(`\n🔄 Updating ${updatesNeeded.length} profile(s)...`);
    
    // Apply updates
    for (const { id, updates } of updatesNeeded) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        console.error(`❌ Failed to update profile ${id}:`, updateError.message);
      } else {
        console.log(`✅ Updated profile ${id}`);
      }
    }

    console.log('\n🎉 Profile initialization completed!');
    console.log('\n📝 Changes made:');
    console.log('• Assigned missing roles');
    console.log('• Generated sales initials');
    console.log('• Fixed missing names');
    console.log('• Set first user as admin');
    
    console.log('\n🔄 Next steps:');
    console.log('1. Refresh the application');
    console.log('2. You should now see proper profile information');
    console.log('3. Admin features should be accessible');

  } catch (error) {
    console.error('❌ Error fixing profiles:', error.message);
    process.exit(1);
  }
}

// Check connection and run
async function main() {
  try {
    console.log('🔍 Checking database connection...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (error) throw error;
    
    console.log('✅ Database connection successful');
    
    await fixUserProfiles();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n💡 Check your .env file and Supabase credentials');
    process.exit(1);
  }
}

main().catch(console.error);