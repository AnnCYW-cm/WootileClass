import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import bcrypt from 'bcryptjs';

// Mock the database module
const mockQuery = jest.fn();
jest.unstable_mockModule('../../db/index.js', () => ({
  query: mockQuery,
  default: { query: mockQuery }
}));

// Mock the auth middleware
const mockGenerateToken = jest.fn().mockReturnValue('test-token-123');
jest.unstable_mockModule('../../middleware/auth.js', () => ({
  generateToken: mockGenerateToken
}));

// Import after mocking
const { register, login, getProfile } = await import('../../controllers/authController.js');

describe('AuthController', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
      userId: 1
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockQuery.mockReset();
    mockGenerateToken.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      // Mock: no existing user
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // Mock: insert user
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          created_at: new Date()
        }]
      });

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User'
        },
        token: 'test-token-123'
      });
    });

    it('should return 400 if email is missing', async () => {
      mockReq.body = { password: 'password123' };

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '邮箱和密码不能为空' });
    });

    it('should return 400 if password is missing', async () => {
      mockReq.body = { email: 'test@example.com' };

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '邮箱和密码不能为空' });
    });

    it('should return 400 if email already exists', async () => {
      mockReq.body = {
        email: 'existing@example.com',
        password: 'password123'
      };

      // Mock: existing user found
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '该邮箱已被注册' });
    });

    it('should return 500 on database error', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '注册失败，请稍后重试' });
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          password: hashedPassword
        }]
      });

      await login(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User'
        },
        token: 'test-token-123'
      });
    });

    it('should return 400 if email is missing', async () => {
      mockReq.body = { password: 'password123' };

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '邮箱和密码不能为空' });
    });

    it('should return 400 if password is missing', async () => {
      mockReq.body = { email: 'test@example.com' };

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '邮箱和密码不能为空' });
    });

    it('should return 401 if user not found', async () => {
      mockReq.body = {
        email: 'notfound@example.com',
        password: 'password123'
      };

      mockQuery.mockResolvedValueOnce({ rows: [] });

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '邮箱或密码错误' });
    });

    it('should return 401 if password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      mockReq.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'test@example.com',
          password: hashedPassword
        }]
      });

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '邮箱或密码错误' });
    });

    it('should return 500 on database error', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '登录失败，请稍后重试' });
    });
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      mockReq.userId = 1;

      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          created_at: new Date()
        }]
      });

      await getProfile(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      }));
    });

    it('should return 404 if user not found', async () => {
      mockReq.userId = 999;

      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '用户不存在' });
    });

    it('should return 500 on database error', async () => {
      mockReq.userId = 1;

      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await getProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '获取用户信息失败' });
    });
  });
});
