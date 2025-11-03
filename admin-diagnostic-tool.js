// Admin Diagnostic Tool
// Run this in the browser console to diagnose admin access issues

console.log("=== Point Art Hub Admin Diagnostic Tool ===");

async function runAdminDiagnostic() {
  console.log("\n🔍 Running Admin Diagnostic...\n");
  
  // Check environment
  if (typeof window === 'undefined' || !window.location.hostname.includes('point')) {
    console.log("❌ ERROR: Not on Point Art Hub website");
    console.log("   This tool must be run on the actual Point Art Hub website");
    return;
  }
  
  console.log("✅ Environment check passed");
  
  // Check authentication status
  console.log("\n--- Authentication Check ---");
  try {
    if (typeof supabase === 'undefined') {
      console.log("❌ ERROR: Supabase client not found");
      return;
    }
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log("❌ ERROR: Failed to get session");
      console.log("   Error:", sessionError.message);
      return;
    }
    
    if (!session?.user) {
      console.log("❌ ERROR: No user logged in");
      console.log("   Please log in to Point Art Hub first");
      return;
    }
    
    console.log("✅ User authenticated");
    console.log("   Email:", session.user.email);
    console.log("   User ID:", session.user.id);
    
    // Check profile
    console.log("\n--- Profile Check ---");
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
      
    if (profileError) {
      console.log("❌ ERROR: Failed to get user profile");
      console.log("   Error:", profileError.message);
      return;
    }
    
    if (!profile) {
      console.log("❌ ERROR: No profile found for user");
      console.log("   This is unusual - every user should have a profile");
      return;
    }
    
    console.log("✅ Profile found");
    console.log("   Name:", profile.full_name || "Not set");
    console.log("   Role:", profile.role || "Not set");
    console.log("   Sales Initials:", profile.sales_initials || "Not set");
    
    // Check admin status
    console.log("\n--- Admin Status Check ---");
    const isAdminInDB = profile.role === 'admin';
    
    if (isAdminInDB) {
      console.log("✅ USER IS AN ADMIN IN DATABASE");
      console.log("   You should have access to admin features");
      
      // Check if we can access admin page
      console.log("\n--- Admin Page Access Check ---");
      try {
        // We can't actually navigate in this script, but we can check if the route exists
        console.log("✅ Admin route should be accessible at: /admin");
        console.log("   If you can't access it, try:");
        console.log("   1. Refreshing the page");
        console.log("   2. Clearing browser cache and cookies");
        console.log("   3. Logging out and logging back in");
      } catch (navError) {
        console.log("⚠️ Warning: Could not verify admin page access");
        console.log("   Error:", navError.message);
      }
    } else {
      console.log("❌ USER IS NOT AN ADMIN IN DATABASE");
      console.log("   Current role:", profile.role || "No role assigned");
      
      // Check for emergency admin access
      console.log("\n--- Emergency Admin Access Check ---");
      if (typeof window.grantEmergencyAdmin === 'function') {
        console.log("✅ Emergency admin function is available");
        console.log("   You can grant yourself admin access by running:");
        console.log("   await window.grantEmergencyAdmin()");
        console.log("   The page will automatically refresh after running this command");
      } else {
        console.log("❌ Emergency admin function is NOT available");
        console.log("   This indicates an issue with the UserContext implementation");
      }
    }
    
    // Check React context (if possible)
    console.log("\n--- React Context Check ---");
    try {
      // This is just for information - we can't directly access React context in console
      console.log("ℹ️ To check React context values:");
      console.log("   1. Open React DevTools (F12 → Components tab)");
      console.log("   2. Find the UserProvider component");
      console.log("   3. Check the context values in the props");
    } catch (reactError) {
      console.log("⚠️ Could not check React context");
    }
    
  } catch (error) {
    console.log("❌ ERROR: Unexpected error during diagnostic");
    console.log("   Error:", error.message);
    return;
  }
  
  // Summary and recommendations
  console.log("\n=== Diagnostic Summary ===");
  if (profile?.role === 'admin') {
    console.log("✅ Your account has admin privileges");
    console.log("💡 If you're still having access issues:");
    console.log("   1. Try refreshing the page (Ctrl+F5)");
    console.log("   2. Clear browser cache and cookies for this site");
    console.log("   3. Try accessing /admin directly");
    console.log("   4. Check browser console for any errors");
  } else {
    console.log("❌ Your account does not have admin privileges");
    console.log("💡 To gain admin access:");
    console.log("   1. Run: await window.grantEmergencyAdmin()");
    console.log("   2. Wait for the page to refresh");
    console.log("   3. Check if admin access works after refresh");
  }
  
  console.log("\n=== End Diagnostic ===");
}

// Run the diagnostic
runAdminDiagnostic().catch(error => {
  console.log("❌ ERROR: Failed to run diagnostic");
  console.log("   Error:", error.message);
});

// Additional helper functions
console.log("\n--- Helper Functions ---");
console.log("You can also run these individual functions:");

console.log("\n1. Check current admin status:");
console.log("   Run: window.checkAdminStatus()");
window.checkAdminStatus = async function() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.log("❌ Not logged in");
      return false;
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();
      
    const isAdmin = profile?.role === 'admin';
    console.log(isAdmin ? "✅ You are an admin" : "❌ You are not an admin");
    return isAdmin;
  } catch (error) {
    console.log("❌ Error checking admin status:", error.message);
    return false;
  }
};

console.log("\n2. Grant emergency admin access:");
console.log("   Run: await window.grantEmergencyAdmin()");
// This function is already globally available from UserContext

console.log("\n3. Refresh profile data:");
console.log("   Run: window.refreshProfile()");
// This function is also globally available from UserContext

console.log("\n=== Tool Ready ===");