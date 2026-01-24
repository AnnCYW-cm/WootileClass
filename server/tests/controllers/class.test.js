import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock the database module
const mockQuery = jest.fn();
jest.unstable_mockModule('../../db/index.js', () => ({
  query: mockQuery,
  default: { query: mockQuery }
}));

// Import after mocking
const { getClasses, getClass, createClass, updateClass, deleteClass, archiveClass } = await import('../../controllers/classController.js');

describe('ClassController', () => {
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

  describe('getClasses', () => {
    it('should return all classes for the user', async () => {
      const mockClasses = [
        { id: 1, name: '三年级1班', grade: '三年级', subject: '数学', student_count: '25' },
        { id: 2, name: '三年级2班', grade: '三年级', subject: '英语', student_count: '30' }
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockClasses });

      await getClasses(mockReq, mockRes);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockRes.json).toHaveBeenCalledWith(mockClasses);
    });

    it('should filter by status when provided', async () => {
      mockReq.query = { status: 'active' };
      const mockClasses = [
        { id: 1, name: '三年级1班', status: 'active', student_count: '25' }
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockClasses });

      await getClasses(mockReq, mockRes);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND c.status = $2'),
        [1, 'active']
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockClasses);
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await getClasses(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '获取班级列表失败' });
    });
  });

  describe('getClass', () => {
    it('should return a specific class', async () => {
      mockReq.params = { id: '1' };
      const mockClass = {
        id: 1,
        name: '三年级1班',
        grade: '三年级',
        subject: '数学',
        student_count: '25'
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockClass] });

      await getClass(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockClass);
    });

    it('should return 404 if class not found', async () => {
      mockReq.params = { id: '999' };
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getClass(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '班级不存在' });
    });

    it('should return 500 on database error', async () => {
      mockReq.params = { id: '1' };
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await getClass(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '获取班级信息失败' });
    });
  });

  describe('createClass', () => {
    it('should create a new class successfully', async () => {
      mockReq.body = {
        name: '四年级1班',
        grade: '四年级',
        subject: '语文'
      };

      const newClass = {
        id: 1,
        user_id: 1,
        name: '四年级1班',
        grade: '四年级',
        subject: '语文',
        status: 'active',
        created_at: new Date()
      };

      mockQuery.mockResolvedValueOnce({ rows: [newClass] });

      await createClass(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(newClass);
    });

    it('should return 400 if name is missing', async () => {
      mockReq.body = { grade: '四年级' };

      await createClass(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '班级名称不能为空' });
    });

    it('should create class with empty grade and subject', async () => {
      mockReq.body = { name: '测试班级' };

      const newClass = {
        id: 1,
        name: '测试班级',
        grade: '',
        subject: ''
      };

      mockQuery.mockResolvedValueOnce({ rows: [newClass] });

      await createClass(mockReq, mockRes);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        [1, '测试班级', '', '']
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should return 500 on database error', async () => {
      mockReq.body = { name: '测试班级' };
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await createClass(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '创建班级失败' });
    });
  });

  describe('updateClass', () => {
    it('should update a class successfully', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = {
        name: '更新后的班级',
        grade: '五年级',
        subject: '英语',
        status: 'active'
      };

      // Check ownership
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      // Update
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          name: '更新后的班级',
          grade: '五年级',
          subject: '英语',
          status: 'active'
        }]
      });

      await updateClass(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        name: '更新后的班级'
      }));
    });

    it('should return 404 if class not found', async () => {
      mockReq.params = { id: '999' };
      mockReq.body = { name: '更新' };

      mockQuery.mockResolvedValueOnce({ rows: [] });

      await updateClass(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '班级不存在' });
    });

    it('should return 500 on database error', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { name: '更新' };

      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await updateClass(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '更新班级失败' });
    });
  });

  describe('deleteClass', () => {
    it('should delete a class successfully', async () => {
      mockReq.params = { id: '1' };

      // Check ownership
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      // Delete
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await deleteClass(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ message: '班级已删除' });
    });

    it('should return 404 if class not found', async () => {
      mockReq.params = { id: '999' };

      mockQuery.mockResolvedValueOnce({ rows: [] });

      await deleteClass(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '班级不存在' });
    });

    it('should return 500 on database error', async () => {
      mockReq.params = { id: '1' };

      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await deleteClass(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '删除班级失败' });
    });
  });

  describe('archiveClass', () => {
    it('should archive an active class', async () => {
      mockReq.params = { id: '1' };

      // Check ownership - active class
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, status: 'active' }] });
      // Update to archived
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, status: 'archived' }]
      });

      await archiveClass(mockReq, mockRes);

      expect(mockQuery).toHaveBeenLastCalledWith(
        expect.any(String),
        ['archived', '1']
      );
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'archived'
      }));
    });

    it('should unarchive an archived class', async () => {
      mockReq.params = { id: '1' };

      // Check ownership - archived class
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, status: 'archived' }] });
      // Update to active
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, status: 'active' }]
      });

      await archiveClass(mockReq, mockRes);

      expect(mockQuery).toHaveBeenLastCalledWith(
        expect.any(String),
        ['active', '1']
      );
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'active'
      }));
    });

    it('should return 404 if class not found', async () => {
      mockReq.params = { id: '999' };

      mockQuery.mockResolvedValueOnce({ rows: [] });

      await archiveClass(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '班级不存在' });
    });

    it('should return 500 on database error', async () => {
      mockReq.params = { id: '1' };

      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await archiveClass(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '归档班级失败' });
    });
  });
});
