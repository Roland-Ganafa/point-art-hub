/**
 * Browser Admin Diagnostics Script
 * 
 * Run this script in the browser console to diagnose admin access issues
 * Open console with F12 and paste this entire script
 */

console.log("=== Point Art Hub Admin Diagnostics ===");
console.log("Running diagnostics for admin access...\n");

// Check if we're on the right website
if (!window.location.hostname.includes('point')) {
  console.log("❌ ERROR: Not on Point Art Hub website");
  console.log("   Please run this script on the actual Point Art Hub website");
  return;
}

console.log("✅ Running on Point Art Hub website");

// Check for required globals
const requiredGlobals = ['supabase'];
const missingGlobals = requiredGlobals.filter(global => !window[global]);

if (missingGlobals.length > 0) {
  console.log("❌ ERROR: Missing required globals:", missingGlobals);
  return;
}

console.log("✅ All required globals found");

// Main diagnostic function
async function runDiagnostics() {
  try {
    console.log("\n--- Session Check ---");
    
    // Get current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log("❌ Session error:", sessionError.message);
      return;
    }
    
    if (!sessionData?.session?.user) {
      console.log("❌ No active session found");
      console.log("   Please log in and run this script again");
      return;
    }
    
    const user = sessionData.session.user;
    console.log("✅ Session active");
    console.log("   User ID:", user.id);
    console.log("   Email:", user.email);
    
    console.log("\n--- Profile Check ---");
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (profileError) {
      console.log("❌ Profile error:", profileError.message);
      return;
    }
    
    if (!profile) {
      console.log("❌ No profile found for user");
      return;
    }
    
    console.log("✅ Profile found");
    console.log("   Profile ID:", profile.id);
    console.log("   Full Name:", profile.full_name);
    console.log("   Role:", profile.role);
    console.log("   Sales Initials:", profile.sales_initials);
    
    console.log("\n--- Admin Status Check ---");
    
    // Check admin status
    const isAdmin = profile.role === 'admin';
    console.log("   Is Admin:", isAdmin);
    
    if (isAdmin) {
      console.log("🎉 USER HAS ADMIN ROLE IN DATABASE!");
      console.log("   You should have access to admin features");
    } else {
      console.log("❌ USER DOES NOT HAVE ADMIN ROLE");
      console.log("   Current role:", profile.role || "No role assigned");
    }
    
    console.log("\n--- React Context Check ---");
    
    // Try to access React context if available
    try {
      // This is just for information - we can't directly access React context from console
      console.log("   React context check: Limited (can't directly access from console)");
    } catch (e) {
      console.log("   React context check: Not available");
    }
    
    console.log("\n--- DOM Elements Check ---");
    
    // Check for admin elements in DOM
    const adminLinks = document.querySelectorAll('a[href="/admin"]');
    const adminBadges = document.querySelectorAll('[class*="admin" i], [class*="Admin" i]');
    
    console.log("   Admin links found:", adminLinks.length);
    console.log("   Admin badges/classes found:", adminBadges.length);
    
    if (adminLinks.length > 0 || adminBadges.length > 0) {
      console.log("✅ Found potential admin UI elements");
    } else {
      console.log("⚠️ No obvious admin UI elements found");
    }
    
    console.log("\n--- Emergency Functions Check ---");
    
    // Check for emergency admin functions
    const emergencyFunctions = ['grantEmergencyAdmin', 'makeCurrentUserAdmin', 'checkAdminStatus'];
    const availableFunctions = emergencyFunctions.filter(func => typeof window[func] === 'function');
    
    console.log("   Available emergency functions:", availableFunctions);
    
    if (availableFunctions.length > 0) {
      console.log("✅ Emergency functions available");
    } else {
      console.log("❌ No emergency functions found");
    }
    
    console.log("\n=== Diagnostics Complete ===");
    
    if (isAdmin) {
      console.log("\n🎉 SUMMARY: Your profile has admin role!");
      console.log("   If admin features aren't visible, try:");
      console.log("   1. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)");
      console.log("   2. Clear browser cache and cookies");
      console.log("   3. Log out and log back in");
      console.log("   4. Run: window.grantEmergencyAdmin() in console");
    } else {
      console.log("\n❌ SUMMARY: Your profile does not have admin role");
      console.log("   To fix this, you need to:");
      console.log("   1. Contact a system administrator");
      console.log("   2. Or run an admin script to grant access");
    }
    
  } catch (error) {
    console.log("❌ ERROR during diagnostics:", error.message);
  }
}

// Run the diagnostics
runDiagnostics().catch(error => {
  console.log("❌ Fatal error:", error.message);
});

console.log("\n💡 TIP: If you see 'USER HAS ADMIN ROLE IN DATABASE' but");
console.log("   still don't see admin features, try refreshing the page!");