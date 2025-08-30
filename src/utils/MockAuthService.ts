/**
 * MockAuthService.ts
 * 
 * This service provides mock authentication functionality for development purposes
 * when the Supabase connection is having issues. It simulates authentication
 * without actually connecting to Supabase.
 */

// Mock user data
const MOCK_USER = {
  id: 'mock-user-id-12345',
  email: 'admin@pointartsolutions.store',
  user_metadata: {
    full_name: 'Admin User',
  },
  app_metadata: {
    role: 'admin'
  },
  created_at: new Date().toISOString(),
};

// Mock profile data
const MOCK_PROFILE = {
  id: 'mock-profile-id-12345',
  user_id: 'mock-user-id-12345',
  full_name: 'Admin User',
  role: 'admin',
  sales_initials: 'ADMIN',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock session data
const MOCK_SESSION = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  user: MOCK_USER,
};

/**
 * Class that simulates Supabase Auth functionality
 */
class MockAuthService {
  private isAuthenticated = false;
  
  /**
   * Simulates signing in with email/password
   */
  async signInWithPassword({ email, password }: { email: string, password: string }) {
    // For simplicity, accept any email/password combination
    this.isAuthenticated = true;
    
    // Store in localStorage to persist the mock session
    if (typeof window !== 'undefined') {
      localStorage.setItem('mock_auth_active', 'true');
    }
    
    return {
      data: { 
        session: MOCK_SESSION,
        user: MOCK_USER
      },
      error: null
    };
  }
  
  /**
   * Simulates getting the current session
   */
  async getSession() {
    // Check if we have a stored mock auth state
    const mockAuthActive = typeof window !== 'undefined' ? 
      localStorage.getItem('mock_auth_active') : null;
      
    if (mockAuthActive === 'true' || this.isAuthenticated) {
      return {
        data: { session: MOCK_SESSION },
        error: null
      };
    }
    
    // No session
    return {
      data: { session: null },
      error: null
    };
  }
  
  /**
   * Simulates signing out
   */
  async signOut() {
    this.isAuthenticated = false;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mock_auth_active');
    }
    
    return {
      error: null
    };
  }
  
  /**
   * Get the current user profile
   */
  async getProfile() {
    if (this.isAuthenticated || localStorage.getItem('mock_auth_active') === 'true') {
      // Check if there's a custom mock user set in localStorage
      const customMockUser = localStorage.getItem('mock_user');
      if (customMockUser) {
        try {
          const userData = JSON.parse(customMockUser);
          return {
            data: {
              id: userData.id || MOCK_PROFILE.id,
              user_id: userData.id || MOCK_PROFILE.user_id,
              full_name: userData.name || MOCK_PROFILE.full_name,
              role: userData.role || MOCK_PROFILE.role,
              sales_initials: userData.initials || MOCK_PROFILE.sales_initials,
              created_at: MOCK_PROFILE.created_at,
              updated_at: new Date().toISOString(),
            },
            error: null
          };
        } catch (e) {
          console.error('Error parsing custom mock user:', e);
        }
      }
      
      // Fall back to the default mock profile
      return {
        data: MOCK_PROFILE,
        error: null
      };
    }
    
    return {
      data: null,
      error: { message: 'Not authenticated' }
    };
  }
  
  /**
   * Attaches event handlers for auth state changes
   */
  onAuthStateChange(callback: Function) {
    // In a real implementation, we'd set up event listeners here
    return {
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    };
  }
  
  /**
   * Refreshes the session
   */
  refreshSession() {
    return {
      data: { session: MOCK_SESSION },
      error: null
    };
  }
}

// Export a singleton instance
export const mockAuthService = new MockAuthService();