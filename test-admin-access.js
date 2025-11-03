// Test Admin Access Script
// This script will help test if admin access is working correctly

console.log("=== Test Admin Access ===");

// Function to test admin access
async function testAdminAccess() {
  console.log("\n🔍 Testing Admin Access...\n");
  
  // Check if we're on the Point Art Hub website
  if (typeof window === 'undefined' || !window.location.hostname.includes('point')) {
    console.log("❌ Not on Point Art Hub website");
    return;
  }
  
  console.log("✅ On Point Art Hub website");
  
  // Check if user is logged in
  try {
    if (typeof supabase !== 'undefined') {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.log("❌ Error getting session:", error.message);
        return;
      }
      
      if (!session?.user) {
        console.log("❌ No user logged in");
        console.log("   Please log in first and then run this test again");
        return;
      }
      
      console.log("✅ User logged in:", session.user.email);
      
      // Check if user has admin role in database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
        
      if (profileError) {
        console.log("❌ Error getting profile:", profileError.message);
        return;
      }
      
      if (!profile) {
        console.log("❌ No profile found for user");
        return;
      }
      
      console.log("✅ Profile found with role:", profile.role);
      
      if (profile.role === 'admin') {
        console.log("🎉 USER HAS ADMIN ROLE IN DATABASE!");
        console.log("   Testing navigation to admin page...");
        
        // Try to navigate to admin page
        const currentPath = window.location.pathname;
        console.log("   Current path:", currentPath);
        
        if (currentPath === '/admin') {
          console.log("✅ Already on admin page!");
          console.log("   Admin access is working correctly");
        } else {
          console.log("   Attempting to navigate to /admin...");
          // Note: We can't actually navigate in this script, but we can show the user what to do
          console.log("   Please manually navigate to: /admin");
        }
      } else {
        console.log("⚠️ USER DOES NOT HAVE ADMIN ROLE");
        console.log("   Current role:", profile.role || "No role assigned");
        console.log("   You may need to use emergency admin access");
        
        // Check if emergency admin function is available
        if (typeof window.grantEmergencyAdmin === 'function') {
          console.log("✅ Emergency admin function is available");
          console.log("   You can run: await window.grantEmergencyAdmin()");
        } else {
          console.log("❌ Emergency admin function is NOT available");
        }
      }
    } else {
      console.log("❌ Supabase client not available");
    }
  } catch (error) {
    console.log("❌ Error during test:", error.message);
  }
  
  console.log("\n=== Test Complete ===");
}

// Run the test
testAdminAccess().catch(error => {
  console.log("❌ Error running test:", error.message);
});

// Instructions for manual testing
console.log("\n--- Manual Testing Instructions ---");
console.log("1. Open browser console (F12 or right-click → Inspect → Console)");
console.log("2. Run this script by copying and pasting it into the console");
console.log("3. Check the output for any issues");
console.log("4. If you see 'USER HAS ADMIN ROLE IN DATABASE' but can't access admin features:");
console.log("   a. Try refreshing the page");
console.log("   b. Try logging out and logging back in");
console.log("   c. Try navigating directly to /admin");
console.log("5. If you see 'USER DOES NOT HAVE ADMIN ROLE':");
console.log("   a. Run: await window.grantEmergencyAdmin()");
console.log("   b. Wait for the page to refresh");
console.log("   c. Check if admin access works after refresh");