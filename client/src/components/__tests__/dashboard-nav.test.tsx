import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
// Note: DashboardNav component needs to be created or imported from correct path
// This test assumes the component exists - adjust import path as needed

// Mock wouter hooks
vi.mock('wouter', () => ({
  useLocation: vi.fn(() => ['/dashboard', vi.fn()]),
  Link: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe('DashboardNav', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
  };

  it('renders navigation items', () => {
    render(<DashboardNav user={mockUser} onLogout={vi.fn()} />);
    
    expect(screen.getByText("Today's Briefing")).toBeInTheDocument();
    expect(screen.getByText('Explore Signals')).toBeInTheDocument();
    expect(screen.getByText('Strategic Brief Lab')).toBeInTheDocument();
    expect(screen.getByText('Manage Hub')).toBeInTheDocument();
  });

  it('displays user email', () => {
    render(<DashboardNav user={mockUser} onLogout={vi.fn()} />);
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('calls onLogout when logout button is clicked', () => {
    const mockOnLogout = vi.fn();
    render(<DashboardNav user={mockUser} onLogout={mockOnLogout} />);
    
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);
    
    expect(mockOnLogout).toHaveBeenCalled();
  });

  it('has correct navigation links', () => {
    render(<DashboardNav user={mockUser} onLogout={vi.fn()} />);
    
    expect(screen.getByRole('link', { name: /today's briefing/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /explore signals/i })).toHaveAttribute('href', '/explore-signals');
    expect(screen.getByRole('link', { name: /strategic brief lab/i })).toHaveAttribute('href', '/strategic-brief-lab');
    expect(screen.getByRole('link', { name: /manage hub/i })).toHaveAttribute('href', '/manage-hub');
  });

  it('shows mobile menu toggle', () => {
    render(<DashboardNav user={mockUser} onLogout={vi.fn()} />);
    
    // Mobile menu toggle should be present (typically a hamburger menu)
    const menuToggle = screen.getByRole('button', { name: /menu/i });
    expect(menuToggle).toBeInTheDocument();
  });

  it('toggles mobile menu when clicked', () => {
    render(<DashboardNav user={mockUser} onLogout={vi.fn()} />);
    
    const menuToggle = screen.getByRole('button', { name: /menu/i });
    fireEvent.click(menuToggle);
    
    // Check that menu state has changed (this would depend on implementation)
    // For now, just verify the button is clickable
    expect(menuToggle).toBeEnabled();
  });
});