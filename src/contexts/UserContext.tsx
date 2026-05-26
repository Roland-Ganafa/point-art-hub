import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { asAppError } from '@/utils/errorUtils';

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

// Known admin emails — guaranteed admin access even if profile fetch fails.
//
// SECURITY NOTE: this allowlist grants admin via UI computation (see
// `isAdmin` below). It is safe as long as:
//   1. Both Supabase auth accounts for these emails remain active (Supabase
//      prevents two accounts sharing the same email, so an attacker cannot
//      register them while they exist).
//   2. Server-side RLS policies are the ultimate gate for privileged
//      operations — the UI flag is for affordances only.
// If either admin account is ever deleted, REMOVE the entry from this list
// before the email is freed for re-registration.
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
  // Bug fix #12: dedupe concurrent createProfile() calls. initializeAuth()
  // and onAuthStateChange('SIGNED_IN') both fire on first login, racing
  // to insert the same profile row. Keep one in-flight Promise per user.id.
  const createProfileInFlightRef = useRef<Map<string, Promise<Profile | null>>>(new Map());

  const refreshProfile = useCallback(async () => {
    if (!user) return;

    setProfileLoading(true);
    try {
      // Bug fix #12: use maybeSingle() so "no profile row yet" returns
      // data=null without throwing PGRST116. Zero-row is expected on first
      // login before createProfile runs.
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfileLoading(false);
        return;
      }

      if (data) {
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error('Error in refreshProfile:', error);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  const createProfile = async (user: User): Promise<Profile | null> => {
    // Bug fix #12: dedupe — if another caller is already creating this
    // user's profile, await their Promise instead of issuing a parallel
    // insert that would race and (best case) hit a unique-violation.
    const inFlight = createProfileInFlightRef.current.get(user.id);
    if (inFlight) return inFlight;

    const promise = (async (): Promise<Profile | null> => {
    try {
      // First, check if there's an existing profile with admin role.
      // Bug fix #12: maybeSingle() returns data=null on zero rows instead
      // of throwing — expected when this user has no profile yet.
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

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
              // Bug fix #4: do NOT force id = user.id. profiles.id is a
              // separate PK with a DB default; forcing it collides with
              // existing rows and breaks profiles!sold_by(...) joins for
              // new users whose generated id differs.
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
          // Bug fix #12: maybeSingle() — row should exist now, but tolerate
          // transient zero-row reads (e.g. read-replica lag).
          const { data: existingData, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!fetchError && existingData) {
            return existingData as Profile;
          }
        }
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error('Error in createProfile:', error);
      return null;
    }
    })();

    createProfileInFlightRef.current.set(user.id, promise);
    try {
      return await promise;
    } finally {
      createProfileInFlightRef.current.delete(user.id);
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
                  // Bug fix #12: maybeSingle() so zero-row returns null
                  // without a PGRST116 error.
                  const { data: existingProfile, error } = await Promise.race([
                    supabase
                      .from('profiles')
                      .select('*')
                      .eq('user_id', session.user.id as any)
                      .maybeSingle(),
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

              // Bug fix #17: same simplification as the SIGNED_IN handler —
              // maybeSingle() means error indicates a real failure.
              if (existingProfile) {
                setProfile(existingProfile);
              } else if (!error) {
                const newProfile = await createProfile(session.user);
                if (mounted) setProfile(newProfile);
              } else {
                console.error('Error fetching profile:', error);
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
              const e = asAppError(profileError);
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
        } catch (error) {
          const e = asAppError(error);
          console.error('Auth initialization failed');
          setAuthError('Authentication failed. Please reload the page.');
          if (mounted) {
            setLoading(false);
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        }
      } catch (error) {
        const e = asAppError(error);
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
            // Bug fix #12: maybeSingle() — zero-row should not raise.
            const { data: existingProfile, error } = await Promise.race([
              supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
              )
            ]) as any;

            if (!mounted) return;

            // Bug fix #17: with maybeSingle() (bug #12), PGRST116 no longer
            // surfaces — `error` now means a real failure (RLS, network).
            // Simplify the three branches: have profile / no row / real error.
            if (existingProfile) {
              setProfile(existingProfile);
            } else if (!error) {
              // No row yet — create one
              const newProfile = await createProfile(session.user);
              if (mounted) setProfile(newProfile);
            } else {
              // Real error — fall back to a temp profile so the user can use the app
              console.error('Error fetching profile:', error);
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
