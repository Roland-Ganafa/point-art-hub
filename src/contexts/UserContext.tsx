import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await Promise.race([
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
        )
      ]) as any;
      
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Error in refreshProfile:', error);
    }
  }, [user]);

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

      const { data, error } = await Promise.race([
        supabase
          .from('profiles')
          .insert([
            {
              user_id: user.id,
              full_name: user.user_metadata?.full_name || user.email || 'Unknown User',
              role: role,
            }
          ])
          .select()
          .single(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile creation timeout')), 10000)
        )
      ]) as any;

      if (error) {
        console.error('Error creating profile:', error);
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
      
      // Trigger a re-render by updating state
      setProfile(prev => prev ? { ...prev, role: 'admin' } : null);
      
      return true;
    } catch (error) {
      console.error('Error in grantEmergencyAdmin:', error);
      return false;
    }
  }, [user, refreshProfile]);

  useEffect(() => {
    let mounted = true;

    // Get initial session with timeout
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Session fetch timeout')), 8000)
          )
        ]) as any;

        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Load profile with timeout
          try {
            const { data: existingProfile, error } = await Promise.race([
              supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Profile fetch timeout')), 8000)
              )
            ]) as any;
            
            if (!mounted) return;
            
            if (error && error.code !== 'PGRST116') {
              console.error('Error fetching profile:', error);
            }
            
            if (!existingProfile && !error) {
              // Profile doesn't exist, create it
              const newProfile = await createProfile(session.user);
              if (mounted) setProfile(newProfile);
            } else if (existingProfile) {
              setProfile(existingProfile);
            }
          } catch (profileError) {
            console.error('Profile loading failed:', profileError);
            // Continue without profile for now
          }
        }
        
        if (mounted) setLoading(false);
      } catch (error) {
        console.error('Auth initialization failed:', error);
        if (mounted) {
          setLoading(false);
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      }
    };

    initializeAuth();

    // Set up auth state listener with optimized profile loading
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && event === 'SIGNED_IN') {
          // Only fetch profile on sign in, not on every auth change
          try {
            const { data: existingProfile, error } = await Promise.race([
              supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Profile fetch timeout')), 8000)
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
            }
          } catch (profileError) {
            console.error('Profile loading failed:', profileError);
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

  // Remove redundant useEffect - profile loading is now handled in auth state change

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Enhanced admin check that considers both profile role and emergency access
  const isAdmin = profile?.role === 'admin';

  return (
    <UserContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isAdmin,
        signOut,
        refreshProfile,
        grantEmergencyAdmin
      }}
    >
      {children}
    </UserContext.Provider>
  );
};