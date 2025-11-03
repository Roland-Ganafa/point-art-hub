/**
 * Force Admin Recognition Script
 * 
 * This script helps force the frontend to recognize admin status
 * Run this in the browser console after logging in
 */

console.log("=== Force Admin Recognition Script ===");
console.log("This script will help the frontend recognize your admin status\n");

// Check if we're on the Point Art Hub website
if (!window.location.hostname.includes('point')) {
  console.log("❌ ERROR: Not on Point Art Hub website");
  console.log("   Please run this script on the actual Point Art Hub website");
  return;
}

// Check for required globals
if (!window.supabase) {
  console.log("❌ ERROR: Supabase client not found");
  return;
}

console.log("✅ Running on Point Art Hub website with Supabase client");

async function forceAdminRecognition() {
  try {
    console.log("🔍 Checking current session and profile...\n");
    
    // Get current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log("❌ Session error:", sessionError.message);
      return false;
    }
    
    if (!sessionData?.session?.user) {
      console.log("❌ No active session found");
      console.log("   Please log in and run this script again");
      return false;
    }
    
    const user = sessionData.session.user;
    console.log("✅ Session active for:", user.email);
    
    // Get user profile
    console.log("\n🔍 Checking profile...");
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (profileError) {
      console.log("❌ Profile error:", profileError.message);
      return false;
    }
    
    if (!profile) {
      console.log("❌ No profile found for user");
      return false;
    }
    
    console.log("✅ Profile found");
    console.log("   Name:", profile.full_name);
    console.log("   Role:", profile.role);
    
    // Check if already admin
    if (profile.role === 'admin') {
      console.log("\n🎉 Good news! Your profile already has admin role in database");
      
      // Try to force refresh the UserContext
      console.log("\n🔄 Attempting to force refresh UserContext...");
      
      // Method 1: Try to call the grantEmergencyAdmin function if available
      if (typeof window.grantEmergencyAdmin === 'function') {
        console.log("✅ Found grantEmergencyAdmin function, calling it...");
        const result = await window.grantEmergencyAdmin();
        console.log("   Result:", result);
      } else {
        console.log("❌ grantEmergencyAdmin function not found");
      }
      
      // Method 2: Try to refresh the profile directly
      console.log("\n🔄 Method 2: Attempting to refresh profile...");
      try {
        // Simulate profile refresh by updating with same data
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .select()
          .single();
        
        if (updateError) {
          console.log("⚠️ Profile refresh update error:", updateError.message);
        } else {
          console.log("✅ Profile refresh update successful");
        }
      } catch (updateError) {
        console.log("⚠️ Profile refresh error:", updateError.message);
      }
      
      console.log("\n✅ All checks completed!");
      console.log("\n📋 NEXT STEPS:");
      console.log("1. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)");
      console.log("2. If that doesn't work, try:");
      console.log("   - Clear browser cache and cookies");
      console.log("   - Log out and log back in");
      console.log("   - Try in an incognito/private browsing window");
      
      return true;
    } else {
      console.log("\n❌ Your profile does not have admin role");
      console.log("   Current role:", profile.role || "No role assigned");
      console.log("\n💡 To fix this, you need to:");
      console.log("   1. Contact a system administrator");
      console.log("   2. Or run an admin script to grant access");
      
      return false;
    }
    
  } catch (error) {
    console.log("❌ ERROR:", error.message);
    return false;
  }
}

// Instructions
console.log("To run this script:");
console.log("1. Make sure you're logged in to Point Art Hub");
console.log("2. Copy and paste the following line into the console:");
console.log("   forceAdminRecognition()");
console.log("");

// Export the function
window.forceAdminRecognition = forceAdminRecognition;

console.log("✅ Script loaded successfully!");
console.log("💡 Run forceAdminRecognition() to start the process");