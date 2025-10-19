import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import Dashboard from '@/components/Dashboard'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

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
}

describe('Dashboard', () => {
  beforeEach(() => {
    // Reset any mocks if needed
  })

  it('renders dashboard title', async () => {
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
  })
})
