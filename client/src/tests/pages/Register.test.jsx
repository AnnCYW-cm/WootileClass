import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Register } from '../../pages/Register';
import * as AuthContext from '../../store/AuthContext';

// Mock useAuth hook
const mockRegister = vi.fn();
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

const renderRegister = () => {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );
};

describe('Register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AuthContext.useAuth.mockReturnValue({
      register: mockRegister
    });
  });

  it('should render registration form', () => {
    renderRegister();

    expect(screen.getByRole('heading', { name: '注册新账户' })).toBeInTheDocument();
    expect(screen.getByLabelText('姓名')).toBeInTheDocument();
    expect(screen.getByLabelText('邮箱')).toBeInTheDocument();
    expect(screen.getByLabelText('密码')).toBeInTheDocument();
    expect(screen.getByLabelText('确认密码')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '注册' })).toBeInTheDocument();
    expect(screen.getByText('立即登录')).toBeInTheDocument();
  });

  it('should update input values on change', async () => {
    const user = userEvent.setup();
    renderRegister();

    const nameInput = screen.getByLabelText('姓名');
    const emailInput = screen.getByLabelText('邮箱');
    const passwordInput = screen.getByLabelText('密码');
    const confirmPasswordInput = screen.getByLabelText('确认密码');

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, '123456');
    await user.type(confirmPasswordInput, '123456');

    expect(nameInput).toHaveValue('Test User');
    expect(emailInput).toHaveValue('test@test.com');
    expect(passwordInput).toHaveValue('123456');
    expect(confirmPasswordInput).toHaveValue('123456');
  });

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderRegister();

    const emailInput = screen.getByLabelText('邮箱');
    const passwordInput = screen.getByLabelText('密码');
    const confirmPasswordInput = screen.getByLabelText('确认密码');
    const submitButton = screen.getByRole('button', { name: '注册' });

    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, '123456');
    await user.type(confirmPasswordInput, '654321');
    await user.click(submitButton);

    expect(screen.getByText('两次输入的密码不一致')).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should show error when password is too short', async () => {
    const user = userEvent.setup();
    renderRegister();

    const emailInput = screen.getByLabelText('邮箱');
    const passwordInput = screen.getByLabelText('密码');
    const confirmPasswordInput = screen.getByLabelText('确认密码');
    const submitButton = screen.getByRole('button', { name: '注册' });

    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, '12345');
    await user.type(confirmPasswordInput, '12345');
    await user.click(submitButton);

    expect(screen.getByText('密码至少需要6个字符')).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should call register and navigate on successful submit', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce({ id: 1, name: 'Test User' });
    renderRegister();

    const nameInput = screen.getByLabelText('姓名');
    const emailInput = screen.getByLabelText('邮箱');
    const passwordInput = screen.getByLabelText('密码');
    const confirmPasswordInput = screen.getByLabelText('确认密码');
    const submitButton = screen.getByRole('button', { name: '注册' });

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, '123456');
    await user.type(confirmPasswordInput, '123456');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('test@test.com', '123456', 'Test User');
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should show loading state during registration', async () => {
    const user = userEvent.setup();
    mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    renderRegister();

    const emailInput = screen.getByLabelText('邮箱');
    const passwordInput = screen.getByLabelText('密码');
    const confirmPasswordInput = screen.getByLabelText('确认密码');

    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, '123456');
    await user.type(confirmPasswordInput, '123456');

    const submitButton = screen.getByRole('button', { name: '注册' });
    await user.click(submitButton);

    expect(screen.getByRole('button', { name: '注册中...' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '注册中...' })).toBeDisabled();
  });

  it('should show error message on registration failure', async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValueOnce(new Error('邮箱已被注册'));
    renderRegister();

    const emailInput = screen.getByLabelText('邮箱');
    const passwordInput = screen.getByLabelText('密码');
    const confirmPasswordInput = screen.getByLabelText('确认密码');
    const submitButton = screen.getByRole('button', { name: '注册' });

    await user.type(emailInput, 'existing@test.com');
    await user.type(passwordInput, '123456');
    await user.type(confirmPasswordInput, '123456');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('邮箱已被注册')).toBeInTheDocument();
    });
  });

  it('should have link to login page', () => {
    renderRegister();

    const loginLink = screen.getByRole('link', { name: '立即登录' });
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('should register without name (optional field)', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce({ id: 1 });
    renderRegister();

    const emailInput = screen.getByLabelText('邮箱');
    const passwordInput = screen.getByLabelText('密码');
    const confirmPasswordInput = screen.getByLabelText('确认密码');
    const submitButton = screen.getByRole('button', { name: '注册' });

    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, '123456');
    await user.type(confirmPasswordInput, '123456');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('test@test.com', '123456', '');
    });
  });
});
