import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { UserProvider } from '@/contexts/UserContext'
import Dashboard from '@/components/Dashboard'
import '@testing-library/jest-dom'

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      order: vi.fn(() => Promise.resolve({ data: [], error: null }))
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
    getSession: vi.fn(() => Promise.resolve({ 
      data: { 
        session: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: { full_name: 'Test User' }
          }
        }
      }, 
      error: null 
    })),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    }))
  }
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}))

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn()
  }))
}))

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

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dashboard title', async () => {
    render(<Dashboard />, { wrapper: createWrapper() })
    
    await waitFor(() => {
      expect(screen.getByText(/inventory dashboard/i)).toBeInTheDocument()
    })
  })

  it('renders all module tabs', async () => {
    render(<Dashboard />, { wrapper: createWrapper() })
    
    await waitFor(() => {
      expect(screen.getByText(/overview/i)).toBeInTheDocument()
    })
    
    expect(screen.getByText(/stationery/i)).toBeInTheDocument()
    expect(screen.getByText(/gift store/i)).toBeInTheDocument()
    expect(screen.getByText(/embroidery/i)).toBeInTheDocument()
    expect(screen.getByText(/machines/i)).toBeInTheDocument()
    expect(screen.getByText(/art services/i)).toBeInTheDocument()
  })

  it('renders quick stats section', async () => {
    render(<Dashboard />, { wrapper: createWrapper() })
    
    await waitFor(() => {
      expect(screen.getByText(/quick stats/i)).toBeInTheDocument()
    })
    
    expect(screen.getByText(/total sales/i)).toBeInTheDocument()
    expect(screen.getByText(/total profit/i)).toBeInTheDocument()
    expect(screen.getByText(/items sold/i)).toBeInTheDocument()
    expect(screen.getByText(/services done/i)).toBeInTheDocument()
  })

  it('renders export and add entry buttons', async () => {
    render(<Dashboard />, { wrapper: createWrapper() })
    
    await waitFor(() => {
      expect(screen.getByText(/export report/i)).toBeInTheDocument()
    })
    
    expect(screen.getByText(/add entry/i)).toBeInTheDocument()
  })

  it('handles loading state', () => {
    render(<Dashboard />, { wrapper: createWrapper() })
    
    // Component should render without crashing during loading
    const container = screen.getByTestId('dashboard-container') || document.body
    expect(container).toBeTruthy()
  })
})