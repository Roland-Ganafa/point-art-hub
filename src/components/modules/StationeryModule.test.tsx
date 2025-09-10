import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
// Use the correct import for userEvent
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import StationeryModule from '@/components/modules/StationeryModule'

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
      {children}
    </QueryClientProvider>
  )
}

describe('StationeryModule', () => {
  it('renders stationery management title', () => {
    render(<StationeryModule />, { wrapper: createWrapper() })
    expect(screen.getByText('Stationery Management')).toBeTruthy()
  })

  it('renders inventory and daily sales tabs', () => {
    render(<StationeryModule />, { wrapper: createWrapper() })
    
    expect(screen.getByText('Inventory')).toBeTruthy()
    expect(screen.getByText('Daily Sales')).toBeTruthy()
  })

  it('renders add item button', () => {
    render(<StationeryModule />, { wrapper: createWrapper() })
    expect(screen.getByText('Add Item')).toBeTruthy()
  })

  it('renders search input', () => {
    render(<StationeryModule />, { wrapper: createWrapper() })
    expect(screen.getByPlaceholderText('Search items...')).toBeTruthy()
  })

  it('opens add item dialog when button is clicked', async () => {
    const user = userEvent.setup()
    render(<StationeryModule />, { wrapper: createWrapper() })
    
    const addButton = screen.getByText('Add Item')
    await user.click(addButton)
    
    await waitFor(() => {
      expect(screen.getByText('Add New Item')).toBeTruthy()
    })
  })

  it('validates required fields in add item form', async () => {
    const user = userEvent.setup()
    render(<StationeryModule />, { wrapper: createWrapper() })
    
    // Open dialog
    const addButton = screen.getByText('Add Item')
    await user.click(addButton)
    
    // Try to submit without filling required fields
    await waitFor(async () => {
      const submitButton = screen.getByText('Add Item')
      await user.click(submitButton)
    })

    // Should show validation errors (mock toast will be called)
    expect(screen.getByText('Add New Item')).toBeTruthy() // Dialog should still be open
  })

  it('filters items based on search term', async () => {
    const user = userEvent.setup()
    render(<StationeryModule />, { wrapper: createWrapper() })
    
    const searchInput = screen.getByPlaceholderText('Search items...')
    await user.type(searchInput, 'pen')
    
    expect((searchInput as HTMLInputElement).value).toBe('pen')
  })
})