// Comprehensive Admin Debug Script
// Run this in the browser console on the Point Art Hub website

console.log("=== Comprehensive Admin Debug Script ===");

// Function to check admin status
async function checkAdminStatus() {
  console.log("\n🔍 Checking Admin Status...\n");
  
  // Check if we're on the Point Art Hub website
  if (typeof window === 'undefined' || !window.location.hostname.includes('point')) {
    console.log("❌ Not on Point Art Hub website");
    return;
  }
  
  console.log("✅ On Point Art Hub website");
  
  // Check for global functions
  console.log("\n--- Global Functions Check ---");
  if (typeof window.grantEmergencyAdmin === 'function') {
    console.log("✅ grantEmergencyAdmin function available");
  } else {
    console.log("❌ grantEmergencyAdmin function NOT available");
  }
  
  // Check for React components (if React DevTools is available)
  console.log("\n--- DOM Elements Check ---");
  const adminLinks = document.querySelectorAll('a[href="/admin"]');
  if (adminLinks.length > 0) {
    console.log(`✅ Found ${adminLinks.length} admin navigation link(s)`);
  } else {
    console.log("❌ No admin navigation links found");
  }
  
  const adminBadges = document.querySelectorAll('[class*="admin" i], [class*="Admin" i]');
  if (adminBadges.length > 0) {
    console.log(`✅ Found ${adminBadges.length} potential admin UI element(s)`);
  } else {
    console.log("❌ No obvious admin UI elements found");
  }
  
  // Try to access Supabase directly (if available)
  console.log("\n--- Direct Database Check ---");
  try {
    if (typeof supabase !== 'undefined') {
      console.log("✅ Supabase client available");
      
      // Try to get current user
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.log("❌ Error getting session:", sessionError.message);
      } else if (session?.user) {
        console.log("✅ User logged in:", session.user.email);
        
        // Try to get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
          
        if (profileError) {
          console.log("❌ Error getting profile:", profileError.message);
        } else if (profile) {
          console.log("✅ Profile found:");
          console.log("   Name:", profile.full_name);
          console.log("   Role:", profile.role);
          console.log("   User ID:", profile.user_id);
          
          if (profile.role === 'admin') {
            console.log("🎉 USER IS AN ADMIN IN DATABASE!");
            console.log("   You should have access to admin features.");
            console.log("   Try navigating to /admin directly.");
          } else {
            console.log("⚠️ USER IS NOT AN ADMIN IN DATABASE");
            console.log("   Current role:", profile.role || "No role assigned");
          }
        } else {
          console.log("❌ No profile found for user");
        }
      } else {
        console.log("❌ No user session found");
      }
    } else {
      console.log("❌ Supabase client not available");
    }
  } catch (error) {
    console.log("❌ Error during direct database check:", error.message);
  }
  
  // Instructions
  console.log("\n--- Troubleshooting Instructions ---");
  console.log("1. Try navigating directly to: /admin");
  console.log("2. If that doesn't work, try refreshing the page");
  console.log("3. Check browser console for any errors");
  console.log("4. If you're still having issues, try logging out and logging back in");
  console.log("5. Contact support if the problem persists");
  
  console.log("\n=== Debug Complete ===");
}

// Run the check
checkAdminStatus().catch(error => {
  console.log("❌ Error running debug script:", error.message);
});