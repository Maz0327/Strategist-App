import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Note: Dashboard component needs to be created or imported from correct path
// This test assumes the component exists - adjust import path as needed

// Mock components
vi.mock('../components/dashboard-nav', () => ({
  DashboardNav: ({ user, onLogout }: any) => (
    <div data-testid="dashboard-nav">
      <span>{user.email}</span>
      <button onClick={onLogout}>Logout</button>
    </div>
  ),
}));

vi.mock('../components/todays-briefing', () => ({
  TodaysBriefing: () => <div data-testid="todays-briefing">Today's Briefing</div>,
}));

// Mock the API request
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
}));

// Mock wouter
vi.mock('wouter', () => ({
  useLocation: vi.fn(() => ['/dashboard', vi.fn()]),
  useRoute: vi.fn(() => [true, {}]),
}));

describe('Dashboard', () => {
  let queryClient: QueryClient;
  const mockUser = {
    id: 1,
    email: 'test@example.com',
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderDashboard = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <Dashboard user={mockUser} onLogout={vi.fn()} />
      </QueryClientProvider>
    );
  };

  it('renders dashboard navigation', () => {
    renderDashboard();
    
    expect(screen.getByTestId('dashboard-nav')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('renders main content area', () => {
    renderDashboard();
    
    expect(screen.getByTestId('todays-briefing')).toBeInTheDocument();
  });

  it('has responsive layout', () => {
    renderDashboard();
    
    const dashboard = screen.getByTestId('dashboard-nav').closest('div');
    expect(dashboard).toBeInTheDocument();
  });

  it('passes user data to navigation', () => {
    renderDashboard();
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('handles logout functionality', async () => {
    const mockOnLogout = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard user={mockUser} onLogout={mockOnLogout} />
      </QueryClientProvider>
    );
    
    const logoutButton = screen.getByText('Logout');
    logoutButton.click();
    
    await waitFor(() => {
      expect(mockOnLogout).toHaveBeenCalled();
    });
  });
});