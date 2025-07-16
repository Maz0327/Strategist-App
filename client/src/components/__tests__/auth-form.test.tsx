import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Note: AuthForm component needs to be created or imported from correct path
// This test assumes the component exists - adjust import path as needed

// Mock the API request
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
}));

describe('AuthForm', () => {
  let queryClient: QueryClient;
  const mockOnAuthSuccess = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderAuthForm = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthForm onAuthSuccess={mockOnAuthSuccess} />
      </QueryClientProvider>
    );
  };

  it('renders login form by default', () => {
    renderAuthForm();
    
    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('switches to register form when clicking register link', async () => {
    renderAuthForm();
    
    fireEvent.click(screen.getByText(/create account/i));
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    renderAuthForm();
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/email or username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('validates password length in register mode', async () => {
    renderAuthForm();
    
    // Switch to register
    fireEvent.click(screen.getByText(/create account/i));
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });
    
    // Fill in short password
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('validates email format in register mode', async () => {
    renderAuthForm();
    
    // Switch to register
    fireEvent.click(screen.getByText(/create account/i));
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });
    
    // Fill in invalid email
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid-email' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });
});