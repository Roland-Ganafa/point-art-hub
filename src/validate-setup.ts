import { createClient } from '@supabase/supabase-js';

// Simple validation script to check Supabase setup
async function validateSetup() {
  console.log('🔍 Validating Point Art Hub setup...\n');

  // Check environment variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Environment variables missing!');
    console.log('Please check your .env file has:');
    console.log('- VITE_SUPABASE_URL');
    console.log('- VITE_SUPABASE_ANON_KEY');
    return;
  }

  if (supabaseUrl.includes('your-project-id') || supabaseKey.includes('your-anon-key')) {
    console.error('❌ Please update .env file with your actual Supabase credentials!');
    return;
  }

  console.log('✅ Environment variables configured');

  // Test Supabase connection
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      if (error.message.includes('relation "profiles" does not exist')) {
        console.error('❌ Database schema not set up!');
        console.log('Please run the database_setup.sql script in your Supabase SQL Editor');
        return;
      }
      throw error;
    }

    console.log('✅ Supabase connection successful');
    console.log('✅ Database schema exists');

    // Check for required tables
    const tables = ['profiles', 'stationery', 'gift_store', 'embroidery', 'machines', 'art_services', 'stationery_sales'];
    let allTablesExist = true;

    for (const table of tables) {
      try {
        await supabase.from(table).select('count').limit(1);
        console.log(`✅ Table '${table}' exists`);
      } catch (err) {
        console.error(`❌ Table '${table}' missing`);
        allTablesExist = false;
      }
    }

    if (allTablesExist) {
      console.log('\n🎉 Setup validation completed successfully!');
      console.log('You can now start using Point Art Hub');
      console.log('\n📋 Next steps:');
      console.log('1. Start the dev server: npm run dev');
      console.log('2. Create your first user account');
      console.log('3. Visit Admin Profile to assign sales initials');
    } else {
      console.log('\n❌ Some database tables are missing');
      console.log('Please run the complete database_setup.sql script');
    }

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check your Supabase project is active (not paused)');
    console.log('2. Verify your credentials are correct');
    console.log('3. Ensure RLS policies are set up correctly');
  }
}

// Run validation
validateSetup().catch(console.error);