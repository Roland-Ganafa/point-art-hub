// MockAuthService.ts
// This is a placeholder for the mock authentication service

export const mockAuthService = {
  // Mock session management
  getSession: async () => {
    return {
      data: {
        session: {
          user: {
            id: 'mock-user-id',
            email: 'mock@example.com',
            user_metadata: {
              full_name: 'Mock User'
            }
          }
        }
      },
      error: null
    };
  },

  // Mock profile management
  getProfile: async () => {
    return {
      data: {
        id: 'mock-profile-id',
        user_id: 'mock-user-id',
        full_name: 'Mock User',
        role: 'admin',
        sales_initials: 'MU',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      error: null
    };
  }
};