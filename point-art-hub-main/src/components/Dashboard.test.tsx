import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from '@/components/Dashboard'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('Dashboard', () => {
  beforeEach(() => {
    // Reset any mocks if needed
  })

  it('renders dashboard title', () => {
    render(<Dashboard />, { wrapper: createWrapper() })
    expect(screen.getByText('Inventory Dashboard')).toBeInTheDocument()
  })

  it('renders all module tabs', () => {
    render(<Dashboard />, { wrapper: createWrapper() })
    
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Stationery')).toBeInTheDocument()
    expect(screen.getByText('Gift Store')).toBeInTheDocument()
    expect(screen.getByText('Embroidery')).toBeInTheDocument()
    expect(screen.getByText('Machines')).toBeInTheDocument()
    expect(screen.getByText('Art Services')).toBeInTheDocument()
  })

  it('renders quick stats section', () => {
    render(<Dashboard />, { wrapper: createWrapper() })
    
    expect(screen.getByText('Quick Stats')).toBeInTheDocument()
    expect(screen.getByText('Total Sales')).toBeInTheDocument()
    expect(screen.getByText('Total Profit')).toBeInTheDocument()
    expect(screen.getByText('Items Sold')).toBeInTheDocument()
    expect(screen.getByText('Services Done')).toBeInTheDocument()
  })

  it('renders export and add entry buttons', () => {
    render(<Dashboard />, { wrapper: createWrapper() })
    
    expect(screen.getByText('Export Report')).toBeInTheDocument()
    expect(screen.getByText('Add Entry')).toBeInTheDocument()
  })
})