// Emergency Admin Access - USE WITH CAUTION
// WARNING: This is a development/debugging tool only
// Never use in production without proper server-side validation

async function robustEmergencyAdminAccess() {
  console.log('🚨 Robust Emergency Admin Access Initiated');
  console.log('⚠️  WARNING: This should only be used in development!');
  console.log('=========================================');
  
  if (typeof window.supabase === 'undefined') {
    console.error('❌ Supabase client not available');
    console.log('\n💡 Recommended: Use SQL Editor in Supabase Dashboard');
    showManualInstructions();
    return false;
  }
  
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.error('❌ No active session');
      return false;
    }
    
    console.log('✅ User:', session.user.email);
    console.log('🆔 User ID:', session.user.id);
    
    // Attempt profile upsert (handles both insert and update)
    console.log('\n🔧 Attempting profile upsert...');
    const { data, error } = await window.supabase
      .from('profiles')
      .upsert(
        {
          user_id: session.user.id,
          full_name: session.user.user_metadata?.full_name || session.user.email || 'Admin User',
          role: 'admin',
          updated_at: new Date().toISOString()
        },
        { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        }
      )
      .select()
      .single();
    
    if (error) {
      console.error('❌ Database error:', error.message);
      console.error('   Code:', error.code);
      console.error('   Details:', error.details);
      
      // Check for common RLS issues
      if (error.code === '42501' || error.message.includes('permission denied')) {
        console.error('\n🔒 RLS Policy Issue Detected!');
        console.error('   Your Row Level Security policies prevent this operation.');
        console.error('   You must grant admin access via SQL Editor instead.');
      }
      
      showManualInstructions(session.user.email, session.user.id);
      return false;
    }
    
    // Verify the change
    console.log('\n✅ Profile updated:', data);
    console.log('🔍 Verifying change...');
    
    const { data: verification, error: verifyError } = await window.supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();
    
    if (verifyError || verification?.role !== 'admin') {
      console.error('❌ Verification failed - role may not have persisted');
      console.error('   This often indicates an RLS policy issue');
      showManualInstructions(session.user.email, session.user.id);
      return false;
    }
    
    console.log('✅ Verification successful! Role is now:', verification.role);
    console.log('🔄 Refreshing page in 3 seconds...');
    setTimeout(() => window.location.reload(), 3000);
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    showManualInstructions();
    return false;
  }
}

function showManualInstructions(email = 'YOUR_EMAIL', userId = 'YOUR_USER_ID') {
  console.log('\n📝 RECOMMENDED: Manual SQL Approach');
  console.log('=====================================');
  console.log('1. Open Supabase Dashboard → SQL Editor');
  console.log('2. Run this query:\n');
  console.log(`-- Grant admin access to ${email}`);
  console.log(`INSERT INTO profiles (user_id, full_name, role)`);
  console.log(`VALUES ('${userId}', 'Admin User', 'admin')`);
  console.log(`ON CONFLICT (user_id)`);
  console.log(`DO UPDATE SET role = 'admin', updated_at = NOW();`);
  console.log('\n3. Refresh your application');
  console.log('\n⚠️  Note: If RLS is enabled, you may need to temporarily disable it or');
  console.log('   create a policy that allows this operation.');
}

window.robustEmergencyAdminAccess = robustEmergencyAdminAccess;
console.log('🚀 Emergency Admin Access Function Loaded');
console.log('⚠️  Use: await robustEmergencyAdminAccess()');