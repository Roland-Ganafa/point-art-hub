// Diagnose Emergency Admin Button Issues
// Run this in the browser console to diagnose issues with the emergency admin button

/**
 * Diagnose emergency admin button issues
 */
async function diagnoseEmergencyAdminButton() {
  console.log('🔍 Diagnosing Emergency Admin Button Issues...');
  console.log('=============================================');
  
  // Check if we're in the right environment
  console.log('📍 Location:', window.location.href);
  console.log('   Path:', window.location.pathname);
  
  // Check if required functions are available
  console.log('\n🔧 Checking required functions:');
  console.log('  grantEmergencyAdmin:', typeof window.grantEmergencyAdmin);
  console.log('  useUser hook:', typeof window.useUser);
  console.log('  ⚠️  Note: React hooks cannot be called from console');
  
  // Check Supabase availability
  const supabaseClient = window.supabase;
  if (!supabaseClient) {
    console.error('  ❌ Supabase client not available on window.supabase');
    return;
  }
  console.log('  ✅ Supabase client available');
  
  // Check user authentication status
  console.log('\n👤 Checking authentication status:');
  let currentSession = null;
  let currentProfile = null;
  
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (error) {
      console.error('  ❌ Auth error:', error.message);
      return;
    }
    
    if (!session) {
      console.log('  ⚠️  No active session - please log in first');
      return;
    }
    
    currentSession = session;
    console.log('  ✅ User logged in:', session.user.email);
    console.log('  🆔 User ID:', session.user.id);
    
  } catch (err) {
    console.error('  ❌ Error checking session:', err);
    return;
  }
  
  // Check profile status
  console.log('\n👥 Checking profile status:');
  try {
    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', currentSession.user.id)
      .maybeSingle(); // Use maybeSingle() to avoid error on no rows
      
    if (error) {
      console.error('  ❌ Profile error:', error.message);
      console.error('     Code:', error.code);
    } else if (profile) {
      currentProfile = profile;
      console.log('  ✅ Profile found:');
      console.log('     Role:', profile.role || 'null');
      console.log('     Full name:', profile.full_name || 'null');
      console.log('     Created:', profile.created_at);
    } else {
      console.log('  ⚠️  No profile found for user');
      console.log('     This is likely why the button is hidden');
    }
  } catch (err) {
    console.error('  ❌ Error checking profile:', err);
  }
  
  // Check DOM for the button
  console.log('\n🖱️  Checking for Emergency Admin Button in DOM:');
  const buttons = document.querySelectorAll('button');
  let foundButton = null;
  
  buttons.forEach((button) => {
    const text = button.textContent?.trim() || '';
    if (text.includes('Emergency Admin') || text.includes('Grant Admin')) {
      console.log('  ✅ Found Emergency Admin Button:');
      console.log('     Text:', text);
      console.log('     Visible:', button.offsetParent !== null);
      console.log('     Disabled:', button.disabled);
      console.log('     Classes:', button.className);
      
      // Safely check for event listeners
      if (typeof getEventListeners === 'function') {
        try {
          const listeners = getEventListeners(button);
          console.log('     Event listeners:', Object.keys(listeners));
        } catch (e) {
          console.log('     Event listeners: Unable to inspect');
        }
      } else {
        console.log('     Event listeners: Use Chrome DevTools to inspect');
      }
      
      foundButton = button;
    }
  });
  
  if (!foundButton) {
    console.log('  ❌ Emergency Admin Button not found in DOM');
    console.log('     The button should appear when:');
    console.log('       1. User is logged in');
    console.log('       2. User has a profile');
    console.log('       3. User is NOT already an admin');
    console.log('       4. Loading is complete');
  }
  
  // Check if we're in development mode
  console.log('\n🖥️  Environment checks:');
  const isDevMode = localStorage.getItem('mock_auth_active') === 'true';
  console.log('  Mock auth active:', isDevMode);
  console.log('  Node env:', process?.env?.NODE_ENV || 'unknown (not accessible from browser)');
  
  // Determine button visibility logic
  console.log('\n🔍 Button visibility logic:');
  const isAdmin = currentProfile?.role === 'admin';
  const hasProfile = !!currentProfile;
  const isLoggedIn = !!currentSession;
  
  console.log('  Logged in:', isLoggedIn);
  console.log('  Has profile:', hasProfile);
  console.log('  Is admin:', isAdmin);
  console.log('  ⚠️  Loading state: Unknown (managed by React)');
  
  const shouldShowButton = isLoggedIn && hasProfile && !isAdmin;
  console.log('\n  Expected button visibility:', shouldShowButton ? '✅ VISIBLE' : '❌ HIDDEN');
  
  if (!shouldShowButton) {
    console.log('  Button hidden because:');
    if (!isLoggedIn) console.log('    ❌ Not logged in');
    if (!hasProfile) console.log('    ❌ No profile exists');
    if (isAdmin) console.log('    ✅ Already an admin');
  }
  
  // Summary and recommendations
  console.log('\n📋 Summary & Recommendations:');
  console.log('=================================');
  
  if (!currentProfile) {
    console.log('⚠️  PRIMARY ISSUE: No profile found');
    console.log('   Solution: Create a profile first');
    console.log('   Run: await createUserProfile()');
  } else if (isAdmin) {
    console.log('✅ You already have admin access!');
    console.log('   The button is hidden because you don\'t need it.');
  } else if (!foundButton) {
    console.log('⚠️  Button should be visible but isn\'t in DOM');
    console.log('   Possible causes:');
    console.log('   1. Page hasn\'t fully loaded - wait a moment and try again');
    console.log('   2. React rendering issue - check browser console for React errors');
    console.log('   3. Component conditional logic issue');
    console.log('\n   Try these alternatives:');
    console.log('   1. await window.grantEmergencyAdmin() (if available)');
    console.log('   2. await forceEmergencyAdminAccess()');
    console.log('   3. Use SQL in Supabase Dashboard');
  } else if (foundButton && foundButton.disabled) {
    console.log('⚠️  Button exists but is disabled');
    console.log('   Check browser console for errors when clicking');
  } else if (foundButton && foundButton.offsetParent === null) {
    console.log('⚠️  Button exists but is hidden (CSS)');
    console.log('   This is unusual - check CSS styles');
  } else {
    console.log('✅ Button should be working!');
    console.log('   Try clicking it or run: tryClickEmergencyAdminButton()');
  }
}

