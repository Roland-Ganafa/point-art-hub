// Fix Admin Access Script
// Run this in the browser console to diagnose and fix admin access issues

console.log("=== Fix Admin Access Script ===");

async function fixAdminAccess() {
  console.log("\n🔍 Diagnosing and fixing admin access...\n");
  
  // Check environment
  if (typeof window === 'undefined' || !window.location.hostname.includes('point')) {
    console.log("❌ ERROR: Not on Point Art Hub website");
    console.log("   This script must be run on the actual Point Art Hub website");
    return;
  }
  
  console.log("✅ Environment check passed");
  
  try {
    // Check if Supabase is available
    if (typeof supabase === 'undefined') {
      console.log("❌ ERROR: Supabase client not found");
      return;
    }
    
    // Get current session
    console.log("🔍 Getting current session...");
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
    
    // Get user profile
    console.log("\n🔍 Getting user profile...");
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
    
    // Check if user is already admin
    if (profile.role === 'admin') {
      console.log("\n🎉 USER IS ALREADY AN ADMIN!");
      console.log("   You should have access to admin features");
      
      // Try to refresh the profile to ensure the UI recognizes it
      console.log("\n🔄 Refreshing profile data...");
      try {
        // If there's a global refreshProfile function, use it
        if (typeof window.refreshProfile === 'function') {
          await window.refreshProfile();
          console.log("✅ Profile refreshed successfully");
        } else {
          console.log("⚠️ No refreshProfile function found, but this is OK");
        }
      } catch (refreshError) {
        console.log("⚠️ Warning: Could not refresh profile");
        console.log("   Error:", refreshError.message);
      }
      
      console.log("\n✅ Admin access should now work!");
      console.log("   Try navigating to: /admin");
      console.log("   If it still doesn't work, try refreshing the page (Ctrl+F5)");
      
      return true;
    }
    
    // User is not admin, try to grant admin access
    console.log("\n🔧 User is not an admin, attempting to grant admin access...");
    
    // Check if emergency admin function is available
    if (typeof window.grantEmergencyAdmin === 'function') {
      console.log("✅ Emergency admin function is available");
      console.log("   Granting admin access...");
      
      try {
        const result = await window.grantEmergencyAdmin();
        if (result) {
          console.log("🎉 Admin access granted successfully!");
          console.log("   The page should refresh automatically");
          console.log("   If it doesn't refresh in a few seconds, manually refresh the page (Ctrl+F5)");
          return true;
        } else {
          console.log("❌ Failed to grant admin access");
          console.log("   Check the browser console for more details");
          return false;
        }
      } catch (grantError) {
        console.log("❌ Error granting admin access");
        console.log("   Error:", grantError.message);
        return false;
      }
    } else {
      console.log("❌ Emergency admin function is NOT available");
      console.log("   This indicates an issue with the UserContext implementation");
      
      // Try direct database update as fallback
      console.log("\n🔧 Trying direct database update as fallback...");
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('user_id', session.user.id)
          .select()
          .single();
          
        if (error) {
          console.log("❌ Failed to update profile directly");
          console.log("   Error:", error.message);
          return false;
        }
        
        console.log("🎉 Profile updated directly!");
        console.log("   New role:", data.role);
        console.log("   Please refresh the page (Ctrl+F5) to see the changes");
        return true;
      } catch (updateError) {
        console.log("❌ Failed to update profile directly");
        console.log("   Error:", updateError.message);
        return false;
      }
    }
    
  } catch (error) {
    console.log("❌ ERROR: Unexpected error during admin access fix");
    console.log("   Error:", error.message);
    return false;
  }
}

// Run the fix function
fixAdminAccess().then(success => {
  if (success) {
    console.log("\n✅ Admin access fix completed successfully!");
  } else {
    console.log("\n❌ Admin access fix failed");
    console.log("   Please check the error messages above for more details");
  }
}).catch(error => {
  console.log("❌ ERROR: Failed to run admin access fix");
  console.log("   Error:", error.message);
});

console.log("\n=== Script Ready ===");
console.log("💡 If you're still having issues after running this script:");
console.log("   1. Try refreshing the page (Ctrl+F5)");
console.log("   2. Clear browser cache and cookies for this site");
console.log("   3. Log out and log back in");
console.log("   4. Try accessing /admin directly");