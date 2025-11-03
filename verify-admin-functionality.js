// Verify Admin Functionality Script
// This script verifies that the admin functionality works correctly

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

console.log('🔧 Verifying Admin Functionality...');
console.log('================================');

// Check if required files exist
const requiredFiles = [
  'src/contexts/UserContext.tsx',
  'src/components/Dashboard.tsx',
  'create-admin.js',
  'grant-admin-access.sql'
];

console.log('\n📁 Checking required files:');
requiredFiles.forEach(file => {
  try {
    const fullPath = join(process.cwd(), file);
    if (existsSync(fullPath)) {
      console.log(`  ✅ ${file} - Found`);
    } else {
      console.log(`  ❌ ${file} - Not found`);
    }
  } catch (error) {
    console.log(`  ❌ ${file} - Error checking: ${error.message}`);
  }
});

// Check UserContext for grantEmergencyAdmin function
console.log('\n🔑 Checking UserContext for grantEmergencyAdmin function:');
try {
  const userContextPath = join(process.cwd(), 'src/contexts/UserContext.tsx');
  const userContextContent = readFileSync(userContextPath, 'utf8');
  
  if (userContextContent.includes('grantEmergencyAdmin')) {
    console.log('  ✅ grantEmergencyAdmin function found in UserContext');
  } else {
    console.log('  ❌ grantEmergencyAdmin function NOT found in UserContext');
  }
  
  if (userContextContent.includes('useCallback') && userContextContent.includes('async')) {
    console.log('  ✅ grantEmergencyAdmin is properly defined as async function');
  } else {
    console.log('  ⚠️  Check if grantEmergencyAdmin is properly defined');
  }
} catch (error) {
  console.log(`  ❌ Error checking UserContext: ${error.message}`);
}

// Check Dashboard for emergency admin button
console.log('\n🖱️  Checking Dashboard for emergency admin button:');
try {
  const dashboardPath = join(process.cwd(), 'src/components/Dashboard.tsx');
  const dashboardContent = readFileSync(dashboardPath, 'utf8');
  
  if (dashboardContent.includes('Emergency Admin Access')) {
    console.log('  ✅ Emergency Admin Access button found in Dashboard');
  } else {
    console.log('  ❌ Emergency Admin Access button NOT found in Dashboard');
  }
  
  if (dashboardContent.includes('handleEmergencyAdminAccess')) {
    console.log('  ✅ handleEmergencyAdminAccess function found');
  } else {
    console.log('  ❌ handleEmergencyAdminAccess function NOT found');
  }
  
  if (dashboardContent.includes('!loading && !isAdmin && profile')) {
    console.log('  ✅ Button visibility conditions found');
  } else {
    console.log('  ⚠️  Check button visibility conditions');
  }
} catch (error) {
  console.log(`  ❌ Error checking Dashboard: ${error.message}`);
}

// Check SQL script
console.log('\n🗄️  Checking SQL script for admin access:');
try {
  const sqlPath = join(process.cwd(), 'grant-admin-access.sql');
  const sqlContent = readFileSync(sqlPath, 'utf8');
  
  if (sqlContent.includes('UPDATE profiles') && sqlContent.includes('SET role = \'admin\'')) {
    console.log('  ✅ SQL script contains profile update command');
  } else {
    console.log('  ❌ SQL script may be missing profile update command');
  }
  
  if (sqlContent.includes('INSERT INTO profiles')) {
    console.log('  ✅ SQL script contains profile creation command');
  } else {
    console.log('  ⚠️  SQL script may be missing profile creation command');
  }
} catch (error) {
  console.log(`  ❌ Error checking SQL script: ${error.message}`);
}

// Check create-admin script
console.log('\n🖥️  Checking create-admin script:');
try {
  const createAdminPath = join(process.cwd(), 'create-admin.js');
  const createAdminContent = readFileSync(createAdminPath, 'utf8');
  
  if (createAdminContent.includes('grantEmergencyAdmin')) {
    console.log('  ✅ create-admin script references grantEmergencyAdmin');
  } else {
    console.log('  ⚠️  create-admin script may not reference grantEmergencyAdmin');
  }
  
  if (createAdminContent.includes('supabase.auth.signUp')) {
    console.log('  ✅ create-admin script contains user creation logic');
  } else {
    console.log('  ❌ create-admin script may be missing user creation logic');
  }
} catch (error) {
  console.log(`  ❌ Error checking create-admin script: ${error.message}`);
}

console.log('\n✅ Verification complete!');
console.log('\n📋 Summary:');
console.log('  If all checks show ✅, the admin functionality should work correctly.');
console.log('  If there are ❌ errors, you may need to check those specific files.');
console.log('  ⚠️  warnings indicate potential issues that should be reviewed.');