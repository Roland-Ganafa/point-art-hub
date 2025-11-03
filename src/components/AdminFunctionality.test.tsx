import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { UserProvider, useUser } from '@/contexts/UserContext'
import Dashboard from '@/components/Dashboard'
import '@testing-library/jest-dom'

// Create mock functions for Supabase operations
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockOrder = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockSignOut = vi.fn()
const mockRefreshSession = vi.fn()

// Mock the Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete
  })),
  auth: {
    getSession: mockGetSession,
    onAuthStateChange: mockOnAuthStateChange,
    signOut: mockSignOut,
    refreshSession: mockRefreshSession
  }
}

// Mock the Supabase client module
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}))

// Mock toast
const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: mockToast
  }))
}))

// Mock window.location.reload
const mockReload = vi.fn()
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true
})

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0
      },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <UserProvider>
          {children}
        </UserProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// Test component to access user context
const TestComponent = () => {
  const { grantEmergencyAdmin, isAdmin, loading } = useUser()
  return (
    <div>
      <span data-testid="is-admin">{isAdmin ? 'true' : 'false'}</span>
      <span data-testid="loading">{loading ? 'true' : 'false'}</span>
      <button 
        data-testid="grant-admin-btn" 
        onClick={() => grantEmergencyAdmin()}
        disabled={loading}
      >
        Grant Admin
      </button>
    </div>
  )
}

// Helper function to setup default mocks
const setupDefaultMocks = () => {
  // Setup auth mock chain
  const mockUnsubscribe = vi.fn()
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: mockUnsubscribe } }
  })
  
  mockGetSession.mockResolvedValue({ 
    data: { session: null }, 
    error: null 
  })
  
  mockRefreshSession.mockResolvedValue({ 
    data: { session: null }, 
    error: null 
  })
  
  mockSignOut.mockResolvedValue({ error: null })
  
  // Setup query mock chain
  mockSelect.mockReturnValue({
    eq: mockEq,
    order: mockOrder
  })
  
  mockEq.mockReturnValue({
    single: mockSingle
  })
  
  mockSingle.mockResolvedValue({ 
    data: null, 
    error: null 
  })
  
  mockOrder.mockResolvedValue({ 
    data: [], 
    error: null 
  })
  
  // Setup insert mock
  mockInsert.mockResolvedValue({ 
    data: null, 
    error: null 
  })
  
  // Setup update mock chain
  mockUpdate.mockReturnValue({
    eq: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ 
          data: { role: 'admin' }, 
          error: null 
        }))
      }))
    }))
  })
  
  // Setup delete mock chain
  mockDelete.mockReturnValue({
    eq: vi.fn(() => Promise.resolve({ 
      data: null, 
      error: null 
    }))
  })
}

