import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Login } from '../../pages/Login';
import * as AuthContext from '../../store/AuthContext';

// Mock useAuth hook
const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../store/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const renderLogin = () => {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
};

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AuthContext.useAuth.mockReturnValue({
      login: mockLogin
    });
  });

  it('should render login form', () => {
    renderLogin();

    expect(screen.getByRole('heading', { name: '登录账户' })).toBeInTheDocument();
    expect(screen.getByLabelText('邮箱')).toBeInTheDocument();
    expect(screen.getByLabelText('密码')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();
    expect(screen.getByText('立即注册')).toBeInTheDocument();
  });

  it('should update input values on change', async () => {
    const user = userEvent.setup();
    renderLogin();

    const emailInput = screen.getByLabelText('邮箱');
    const passwordInput = screen.getByLabelText('密码');

    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, '123456');

    expect(emailInput).toHaveValue('test@test.com');
    expect(passwordInput).toHaveValue('123456');
  });

  it('should call login and navigate on successful submit', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({ id: 1, name: 'Test User' });
    renderLogin();

    const emailInput = screen.getByLabelText('邮箱');
    const passwordInput = screen.getByLabelText('密码');
    const submitButton = screen.getByRole('button', { name: '登录' });

    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, '123456');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', '123456');
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should show loading state during login', async () => {
    const user = userEvent.setup();
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    renderLogin();

    const emailInput = screen.getByLabelText('邮箱');
    const passwordInput = screen.getByLabelText('密码');

    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, '123456');

    const submitButton = screen.getByRole('button', { name: '登录' });
    await user.click(submitButton);

    expect(screen.getByRole('button', { name: '登录中...' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登录中...' })).toBeDisabled();
  });

  it('should show error message on login failure', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce(new Error('邮箱或密码错误'));
    renderLogin();

    const emailInput = screen.getByLabelText('邮箱');
    const passwordInput = screen.getByLabelText('密码');

    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, 'wrongpassword');

    const submitButton = screen.getByRole('button', { name: '登录' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('邮箱或密码错误')).toBeInTheDocument();
    });
  });

  it('should clear error message on new submit attempt', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce(new Error('邮箱或密码错误'));
    mockLogin.mockResolvedValueOnce({ id: 1 });
    renderLogin();

    const emailInput = screen.getByLabelText('邮箱');
    const passwordInput = screen.getByLabelText('密码');
    const submitButton = screen.getByRole('button', { name: '登录' });

    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, 'wrong');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('邮箱或密码错误')).toBeInTheDocument();
    });

    await user.clear(passwordInput);
    await user.type(passwordInput, 'correct');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText('邮箱或密码错误')).not.toBeInTheDocument();
    });
  });

  it('should have link to register page', () => {
    renderLogin();

    const registerLink = screen.getByRole('link', { name: '立即注册' });
    expect(registerLink).toHaveAttribute('href', '/register');
  });
});
