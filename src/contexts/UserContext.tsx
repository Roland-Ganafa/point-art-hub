import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const SESSION_WARNING_MS = 28 * 60 * 1000; // warn at 28 minutes (2 min before timeout)

// Known admin emails — guaranteed admin access even if profile fetch fails
const KNOWN_ADMIN_EMAILS = ['ganafaroland@gmail.com', 'denisntambi.dn@gmail.com'];

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!user) return;

    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile');
        setProfileLoading(false);
        return;
      }

      if (data) {
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error('Error in refreshProfile');
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  const createProfile = async (user: User) => {
    try {
      // First, check if there's an existing profile with admin role
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Determine the role - preserve existing admin role or default to 'user'
      let role: 'admin' | 'user' = 'user';
      if (existingProfile && existingProfile.role === 'admin') {
        role = 'admin';
      }

      // Create the profile with proper error handling
      const { data, error } = await Promise.race([
        supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              user_id: user.id,
              full_name: user.user_metadata?.full_name || user.email || 'Unknown User',
              role: role,
            }
          ] as any)
          .select()
          .single(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Profile creation timeout')), 3000)
        )
      ]) as any;

      if (error) {
        console.error('Error creating profile:', error);
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

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setAuthError(null);

        const getSessionWithRetry = async (retries = 3, delay = 1000) => {
          try {
            const { data: { session } } = await Promise.race([
              supabase.auth.getSession(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Session fetch timeout')), 45000)
              )
            ]) as any;

            return session;
          } catch (error) {
            if (retries <= 1) throw error;

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
            try {
              setProfileLoading(true);
              const getProfileWithRetry = async (retries = 3, delay = 1000) => {
                try {
                  const { data: existingProfile, error } = await Promise.race([
                    supabase
                      .from('profiles')
                      .select('*')
                      .eq('user_id', session.user.id as any)
                      .single(),
                    new Promise((_, reject) =>
                      setTimeout(() => reject(new Error('Profile fetch timeout')), 20000)
                    )
                  ]) as any;

                  return { existingProfile, error };
                } catch (error) {
                  if (retries <= 1) throw error;

                  await new Promise(resolve => setTimeout(resolve, delay));
                  return getProfileWithRetry(retries - 1, delay * 1.5);
                }
              };

              const { existingProfile, error } = await getProfileWithRetry();

              if (!mounted) return;

              if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error);
                // Don't block the UI — fall through and create a temp profile
              }

              if (!existingProfile && !error) {
                const newProfile = await createProfile(session.user);
                if (mounted) setProfile(newProfile);
              } else if (existingProfile) {
                setProfile(existingProfile);
              } else if (error && error.code !== 'PGRST116') {
                // Profile fetch failed — give a temp profile so the user can still access the app
                if (mounted) {
                  const isKnownAdmin = KNOWN_ADMIN_EMAILS.includes(session.user.email ?? '');
                  setProfile({
                    id: 'temp-profile',
                    user_id: session.user.id,
                    full_name: session.user.user_metadata?.full_name || session.user.email || 'User',
                    role: isKnownAdmin ? 'admin' : 'user',
                    sales_initials: null,
                    created_at: null,
                    updated_at: null
                  });
                }
              }
            } catch (profileError: any) {
              console.error('Profile loading failed:', profileError);
              if (mounted) {
                const isKnownAdmin = KNOWN_ADMIN_EMAILS.includes(session.user.email ?? '');
                setProfile({
                  id: 'temp-profile',
                  user_id: session.user.id,
                  full_name: session.user.user_metadata?.full_name || session.user.email || 'User',
                  role: isKnownAdmin ? 'admin' : 'user',
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
          console.error('Auth initialization failed');
          setAuthError('Authentication failed. Please reload the page.');
          if (mounted) {
            setLoading(false);
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        }
      } catch (error: any) {
        console.error('Auth initialization failed');
        setAuthError('Authentication failed. Please reload the page.');
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user && event === 'SIGNED_IN') {
          try {
            setProfileLoading(true);
            const { data: existingProfile, error } = await Promise.race([
              supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single(),
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
              setProfile(existingProfile);
            } else if (error && error.code !== 'PGRST116') {
              // Profile fetch failed (e.g. RLS) — give a temp profile so the user can access the app
              if (mounted) {
                const isKnownAdmin = KNOWN_ADMIN_EMAILS.includes(session.user.email ?? '');
                setProfile({
                  id: 'temp-profile',
                  user_id: session.user.id,
                  full_name: session.user.user_metadata?.full_name || session.user.email || 'User',
                  role: isKnownAdmin ? 'admin' : 'user',
                  sales_initials: null,
                  created_at: null,
                  updated_at: null
                });
              }
            }
          } catch (profileError) {
            console.error('Profile loading failed:', profileError);
            if (mounted) {
              const isKnownAdmin = KNOWN_ADMIN_EMAILS.includes(session.user.email ?? '');
              setProfile({
                id: 'temp-profile',
                user_id: session.user.id,
                full_name: session.user.user_metadata?.full_name || session.user.email || 'User',
                role: isKnownAdmin ? 'admin' : 'user',
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

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setAuthError(null);
    await supabase.auth.signOut();
  };

  // Admin status: DB role OR known hardcoded admin email (fallback when profile fetch fails)
  const isAdmin = profile?.role === 'admin' || KNOWN_ADMIN_EMAILS.includes(user?.email ?? '');

  // Session inactivity timeout (30 minutes)
  useEffect(() => {
    if (!user) return;

    const resetTimers = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

      warningTimerRef.current = setTimeout(() => {
        toast({
          title: 'Session expiring soon',
          description: 'You will be signed out in 2 minutes due to inactivity.',
          variant: 'destructive',
        });
      }, SESSION_WARNING_MS);

      inactivityTimerRef.current = setTimeout(async () => {
        await supabase.auth.signOut();
      }, SESSION_TIMEOUT_MS);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetTimers, { passive: true }));
    resetTimers();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimers));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [user, toast]);

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
        authError
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
