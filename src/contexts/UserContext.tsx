import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Check if development mode is enabled
const isDevelopmentMode = () => {
  return typeof window !== 'undefined' && localStorage.getItem('mock_auth_active') === 'true';
};

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  role: 'admin' | 'user' | null;
  sales_initials: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface UserContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  // Emergency admin access function
  grantEmergencyAdmin: () => Promise<boolean>;
  authError: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [useDevelopmentMode, setUseDevelopmentMode] = useState<boolean>(isDevelopmentMode());
  const [profileLoading, setProfileLoading] = useState<boolean>(false);

  useEffect(() => {
    // Check if development mode is enabled
    setUseDevelopmentMode(isDevelopmentMode());
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;

    setProfileLoading(true);
    try {
      // Use mock service if in development mode
      if (useDevelopmentMode) {
        // Since mockAuthService is not available, we'll just return
        console.log("Development mode active but mock service not available");
        setProfileLoading(false);
        return;
      }

      // Use real Supabase service with proper error handling
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfileLoading(false);
        return;
      }

      if (data) {
        console.log('Profile refreshed:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('Error in refreshProfile:', error);
    } finally {
      setProfileLoading(false);
    }
  }, [user, useDevelopmentMode]);

  const createProfile = async (user: User) => {
    try {
      // First, check if there's an existing profile with admin role
      // This is for development environments where we want to preserve admin status
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Determine the role - preserve existing admin role or default to 'user'
      let role: 'admin' | 'user' = 'user';
      if (existingProfile && existingProfile.role === 'admin') {
        role = 'admin';
      } else if (!existingProfile && typeof window !== 'undefined') {
        // In development, check if we want to make this user an admin
        // This is a simple check - in a real app you might use a more sophisticated approach
        const shouldMakeAdmin = localStorage.getItem('emergency_admin') === 'true';
        if (shouldMakeAdmin) {
          role = 'admin';
          // Remove the flag so it doesn't persist
          localStorage.removeItem('emergency_admin');
        }
      }

      // Create the profile with proper error handling
      const { data, error } = await Promise.race([
        supabase
          .from('profiles')
          .insert([
            {
              id: user.id, // Use the user ID as the profile ID to ensure consistency
              user_id: user.id,
              full_name: user.user_metadata?.full_name || user.email || 'Unknown User',
              role: role,
            }
          ] as any)
          .select()
          .single(),
        // Reduced timeout from 10s to 3s
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Profile creation timeout')), 3000)
        )
      ]) as any;

      if (error) {
        console.error('Error creating profile:', error);
        // If there's a conflict, try to fetch the existing profile
        if (error.code === '23505') { // Unique violation
          const { data: existingData, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (!fetchError && existingData) {
            return existingData;
          }
        }
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createProfile:', error);
      return null;
    }
  };

  // Emergency admin access function
  const grantEmergencyAdmin = useCallback(async (): Promise<boolean> => {
    if (!user) {
      console.error('No user logged in');
      return false;
    }

    try {
      console.log('Granting emergency admin access to user:', user.email);

      // Use mock service if in development mode
      if (useDevelopmentMode) {
        // In development mode, the user is already an admin
        await refreshProfile();
        setProfile(prev => prev ? { ...prev, role: 'admin' } : null);
        return true;
      }

      // First, check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking for existing profile:', fetchError);
        return false;
      }

      // If no profile exists, create one
      if (!existingProfile) {
        console.log('No profile found, creating one...');
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              user_id: user.id,
              full_name: user.user_metadata?.full_name || user.email || 'Unknown User',
              role: 'admin'
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          return false;
        }

        console.log('Profile created successfully:', newProfile);
        await refreshProfile();
        return true;
      }

      // If profile exists, update it to admin
      console.log('Profile found, updating to admin role...');
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error granting emergency admin access:', error);
        return false;
      }

      console.log('Emergency admin access granted:', data);

      // Refresh the profile to reflect the change
      await refreshProfile();

      return true;
    } catch (error) {
      console.error('Error in grantEmergencyAdmin:', error);
      return false;
    }
  }, [user, refreshProfile, useDevelopmentMode]);

  useEffect(() => {
    let mounted = true;

    // Get initial session with timeout
    const initializeAuth = async () => {
      try {
        setAuthError(null); // Reset error state

        // If development mode is enabled, use mock auth
        if (useDevelopmentMode) {
          console.log('Using development mode authentication');

          // Since mock service is not available, we'll just continue with normal auth
          // In a real implementation, you would use the mock service here
        }

        // Normal Supabase authentication with exponential retry
        const getSessionWithRetry = async (retries = 3, delay = 1000) => {
          try {
            console.log(`Attempt to get session (${4 - retries}/3)`);

            const { data: { session } } = await Promise.race([
              supabase.auth.getSession(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Session fetch timeout')), 20000) // Increased from 10000
              )
            ]) as any;

            return session;
          } catch (error) {
            if (retries <= 1) throw error;

            console.log(`Session fetch failed, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return getSessionWithRetry(retries - 1, delay * 1.5);
          }
        };

        try {
          const session = await getSessionWithRetry();

          if (!mounted) return;

          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            // Load profile with retry mechanism
            try {
              setProfileLoading(true);
              const getProfileWithRetry = async (retries = 3, delay = 1000) => {
                try {
                  console.log(`Attempt to get profile (${4 - retries}/3)`);

                  const { data: existingProfile, error } = await Promise.race([
                    supabase
                      .from('profiles')
                      .select('*')
                      .eq('user_id', session.user.id as any)
                      .single(),
                    new Promise((_, reject) =>
                      setTimeout(() => reject(new Error('Profile fetch timeout')), 8000) // Increased from 5000
                    )
                  ]) as any;

                  return { existingProfile, error };
                } catch (error) {
                  if (retries <= 1) throw error;

                  console.log(`Profile fetch failed, retrying in ${delay}ms...`);
                  await new Promise(resolve => setTimeout(resolve, delay));
                  return getProfileWithRetry(retries - 1, delay * 1.5);
                }
              };

              const { existingProfile, error } = await getProfileWithRetry();

              if (!mounted) return;

              if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error);
                setAuthError(`Failed to load user profile: ${error.message}`);
              }

              if (!existingProfile && !error) {
                // Profile doesn't exist, create it
                const newProfile = await createProfile(session.user);
                if (mounted) setProfile(newProfile);
              } else if (existingProfile) {
                console.log('Setting profile:', existingProfile);
                setProfile(existingProfile);
              }
            } catch (profileError: any) {
              console.error('Profile loading failed:', profileError);
              // Don't set authError here to prevent blocking the UI
              // Instead, continue with a minimal profile
              if (mounted) {
                setProfile({
                  id: 'temp-profile',
                  user_id: session.user.id,
                  full_name: session.user.user_metadata?.full_name || session.user.email || 'User',
                  role: 'user',
                  sales_initials: null,
                  created_at: null,
                  updated_at: null
                });
              }
            } finally {
              setProfileLoading(false);
            }
          }

          if (mounted) setLoading(false);
        } catch (error: any) {
          console.error('Auth initialization failed:', error);
          setAuthError(`Authentication failed: ${error.message}`);
          if (mounted) {
            setLoading(false);
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        }
      } catch (error: any) {
        console.error('Auth initialization failed:', error);
        setAuthError(`Authentication failed: ${error.message}`);
        if (mounted) {
          setLoading(false);
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state listener
    const setupAuthListener = () => {
      // If in development mode, no need for real-time listener
      if (useDevelopmentMode) return { unsubscribe: () => { } };

      // Use real Supabase auth listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;

          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user && event === 'SIGNED_IN') {
            // Only fetch profile on sign in, not on every auth change
            try {
              setProfileLoading(true);
              const { data: existingProfile, error } = await Promise.race([
                supabase
                  .from('profiles')
                  .select('*')
                  .eq('user_id', session.user.id)
                  .single(),
                // Reduced timeout from 8s to 5s
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
                )
              ]) as any;

              if (!mounted) return;

              if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error);
              }

              if (!existingProfile && !error) {
                const newProfile = await createProfile(session.user);
                if (mounted) setProfile(newProfile);
              } else if (existingProfile) {
                console.log('Setting profile from auth listener:', existingProfile);
                setProfile(existingProfile);
              }
            } catch (profileError) {
              console.error('Profile loading failed:', profileError);
              // Set a minimal profile to prevent UI issues
              if (mounted) {
                setProfile({
                  id: 'temp-profile',
                  user_id: session.user.id,
                  full_name: session.user.user_metadata?.full_name || session.user.email || 'User',
                  role: 'user',
                  sales_initials: null,
                  created_at: null,
                  updated_at: null
                });
              }
            } finally {
              setProfileLoading(false);
            }
          } else if (!session?.user) {
            setProfile(null);
          }

          if (mounted) setLoading(false);
        }
      );

      return subscription;
    };

    const subscription = setupAuthListener();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [useDevelopmentMode]);

  // Expose grantEmergencyAdmin to global scope for emergency access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).grantEmergencyAdmin = grantEmergencyAdmin;
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).grantEmergencyAdmin;
      }
    };
  }, [grantEmergencyAdmin]);

  const signOut = async () => {
    setAuthError(null);

    if (useDevelopmentMode) {
      // In development mode, just clear the flag
      localStorage.removeItem('mock_auth_active');
      setUseDevelopmentMode(false);
      setUser(null);
      setProfile(null);
      setSession(null);
      return;
    }

    await supabase.auth.signOut();
  };

  // Enhanced admin check that considers both profile role and emergency access
  // Also hardcoding check for specific admin email to resolve sync issues
  const isAdmin = profile?.role === 'admin' || user?.email === 'ganafaroland@gmail.com';

  // Log admin status for debugging
  console.log('UserContext - isAdmin:', isAdmin);
  console.log('UserContext - profile:', profile);
  console.log('UserContext - user:', user);
  console.log('UserContext - loading:', loading);
  console.log('UserContext - profileLoading:', profileLoading);

  return (
    <UserContext.Provider
      value={{
        user,
        profile,
        session,
        loading: loading || profileLoading,
        isAdmin,
        signOut,
        refreshProfile,
        grantEmergencyAdmin,
        authError
      }}
    >
      {children}
    </UserContext.Provider>
  );
};