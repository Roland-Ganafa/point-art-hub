// This script should be run in the browser console to manually trigger admin access
console.log("=== Emergency Admin Access Trigger ===");

// Check if we're on the Point Art Hub website
if (typeof window !== 'undefined' && window.location.hostname.includes('point')) {
  console.log("✅ On Point Art Hub website");
  
  // Try to trigger emergency admin access
  try {
    // Check if the grantEmergencyAdmin function is available globally
    if (typeof window.grantEmergencyAdmin === 'function') {
      console.log("✅ Found grantEmergencyAdmin function, attempting to trigger...");
      
      // Call the function
      window.grantEmergencyAdmin().then(result => {
        console.log("✅ grantEmergencyAdmin executed, result:", result);
        if (result) {
          console.log("🎉 Admin access granted! The page should refresh automatically.");
          console.log("   If it doesn't refresh in a few seconds, manually refresh the page.");
        } else {
          console.log("❌ Failed to grant admin access. Check console for errors.");
        }
      }).catch(error => {
        console.log("❌ Error calling grantEmergencyAdmin:", error);
      });
    } else {
      console.log("❌ grantEmergencyAdmin function not found globally");
      console.log("   This might be because:");
      console.log("   1. You're already an admin");
      console.log("   2. The UserProvider hasn't loaded yet");
      console.log("   3. There's an issue with the UserContext implementation");
      
      // Try to check if we're already an admin by looking at the DOM
      const adminElements = document.querySelectorAll('[href="/admin"], .admin-badge, [class*="admin"]');
      if (adminElements.length > 0) {
        console.log("✅ Found potential admin elements in DOM - you might already be an admin");
        console.log("   Try navigating to /admin directly");
      } else {
        console.log("❌ No admin elements found in DOM");
      }
    }
  } catch (error) {
    console.log("❌ Error triggering admin access:", error.message);
  }
} else {
  console.log("❌ Not on Point Art Hub website - run this script on the actual website");
}

console.log("=== End Trigger ===");