import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import AdminProfilePage from './AdminProfile';

// Mock the Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      signOut: vi.fn(() => Promise.resolve({ error: null }))
    }
  }
}));

// Mock UserContext
vi.mock('@/contexts/UserContext', () => ({
  useUser: vi.fn(() => ({
    user: { id: 'test-user-id', email: 'admin@example.com' },
    profile: { 
      id: 'test-profile-id',
      user_id: 'test-user-id',
      full_name: 'Test Admin',
      role: 'admin',
      sales_initials: 'TA',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    },
    loading: false,
    isAdmin: true,
    refreshProfile: vi.fn()
  }))
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn()
  }))
}));

// Mock window.location.reload
const mockReload = vi.fn();
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true
});

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn())
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AdminProfilePage', () => {
  it('renders admin profile with user name in header', () => {
    render(<AdminProfilePage />, { wrapper: createWrapper() });
    // Look for the specific h1 element containing the user name
    const header = screen.getByRole('heading', { name: /Test Admin/i });
    expect(header).toBeInTheDocument();
  });

  it('shows admin badge', () => {
    render(<AdminProfilePage />, { wrapper: createWrapper() });
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('renders user management section', () => {
    render(<AdminProfilePage />, { wrapper: createWrapper() });
    expect(screen.getByText('User Management')).toBeInTheDocument();
  });

  it('renders system information section', () => {
    render(<AdminProfilePage />, { wrapper: createWrapper() });
    expect(screen.getByText('System Information')).toBeInTheDocument();
  });

  it('renders admin actions section', () => {
    render(<AdminProfilePage />, { wrapper: createWrapper() });
    expect(screen.getByText('Admin Actions')).toBeInTheDocument();
  });
});