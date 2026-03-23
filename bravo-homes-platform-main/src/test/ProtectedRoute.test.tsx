import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { supabase } from '../lib/supabase';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });

    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['admin']}>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('redirects to / when no user is logged in', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });

    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['admin']}>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    await vi.waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('renders children when user has correct role', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: 'user-1', email: 'admin@test.com', user_metadata: {} } },
    });
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
        }),
      }),
    });

    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['admin']}>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    await vi.waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('redirects parceiro to /partner when accessing admin route', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: 'user-2', email: 'partner@test.com', user_metadata: {} } },
    });
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { role: 'parceiro' } }),
        }),
      }),
    });

    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['admin']}>
          <div>Admin Only</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    await vi.waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/partner', { replace: true });
    });
  });
});
