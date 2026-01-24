import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../store/AuthContext';
import * as api from '../../services/api';

// Mock the API module
vi.mock('../../services/api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    getProfile: vi.fn()
  }
}));

// Test component to access useAuth hook
const TestComponent = ({ onMount }) => {
  const auth = useAuth();
  if (onMount) {
    onMount(auth);
  }
  return (
    <div>
      <span data-testid="user">{auth.user ? auth.user.name : 'null'}</span>
      <span data-testid="loading">{auth.loading.toString()}</span>
      <button onClick={() => auth.login('test@test.com', '123456')}>Login</button>
      <button onClick={() => auth.register('test@test.com', '123456', 'Test')}>Register</button>
      <button onClick={auth.logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.getItem.mockReturnValue(null);
    localStorage.setItem.mockClear();
    localStorage.removeItem.mockClear();
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within AuthProvider');

      consoleError.mockRestore();
    });
  });

  describe('AuthProvider', () => {
    it('should provide initial state with no user and loading true', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('user').textContent).toBe('null');
    });

    it('should load user profile when token exists', async () => {
      const mockUser = { id: 1, name: 'Test User', email: 'test@test.com' };
      localStorage.getItem.mockReturnValue('valid-token');
      api.authApi.getProfile.mockResolvedValueOnce(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('user').textContent).toBe('Test User');
      expect(api.authApi.getProfile).toHaveBeenCalled();
    });

    it('should clear token when profile fetch fails', async () => {
      localStorage.getItem.mockReturnValue('invalid-token');
      api.authApi.getProfile.mockRejectedValueOnce(new Error('Unauthorized'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockUser = { id: 1, name: 'Test User', email: 'test@test.com' };
      const mockToken = 'new-token';
      api.authApi.login.mockResolvedValueOnce({ user: mockUser, token: mockToken });

      let authContext;
      render(
        <AuthProvider>
          <TestComponent onMount={(auth) => { authContext = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        await authContext.login('test@test.com', '123456');
      });

      expect(api.authApi.login).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: '123456'
      });
      expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
      expect(screen.getByTestId('user').textContent).toBe('Test User');
    });

    it('should throw error on login failure', async () => {
      api.authApi.login.mockRejectedValueOnce(new Error('Invalid credentials'));

      let authContext;
      render(
        <AuthProvider>
          <TestComponent onMount={(auth) => { authContext = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await expect(
        act(async () => {
          await authContext.login('test@test.com', 'wrong');
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const mockUser = { id: 1, name: 'New User', email: 'new@test.com' };
      const mockToken = 'new-token';
      api.authApi.register.mockResolvedValueOnce({ user: mockUser, token: mockToken });

      let authContext;
      render(
        <AuthProvider>
          <TestComponent onMount={(auth) => { authContext = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        await authContext.register('new@test.com', '123456', 'New User');
      });

      expect(api.authApi.register).toHaveBeenCalledWith({
        email: 'new@test.com',
        password: '123456',
        name: 'New User'
      });
      expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
      expect(screen.getByTestId('user').textContent).toBe('New User');
    });

    it('should throw error on registration failure', async () => {
      api.authApi.register.mockRejectedValueOnce(new Error('Email already exists'));

      let authContext;
      render(
        <AuthProvider>
          <TestComponent onMount={(auth) => { authContext = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await expect(
        act(async () => {
          await authContext.register('existing@test.com', '123456', 'User');
        })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const mockUser = { id: 1, name: 'Test User', email: 'test@test.com' };
      localStorage.getItem.mockReturnValue('valid-token');
      api.authApi.getProfile.mockResolvedValueOnce(mockUser);

      let authContext;
      render(
        <AuthProvider>
          <TestComponent onMount={(auth) => { authContext = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('Test User');
      });

      act(() => {
        authContext.logout();
      });

      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
  });
});
