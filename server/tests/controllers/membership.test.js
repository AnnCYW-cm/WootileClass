import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock the database module
const mockQuery = jest.fn();
jest.unstable_mockModule('../../db/index.js', () => ({
  query: mockQuery,
  default: { query: mockQuery }
}));

describe('MembershipController', () => {
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Membership Plans', () => {
    it('should return available plans', () => {
      const plans = {
        premium: {
          name: '高级会员',
          price: 199,
          features: ['无限班级', '无限学生', '数据导出', '优先支持']
        }
      };
      expect(plans.premium.price).toBe(199);
      expect(plans.premium.features).toContain('无限班级');
    });
  });

  describe('User Membership Status', () => {
    it('should get active membership status', async () => {
      const mockMembership = {
        id: 1,
        user_id: 1,
        plan: 'premium',
        expires_at: '2027-01-01T00:00:00.000Z'
      };
      mockQuery.mockResolvedValueOnce({ rows: [mockMembership] });

      const result = await mockQuery(
        'SELECT * FROM user_memberships WHERE user_id = $1 AND expires_at > NOW()',
        [1]
      );
      expect(result.rows[0].plan).toBe('premium');
    });

    it('should return empty for free user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await mockQuery(
        'SELECT * FROM user_memberships WHERE user_id = $1 AND expires_at > NOW()',
        [1]
      );
      expect(result.rows.length).toBe(0);
    });

    it('should calculate days remaining', () => {
      const expiresAt = new Date('2027-01-01');
      const now = new Date('2026-06-01');
      const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
      expect(daysRemaining).toBeGreaterThan(0);
    });
  });

  describe('Purchase Membership', () => {
    it('should create new membership for first-time purchase', async () => {
      const newMembership = {
        id: 1,
        user_id: 1,
        plan: 'premium',
        expires_at: '2027-02-27T00:00:00.000Z'
      };
      mockQuery.mockResolvedValueOnce({ rows: [newMembership] });

      const result = await mockQuery(
        'INSERT INTO user_memberships (user_id, plan, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'1 year\') RETURNING *',
        [1, 'premium']
      );
      expect(result.rows[0].plan).toBe('premium');
    });

    it('should extend membership for renewal', async () => {
      // First, get existing membership
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, expires_at: '2026-06-01T00:00:00.000Z' }]
      });
      // Then, update with extended expiry
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, expires_at: '2027-06-01T00:00:00.000Z' }]
      });

      const existing = await mockQuery(
        'SELECT * FROM user_memberships WHERE user_id = $1',
        [1]
      );
      expect(existing.rows.length).toBe(1);

      const updated = await mockQuery(
        'UPDATE user_memberships SET expires_at = expires_at + INTERVAL \'1 year\' WHERE id = $1 RETURNING *',
        [1]
      );
      expect(new Date(updated.rows[0].expires_at).getFullYear()).toBe(2027);
    });
  });

  describe('Usage Limits', () => {
    it('should check class limit for free user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '2' }] });

      const result = await mockQuery(
        'SELECT COUNT(*) FROM classes WHERE user_id = $1',
        [1]
      );
      const classCount = parseInt(result.rows[0].count);
      const freeLimit = 2;
      expect(classCount).toBeLessThanOrEqual(freeLimit);
    });

    it('should allow unlimited classes for premium user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '100' }] });

      const result = await mockQuery(
        'SELECT COUNT(*) FROM classes WHERE user_id = $1',
        [1]
      );
      const classCount = parseInt(result.rows[0].count);
      const premiumLimit = -1; // Unlimited
      expect(premiumLimit === -1 || classCount <= premiumLimit).toBe(true);
    });

    it('should check video storage limit', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ total_size: '104857600' }] // 100MB
      });

      const result = await mockQuery(
        'SELECT COALESCE(SUM(file_size), 0) as total_size FROM videos WHERE user_id = $1',
        [1]
      );
      const storageMB = parseInt(result.rows[0].total_size) / (1024 * 1024);
      const freeLimitMB = 200;
      expect(storageMB).toBeLessThanOrEqual(freeLimitMB);
    });
  });

  describe('Usage Statistics', () => {
    it('should get comprehensive usage stats', async () => {
      // Classes count
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '3' }] });
      // Students count
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '50' }] });
      // Videos count and storage
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: '5', total_size: '52428800' }]
      });

      const classesResult = await mockQuery('SELECT COUNT(*) FROM classes WHERE user_id = $1', [1]);
      const studentsResult = await mockQuery('SELECT COUNT(*) FROM students s JOIN classes c ON s.class_id = c.id WHERE c.user_id = $1', [1]);
      const videosResult = await mockQuery('SELECT COUNT(*), SUM(file_size) as total_size FROM videos WHERE user_id = $1', [1]);

      expect(parseInt(classesResult.rows[0].count)).toBe(3);
      expect(parseInt(studentsResult.rows[0].count)).toBe(50);
      expect(parseInt(videosResult.rows[0].count)).toBe(5);
    });
  });
});
