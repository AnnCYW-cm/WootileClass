import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import * as AuthContext from '../../store/AuthContext';

// Mock useAuth hook
vi.mock('../../store/AuthContext', () => ({
  useAuth: vi.fn()
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner when loading is true', () => {
    AuthContext.useAuth.mockReturnValue({
      user: null,
      loading: true
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', () => {
    AuthContext.useAuth.mockReturnValue({
      user: null,
      loading: false
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should render children when user is authenticated', () => {
    AuthContext.useAuth.mockReturnValue({
      user: { id: 1, name: 'Test User', email: 'test@test.com' },
      loading: false
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should render nested routes when user is authenticated', () => {
    AuthContext.useAuth.mockReturnValue({
      user: { id: 1, name: 'Test User' },
      loading: false
    });

    render(
      <MemoryRouter initialEntries={['/dashboard/classes']}>
        <Routes>
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Routes>
                  <Route path="classes" element={<div>Classes Page</div>} />
                </Routes>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Classes Page')).toBeInTheDocument();
  });
});
