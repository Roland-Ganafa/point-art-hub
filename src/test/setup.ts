import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock environment variables for testing only - these are not real credentials
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_SUPABASE_URL: 'https://test-project.supabase.co', // Test URL - not a real project
    VITE_SUPABASE_ANON_KEY: 'test-anon-key-for-unit-testing-purposes-only', // Test key - not a real key
    VITE_APP_ENV: 'test',
  },
  writable: true,
})

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => {
  const result = { data: [], error: null };

  const makeChain = () => {
    const chain: any = {
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(result),
      maybeSingle: vi.fn().mockResolvedValue(result),
      then: (resolve: any) => resolve(result),
    };
    return chain;
  };

  const from = vi.fn(() => ({
    select: vi.fn(() => makeChain()),
    insert: vi.fn(async () => result),
    update: vi.fn(() => ({ eq: vi.fn(async () => result) })),
    delete: vi.fn(() => ({ eq: vi.fn(async () => result) })),
  }));

  return {
    supabase: {
      from,
      auth: {
        getSession: vi.fn(async () => ({ data: { session: { user: { id: 'test-user-id' } } }, error: null })),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        signOut: vi.fn(async () => ({ error: null })),
        refreshSession: vi.fn(async () => ({})),
      },
    },
  };
})

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn()
  }))
}))

// Mock UserContext to avoid needing real providers in unit tests
vi.mock('@/contexts/UserContext', () => {
  const mockUseUser = () => ({
    user: { id: 'test-user-id', email: 'test@example.com' } as any,
    profile: { id: 'test-profile-id', user_id: 'test-user-id', full_name: 'Test User', role: 'admin', sales_initials: 'TU', created_at: null, updated_at: null } as any,
    session: null,
    loading: false,
    isAdmin: true,
    signOut: vi.fn(async () => {}),
    refreshProfile: vi.fn(async () => {}),
    grantEmergencyAdmin: vi.fn(async () => true),
    authError: null,
  });

  const UserProvider = ({ children }: { children: any }) => children;

  return {
    useUser: mockUseUser,
    UserProvider,
  };
});
