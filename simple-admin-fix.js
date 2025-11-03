/**
 * Simple Admin Fix Script
 * 
 * This script provides simple commands to fix admin access issues
 * Run each command separately in the browser console
 */

// Command 1: Check your current admin status
window.checkMyAdminStatus = async function() {
  try {
    console.log("🔍 Checking your admin status...");
    
    // Get current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log("❌ Session error:", sessionError.message);
      return;
    }
    
    if (!sessionData?.session?.user) {
      console.log("❌ No active session found - please log in");
      return;
    }
    
    const user = sessionData.session.user;
    console.log("✅ Logged in as:", user.email);
    
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
      console.log("❌ No profile found");
      return;
    }
    
    console.log("👤 Profile details:");
    console.log("   Name:", profile.full_name);
    console.log("   Role:", profile.role);
    console.log("   User ID:", profile.user_id);
    
    if (profile.role === 'admin') {
      console.log("🎉 You HAVE admin role in database!");
    } else {
      console.log("❌ You do NOT have admin role");
      console.log("   Current role:", profile.role || "No role assigned");
    }
    
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
};

// Command 2: Force refresh your profile
window.refreshMyProfile = async function() {
  try {
    console.log("🔄 Refreshing your profile...");
    
    // Get current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log("❌ Session error:", sessionError.message);
      return;
    }
    
    if (!sessionData?.session?.user) {
      console.log("❌ No active session found - please log in");
      return;
    }
    
    const user = sessionData.session.user;
    
    // Update profile with current timestamp to trigger refresh
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (updateError) {
      console.log("❌ Profile refresh error:", updateError.message);
      return;
    }
    
    console.log("✅ Profile refreshed successfully");
    console.log("   Updated at:", updatedProfile.updated_at);
    
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
};

// Command 3: Grant emergency admin (if available)
window.tryEmergencyAdmin = async function() {
  if (typeof window.grantEmergencyAdmin === 'function') {
    console.log("🔧 Granting emergency admin access...");
    const result = await window.grantEmergencyAdmin();
    console.log("   Result:", result);
    if (result) {
      console.log("✅ Emergency admin granted!");
      console.log("🔄 Please refresh the page to see changes");
    } else {
      console.log("❌ Failed to grant emergency admin");
    }
  } else {
    console.log("❌ Emergency admin function not available");
    console.log("   This might be because you're already an admin or in production mode");
  }
};

console.log("✅ Admin fix commands loaded!");
console.log("");
console.log("Available commands:");
console.log("1. checkMyAdminStatus()  - Check your current admin status");
console.log("2. refreshMyProfile()    - Force refresh your profile");
console.log("3. tryEmergencyAdmin()   - Try emergency admin access");
console.log("");
console.log("To use, type the command name followed by parentheses, like:");
console.log("   checkMyAdminStatus()");