/**
 * Try to click the emergency admin button programmatically
 */
function tryClickEmergencyAdminButton() {
  console.log('🖱️  Trying to click Emergency Admin Button...');
  
  const buttons = document.querySelectorAll('button');
  let targetButton = null;
  
  buttons.forEach(button => {
    const text = button.textContent?.trim() || '';
    if (text.includes('Emergency Admin') || text.includes('Grant Admin')) {
      targetButton = button;
    }
  });
  
  if (!targetButton) {
    console.log('❌ Emergency Admin Button not found in DOM');
    console.log('   Run diagnoseEmergencyAdminButton() for more details');
    return false;
  }
  
  console.log('✅ Found button:', targetButton.textContent.trim());
  
  if (targetButton.offsetParent === null) {
    console.log('❌ Button is hidden (CSS display: none or visibility: hidden)');
    return false;
  }
  
  if (targetButton.disabled) {
    console.log('❌ Button is disabled');
    return false;
  }
  
  console.log('✅ Button is clickable, attempting click...');
  targetButton.click();
  console.log('✅ Click event dispatched');
  console.log('   Watch for console messages or UI changes...');
  return true;
}

/**
 * Create a user profile if one doesn't exist
 */
async function createUserProfile() {
  console.log('🆕 Creating user profile...');
  
  const supabaseClient = window.supabase;
  if (!supabaseClient) {
    console.error('❌ Supabase client not available');
    return false;
  }
  
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
      console.error('❌ No active session');
      return false;
    }
    
    console.log('✅ Creating profile for:', session.user.email);
    
    const { data, error } = await supabaseClient
      .from('profiles')
      .insert([{
        user_id: session.user.id,
        full_name: session.user.user_metadata?.full_name || session.user.email || 'User',
        role: 'user' // Start as regular user
      }])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating profile:', error.message);
      return false;
    }
    
    console.log('✅ Profile created:', data);
    console.log('🔄 Refresh the page to see the Emergency Admin button');
    return true;
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

// Export functions
window.diagnoseEmergencyAdminButton = diagnoseEmergencyAdminButton;
window.tryClickEmergencyAdminButton = tryClickEmergencyAdminButton;
window.createUserProfile = createUserProfile;

console.log('🚨 Emergency Admin Button Diagnostic Tools Loaded!');
console.log('');
console.log('Available functions:');
console.log('  diagnoseEmergencyAdminButton()   - Full diagnostic check');
console.log('  tryClickEmergencyAdminButton()   - Programmatically click the button');
console.log('  createUserProfile()              - Create missing profile');
console.log('');
console.log('Start with: diagnoseEmergencyAdminButton()');