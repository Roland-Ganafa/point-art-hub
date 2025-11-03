// This script should be run in the browser console to check admin status
console.log("=== Admin Status Check ===");

// Check if we're on the Point Art Hub website
if (typeof window !== 'undefined' && window.location.hostname.includes('point')) {
  console.log("✅ On Point Art Hub website");
  
  // Check if Supabase client is available
  if (typeof supabase !== 'undefined') {
    console.log("✅ Supabase client found");
    
    // Try to access the user context
    try {
      // Check if we can access the global grantEmergencyAdmin function
      if (typeof window.grantEmergencyAdmin === 'function') {
        console.log("✅ grantEmergencyAdmin function is available globally");
      } else {
        console.log("⚠️ grantEmergencyAdmin function not available globally");
      }
      
      // Try to check profile directly from localStorage or session
      console.log("🔍 Checking profile data...");
      
      // This would normally be accessed through React context, 
      // but we can try to see what's in the DOM
      const adminElements = document.querySelectorAll('[href="/admin"], [data-testid="admin"]');
      if (adminElements.length > 0) {
        console.log("✅ Admin navigation elements found in DOM");
      } else {
        console.log("❌ No admin navigation elements found in DOM");
      }
      
      // Check for admin-specific elements
      const adminBadges = document.querySelectorAll('[class*="admin"], [class*="Admin"]');
      if (adminBadges.length > 0) {
        console.log("✅ Potential admin UI elements found");
      } else {
        console.log("❌ No obvious admin UI elements found");
      }
      
      console.log("\n📋 Manual Check Instructions:");
      console.log("1. Try navigating directly to: /admin");
      console.log("2. Check if you see an 'ADMIN' badge on your profile page");
      console.log("3. Try refreshing the page to ensure profile data is loaded");
      console.log("4. Check browser console for any errors");
      
    } catch (error) {
      console.log("❌ Error checking profile:", error.message);
    }
  } else {
    console.log("❌ Supabase client not found - are you on the Point Art Hub website?");
  }
} else {
  console.log("❌ Not on Point Art Hub website - run this script on the actual website");
}

console.log("=== End Check ===");