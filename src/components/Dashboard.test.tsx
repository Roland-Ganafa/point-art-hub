import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
<<<<<<< HEAD
import { BrowserRouter } from 'react-router-dom'
import { UserProvider } from '@/contexts/UserContext'
=======
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
>>>>>>> a7aef898cee93f9dc81e7f965f46f94ee1d1d6af
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

<<<<<<< HEAD
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <UserProvider>
          {children}
        </UserProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
=======
  return ({ children }: { children: React.ReactNode }) => {
    const router = createMemoryRouter([
      { path: '/', element: children as any },
    ], {
      initialEntries: ['/'],
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      },
    })

    return (
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    )
  }
>>>>>>> a7aef898cee93f9dc81e7f965f46f94ee1d1d6af
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dashboard title', async () => {
<<<<<<< HEAD
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
=======
    render(<Dashboard />, { wrapper: createWrapper() })
    expect(await screen.findByText('Inventory Dashboard')).toBeInTheDocument()
  })

  it('renders all module tabs', async () => {
    render(<Dashboard />, { wrapper: createWrapper() })
    
    expect(await screen.findByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Stationery')).toBeInTheDocument()
    expect(screen.getByText('Gift Store')).toBeInTheDocument()
    expect(screen.getByText('Embroidery')).toBeInTheDocument()
    expect(screen.getByText('Machines')).toBeInTheDocument()
    expect(screen.getByText('Art Services')).toBeInTheDocument()
  })

  it('renders quick stats section', async () => {
    render(<Dashboard />, { wrapper: createWrapper() })
    
    expect(await screen.findByText('Quick Stats')).toBeInTheDocument()
    expect(screen.getByText('Total Sales')).toBeInTheDocument()
    expect(screen.getByText('Total Profit')).toBeInTheDocument()
    expect(screen.getByText('Items Sold')).toBeInTheDocument()
    expect(screen.getByText('Services Done')).toBeInTheDocument()
  })

  it('renders export and add entry buttons', async () => {
    render(<Dashboard />, { wrapper: createWrapper() })
    
    expect(await screen.findByText('Export Report')).toBeInTheDocument()
    expect(screen.getByText('Add Entry')).toBeInTheDocument()
>>>>>>> a7aef898cee93f9dc81e7f965f46f94ee1d1d6af
  })
})
