// Emergency Admin Access Script
// Use this if the admin button doesn't appear in the UI

function emergencyAdminAccess() {
  console.log('🚨 Emergency Admin Access Activated');
  console.log('===================================');
  
  // Check current user status
  if (!window.location.href.includes('localhost') && !window.location.href.includes('127.0.0.1')) {
    console.log('⚠️ This script is for development use only');
    return;
  }
  
  // Method 1: Direct navigation to admin page
  console.log('🔗 Method 1: Direct navigation to /admin');
  if (window.location.pathname !== '/admin') {
    console.log('Navigating to admin panel...');
    window.location.href = '/admin';
    return;
  }
  
  // Method 2: Add emergency admin button to page
  console.log('🛠️ Method 2: Adding emergency admin button');
  
  // Remove existing emergency button if any
  const existingBtn = document.getElementById('emergency-admin-btn');
  if (existingBtn) {
    existingBtn.remove();
  }
  
  // Create emergency admin button
  const adminBtn = document.createElement('button');
  adminBtn.id = 'emergency-admin-btn';
  adminBtn.innerHTML = '🚨 Emergency Admin Access';
  adminBtn.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 9999;
    background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
    font-size: 14px;
    transition: all 0.3s ease;
  `;
  
  adminBtn.onmouseover = () => {
    adminBtn.style.transform = 'scale(1.05)';
    adminBtn.style.boxShadow = '0 6px 16px rgba(255, 107, 107, 0.6)';
  };
  
  adminBtn.onmouseout = () => {
    adminBtn.style.transform = 'scale(1)';
    adminBtn.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.4)';
  };
  
  adminBtn.onclick = () => {
    console.log('🔗 Emergency admin access clicked');
    if (window.location.pathname === '/admin') {
      console.log('✅ Already on admin page');
      alert('You are already on the admin page!');
    } else {
      console.log('🚀 Navigating to admin page...');
      window.location.href = '/admin';
    }
  };
  
  document.body.appendChild(adminBtn);
  
  console.log('✅ Emergency admin button added to top-right corner');
  console.log('🎯 Button will navigate to /admin when clicked');
  
  // Auto-remove after 30 seconds
  setTimeout(() => {
    if (document.getElementById('emergency-admin-btn')) {
      adminBtn.remove();
      console.log('🕐 Emergency admin button auto-removed after 30 seconds');
    }
  }, 30000);
}

// Method 3: Check and fix admin status
async function checkAdminStatusAndFix() {
  console.log('🔍 Checking admin status...');
  
  if (!window.supabase) {
    console.error('❌ Supabase not available');
    return;
  }
  
  const { data: { session } } = await window.supabase.auth.getSession();
  if (!session) {
    console.error('❌ Not logged in');
    return;
  }
  
  console.log('📧 Current user:', session.user.email);
  
  // Check profile
  const { data: profile, error } = await window.supabase
    .from('profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single();
    
  if (error) {
    console.error('❌ Profile error:', error);
    return;
  }
  
  console.log('👤 Profile role:', profile?.role);
  
  if (profile?.role === 'admin') {
    console.log('✅ You ARE an admin!');
    console.log('🔧 If button is missing, try:');
    console.log('   1. Refresh the page (Ctrl+F5)');
    console.log('   2. Clear browser cache');
    console.log('   3. Use emergencyAdminAccess()');
  } else {
    console.log('❌ You are NOT an admin');
    console.log('🛠️ To become admin, run: makeCurrentUserAdmin()');
    console.log('🔐 For emergency access, use the admin panel interface');
  }
}

// Method 4: Force admin role (for development)
async function makeCurrentUserAdmin() {
  if (!window.supabase) {
    console.error('❌ Supabase not available');
    return;
  }
  
  const { data: { session } } = await window.supabase.auth.getSession();
  if (!session) {
    console.error('❌ Not logged in');
    return;
  }
  
  console.log('🔧 Setting admin role for:', session.user.email);
  
  const { data, error } = await window.supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('user_id', session.user.id)
    .select()
    .single();
    
  if (error) {
    console.error('❌ Error setting admin role:', error);
  } else {
    console.log('✅ Admin role set successfully!');
    console.log('🔄 Refresh the page to see admin button');
    console.log('Updated profile:', data);
  }
}

// Method 5: New emergency admin access through the app's built-in functionality
async function requestEmergencyAdminAccess() {
  console.log('🔐 Requesting emergency admin access through app...');
  
  // This would integrate with the new grantEmergencyAdmin function
  // if it were available in the global scope
  console.log('ℹ️ This feature integrates with the app\'s built-in emergency access system');
  console.log('   Navigate to the Admin Panel and use the "Emergency Admin Access" section');
}

// Export functions
window.emergencyAdminAccess = emergencyAdminAccess;
window.checkAdminStatusAndFix = checkAdminStatusAndFix;
window.makeCurrentUserAdmin = makeCurrentUserAdmin;
window.requestEmergencyAdminAccess = requestEmergencyAdminAccess;

console.log('🚨 Emergency Admin Access Script Loaded!');
console.log('');
console.log('📞 Available functions:');
console.log('   emergencyAdminAccess() - Add emergency admin button');
console.log('   checkAdminStatusAndFix() - Check your admin status');
console.log('   makeCurrentUserAdmin() - Force set admin role');
console.log('   requestEmergencyAdminAccess() - Use app\'s built-in emergency access');
console.log('');
console.log('🎯 Quick fix: Run emergencyAdminAccess() if admin button is missing');