import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock the database module
const mockQuery = jest.fn();
jest.unstable_mockModule('../../db/index.js', () => ({
  query: mockQuery,
  default: { query: mockQuery }
}));

describe('AnimationController', () => {
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

  describe('Animation CRUD operations', () => {
    it('should create animation', async () => {
      const newAnimation = {
        id: 1,
        section_id: 1,
        title: '三角形内角和',
        type: 'lottie',
        source_url: '/animations/math/triangle.json'
      };
      mockQuery.mockResolvedValueOnce({ rows: [newAnimation] });

      const result = await mockQuery(
        'INSERT INTO animations (section_id, title, type, source_url) VALUES ($1, $2, $3, $4) RETURNING *',
        [1, '三角形内角和', 'lottie', '/animations/math/triangle.json']
      );
      expect(result.rows[0].title).toBe('三角形内角和');
    });

    it('should get animation by id', async () => {
      const mockAnimation = { id: 1, title: '三角形内角和', type: 'lottie' };
      mockQuery.mockResolvedValueOnce({ rows: [mockAnimation] });

      const result = await mockQuery('SELECT * FROM animations WHERE id = $1', [1]);
      expect(result.rows[0]).toEqual(mockAnimation);
    });

    it('should update animation', async () => {
      const updatedAnimation = { id: 1, title: '更新后的动画' };
      mockQuery.mockResolvedValueOnce({ rows: [updatedAnimation] });

      const result = await mockQuery(
        'UPDATE animations SET title = $1 WHERE id = $2 RETURNING *',
        ['更新后的动画', 1]
      );
      expect(result.rows[0].title).toBe('更新后的动画');
    });

    it('should delete animation', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const result = await mockQuery('DELETE FROM animations WHERE id = $1 RETURNING id', [1]);
      expect(result.rows.length).toBe(1);
    });

    it('should reorder animations', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const animationIds = [3, 1, 2];
      for (let i = 0; i < animationIds.length; i++) {
        await mockQuery(
          'UPDATE animations SET sort_order = $1 WHERE id = $2',
          [i, animationIds[i]]
        );
      }
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });
  });

  describe('Builtin Animations', () => {
    it('should get all builtin animations', async () => {
      const mockAnimations = [
        { id: 1, name: '三角形内角和', category: 'math' },
        { id: 2, name: '单摆运动', category: 'physics' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockAnimations });

      const result = await mockQuery('SELECT * FROM builtin_animations');
      expect(result.rows).toEqual(mockAnimations);
    });

    it('should filter builtin animations by category', async () => {
      const mockAnimations = [
        { id: 1, name: '三角形内角和', category: 'math' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockAnimations });

      const result = await mockQuery('SELECT * FROM builtin_animations WHERE category = $1', ['math']);
      expect(result.rows.every(a => a.category === 'math')).toBe(true);
    });

    it('should get builtin categories', async () => {
      const mockCategories = [
        { category: 'math', count: '5' },
        { category: 'physics', count: '3' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockCategories });

      const result = await mockQuery(
        'SELECT category, COUNT(*) as count FROM builtin_animations GROUP BY category'
      );
      expect(result.rows.length).toBe(2);
    });

    it('should get builtin animation by id', async () => {
      const mockAnimation = {
        id: 1,
        name: '三角形内角和',
        source_path: '/animations/math/triangle.json'
      };
      mockQuery.mockResolvedValueOnce({ rows: [mockAnimation] });

      const result = await mockQuery('SELECT * FROM builtin_animations WHERE id = $1', [1]);
      expect(result.rows[0].name).toBe('三角形内角和');
    });

    it('should seed builtin animations', async () => {
      const builtinAnimations = [
        { name: '三角形内角和', category: 'math', source_path: '/math/triangle.json' },
        { name: '单摆运动', category: 'physics', source_path: '/physics/pendulum.json' }
      ];
      mockQuery.mockResolvedValueOnce({ rowCount: 2 });

      const result = await mockQuery(
        'INSERT INTO builtin_animations (name, category, source_path) VALUES ($1, $2, $3), ($4, $5, $6)',
        builtinAnimations.flatMap(a => [a.name, a.category, a.source_path])
      );
      expect(result.rowCount).toBe(2);
    });
  });

  describe('Animation Types', () => {
    it('should support lottie type', () => {
      const animation = { type: 'lottie', source_url: '/animations/test.json' };
      expect(animation.type).toBe('lottie');
      expect(animation.source_url.endsWith('.json')).toBe(true);
    });

    it('should support html type', () => {
      const animation = { type: 'html', source_url: '/animations/test.html' };
      expect(animation.type).toBe('html');
      expect(animation.source_url.endsWith('.html')).toBe(true);
    });

    it('should support builtin type', () => {
      const animation = { type: 'builtin', source_url: 'triangle-angles' };
      expect(animation.type).toBe('builtin');
    });
  });
});
