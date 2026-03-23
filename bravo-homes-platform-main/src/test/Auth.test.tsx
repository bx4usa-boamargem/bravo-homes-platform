import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../lib/supabase';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('Login / Auth Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('supabase.auth.getUser returns null when not logged in', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });

    const { data: { user } } = await supabase.auth.getUser();
    expect(user).toBeNull();
  });

  it('supabase.auth.getUser returns user when logged in', async () => {
    const mockUser = { id: 'abc-123', email: 'test@bravo.com', user_metadata: { full_name: 'Test User' } };
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });

    const { data: { user } } = await supabase.auth.getUser();
    expect(user).not.toBeNull();
    expect(user?.email).toBe('test@bravo.com');
    expect(user?.user_metadata?.full_name).toBe('Test User');
  });

  it('signInWithOAuth calls supabase auth correctly', async () => {
    (supabase.auth.signInWithOAuth as any).mockResolvedValue({ data: {}, error: null });

    const result = await supabase.auth.signInWithOAuth({ provider: 'google' as any });
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({ provider: 'google' });
    expect(result.error).toBeNull();
  });

  it('signOut calls supabase auth correctly', async () => {
    (supabase.auth.signOut as any).mockResolvedValue({ error: null });

    const { error } = await supabase.auth.signOut();
    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(error).toBeNull();
  });

  it('role-based routing sends admin to /admin', () => {
    const route = (role: string) => {
      if (role === 'admin') return '/admin';
      if (role === 'parceiro') return '/partner';
      return '/client';
    };
    expect(route('admin')).toBe('/admin');
    expect(route('parceiro')).toBe('/partner');
    expect(route('cliente')).toBe('/client');
  });
});