describe('Admin Functionality', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
    
    // Setup default mock implementations
    setupDefaultMocks()
  })
  
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should have grantEmergencyAdmin function available in UserContext', async () => {
    render(<TestComponent />, { wrapper: createWrapper() })
    
    await waitFor(() => {
      const grantAdminBtn = screen.getByTestId('grant-admin-btn')
      expect(grantAdminBtn).toBeInTheDocument()
      expect(grantAdminBtn).not.toBeDisabled()
    })
  })

  it('should show loading state initially', () => {
    render(<TestComponent />, { wrapper: createWrapper() })
    
    const loadingElement = screen.getByTestId('loading')
    expect(loadingElement).toHaveTextContent('true')
  })

  it('should render emergency admin button for non-admin users', async () => {
    // Mock a non-admin user session
    const mockSession = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }
    }
    
    const mockProfile = {
      user_id: 'test-user-id',
      full_name: 'Test User',
      role: 'user',
      created_at: new Date().toISOString()
    }
    
    mockGetSession.mockResolvedValue({ 
      data: { session: mockSession }, 
      error: null 
    })
    
    mockSingle.mockResolvedValue({ 
      data: mockProfile, 
      error: null 
    })
    
    render(<Dashboard />, { wrapper: createWrapper() })
    
    // Wait for loading to complete
    await waitFor(() => {
      // Look for emergency admin button (text might vary based on implementation)
      const emergencyButton = screen.queryByText(/emergency.*admin/i) || 
                             screen.queryByText(/grant.*admin/i)
      expect(emergencyButton).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should not render emergency admin button for admin users', async () => {
    // Mock an admin user session
    const mockSession = {
      user: {
        id: 'admin-user-id',
        email: 'admin@example.com',
        user_metadata: { full_name: 'Admin User' }
      }
    }
    
    const mockProfile = {
      user_id: 'admin-user-id',
      full_name: 'Admin User',
      role: 'admin',
      created_at: new Date().toISOString()
    }
    
    mockGetSession.mockResolvedValue({ 
      data: { session: mockSession }, 
      error: null 
    })
    
    mockSingle.mockResolvedValue({ 
      data: mockProfile, 
      error: null 
    })
    
    render(<Dashboard />, { wrapper: createWrapper() })
    
    // Wait for loading to complete
    await waitFor(() => {
      const isAdminElement = screen.queryByTestId('is-admin')
      if (isAdminElement) {
        expect(isAdminElement).toHaveTextContent('true')
      }
    })
    
    // Emergency button should not be present for admins
    const emergencyButton = screen.queryByText(/emergency.*admin/i)
    expect(emergencyButton).not.toBeInTheDocument()
  })

  it('should successfully grant emergency admin access', async () => {
    // Mock a non-admin session
    const mockSession = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }
    }
    
    mockGetSession.mockResolvedValue({ 
      data: { session: mockSession }, 
      error: null 
    })
    
    mockSingle.mockResolvedValue({ 
      data: {
        user_id: 'test-user-id',
        full_name: 'Test User',
        role: 'user'
      }, 
      error: null 
    })
    
    // Mock successful admin grant
    const mockUpdateEq = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({
          data: { role: 'admin', user_id: 'test-user-id' },
          error: null
        }))
      }))
    }))
    
    mockUpdate.mockReturnValue({
      eq: mockUpdateEq
    })
    
    render(<TestComponent />, { wrapper: createWrapper() })
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
    
    const grantAdminBtn = screen.getByTestId('grant-admin-btn')
    fireEvent.click(grantAdminBtn)
    
    // Wait for the update to be called
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockUpdate).toHaveBeenCalled()
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringMatching(/success/i)
        })
      )
    })
    
    // Should trigger page reload
    await waitFor(() => {
      expect(mockReload).toHaveBeenCalled()
    }, { timeout: 5000 })
  })

  it('should handle grantEmergencyAdmin errors gracefully', async () => {
    // Mock a session
    const mockSession = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com'
      }
    }
    
    mockGetSession.mockResolvedValue({ 
      data: { session: mockSession }, 
      error: null 
    })
    
    mockSingle.mockResolvedValue({ 
      data: {
        user_id: 'test-user-id',
        full_name: 'Test User',
        role: 'user'
      }, 
      error: null 
    })
    
    // Mock failed admin grant
    const mockUpdateEq = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({
          data: null,
          error: { message: 'Failed to update profile', code: '42501' }
        }))
      }))
    }))
    
    mockUpdate.mockReturnValue({
      eq: mockUpdateEq
    })
    
    render(<TestComponent />, { wrapper: createWrapper() })
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
    
    const grantAdminBtn = screen.getByTestId('grant-admin-btn')
    fireEvent.click(grantAdminBtn)
    
    // Wait for error handling
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: expect.stringMatching(/error|fail/i)
        })
      )
    })
    
    // Should NOT trigger page reload on error
    expect(mockReload).not.toHaveBeenCalled()
  })

  it('should handle no session gracefully', async () => {
    mockGetSession.mockResolvedValue({ 
      data: { session: null }, 
      error: null 
    })
    
    render(<TestComponent />, { wrapper: createWrapper() })
    
    await waitFor(() => {
      expect(screen.getByTestId('is-admin')).toHaveTextContent('false')
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
  })

  it('should handle profile not found', async () => {
    const mockSession = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com'
      }
    }
    
    mockGetSession.mockResolvedValue({ 
      data: { session: mockSession }, 
      error: null 
    })
    
    // Profile not found (PGRST116 is Supabase's "no rows" error)
    mockSingle.mockResolvedValue({ 
      data: null, 
      error: { code: 'PGRST116', message: 'No rows found' }
    })
    
    render(<TestComponent />, { wrapper: createWrapper() })
    
    await waitFor(() => {
      expect(screen.getByTestId('is-admin')).toHaveTextContent('false')
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
  })
})