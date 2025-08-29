// Quick admin status diagnostic script
// Run this in browser console to check admin status

console.log("🔍 Admin Status Diagnostic");
console.log("========================");

// Check if we have access to React context
if (typeof window !== 'undefined') {
  // Try to access Supabase client
  if (window.supabase) {
    console.log("✅ Supabase client found");
    
    // Get current session
    window.supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("❌ Session error:", error);
        return;
      }
      
      if (!session) {
        console.log("❌ No active session - you are not logged in");
        return;
      }
      
      console.log("✅ Active session found");
      console.log("📧 Email:", session.user.email);
      console.log("🆔 User ID:", session.user.id);
      
      // Get user profile to check role
      window.supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
        .then(({ data: profile, error: profileError }) => {
          if (profileError) {
            console.error("❌ Profile error:", profileError);
            return;
          }
          
          if (!profile) {
            console.log("❌ No profile found");
            return;
          }
          
          console.log("👤 Profile found:");
          console.log("   Name:", profile.full_name);
          console.log("   Role:", profile.role);
          console.log("   Initials:", profile.sales_initials);
          console.log("   Created:", profile.created_at);
          
          if (profile.role === 'admin') {
            console.log("✅ YOU ARE AN ADMIN! Buttons should work.");
            console.log("🔍 If buttons aren't working, check:");
            console.log("   1. Page has been refreshed after role assignment");
            console.log("   2. UserContext is properly loaded");
            console.log("   3. Components are using useUser() hook correctly");
          } else {
            console.log("❌ YOU ARE NOT AN ADMIN");
            console.log("   Current role:", profile.role || "No role assigned");
            console.log("   To fix: Run the admin role fix script or contact an admin");
          }
        });
    });
  } else {
    console.log("❌ Supabase client not found - are you on the Point Art Hub website?");
  }
} else {
  console.log("❌ Window object not available");
}

// Also check if we can access React DevTools
setTimeout(() => {
  console.log("\n🔍 React Context Check:");
  console.log("If buttons aren't responding, try refreshing the page.");
  console.log("Admin role changes require a page refresh to take effect.");
}, 1000);