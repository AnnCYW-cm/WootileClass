import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock the database module
jest.unstable_mockModule('../../db/index.js', () => ({
  query: jest.fn()
}));

// Mock the errors module
jest.unstable_mockModule('../../utils/errors.js', () => ({
  NotFoundError: class NotFoundError extends Error {
    constructor(resource) {
      super(`${resource}不存在`);
      this.statusCode = 404;
    }
  },
  BadRequestError: class BadRequestError extends Error {
    constructor(message) {
      super(message);
      this.statusCode = 400;
    }
  }
}));

describe('ClassService', () => {
  let ClassService;
  let query;

  beforeEach(async () => {
    jest.clearAllMocks();

    const dbModule = await import('../../db/index.js');
    query = dbModule.query;

    const serviceModule = await import('../../services/ClassService.js');
    ClassService = serviceModule.ClassService;
  });

  describe('getAll', () => {
    it('should return all classes for a user', async () => {
      const mockClasses = [
        { id: 1, name: 'Class A', student_count: 10 },
        { id: 2, name: 'Class B', student_count: 15 }
      ];

      query.mockResolvedValue({ rows: mockClasses });

      const result = await ClassService.getAll('user123');

      expect(result).toEqual(mockClasses);
      expect(query).toHaveBeenCalled();
    });

    it('should filter by status when provided', async () => {
      query.mockResolvedValue({ rows: [] });

      await ClassService.getAll('user123', 'active');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('AND c.status = $2'),
        expect.arrayContaining(['user123', 'active'])
      );
    });
  });

  describe('getById', () => {
    it('should return a class by ID', async () => {
      const mockClass = { id: 1, name: 'Class A', user_id: 'user123' };
      query.mockResolvedValue({ rows: [mockClass] });

      const result = await ClassService.getById(1, 'user123');

      expect(result).toEqual(mockClass);
    });

    it('should throw NotFoundError when class does not exist', async () => {
      query.mockResolvedValue({ rows: [] });

      await expect(ClassService.getById(999, 'user123'))
        .rejects.toThrow('班级不存在');
    });
  });

  describe('create', () => {
    it('should create a new class', async () => {
      const newClass = { id: 1, name: 'New Class', grade: '三年级', subject: '数学' };
      query.mockResolvedValue({ rows: [newClass] });

      const result = await ClassService.create('user123', {
        name: 'New Class',
        grade: '三年级',
        subject: '数学'
      });

      expect(result).toEqual(newClass);
    });

    it('should throw BadRequestError when name is empty', async () => {
      await expect(ClassService.create('user123', { name: '' }))
        .rejects.toThrow('班级名称不能为空');
    });

    it('should throw BadRequestError when name is whitespace only', async () => {
      await expect(ClassService.create('user123', { name: '   ' }))
        .rejects.toThrow('班级名称不能为空');
    });
  });

  describe('update', () => {
    it('should update an existing class', async () => {
      const existingClass = { id: 1, status: 'active', user_id: 'user123' };
      const updatedClass = { id: 1, name: 'Updated Class' };

      query
        .mockResolvedValueOnce({ rows: [existingClass] }) // verifyOwnership
        .mockResolvedValueOnce({ rows: [updatedClass] }); // update

      const result = await ClassService.update(1, 'user123', {
        name: 'Updated Class',
        grade: '四年级',
        subject: '语文'
      });

      expect(result).toEqual(updatedClass);
    });
  });

  describe('delete', () => {
    it('should delete an existing class', async () => {
      const existingClass = { id: 1, user_id: 'user123' };

      query
        .mockResolvedValueOnce({ rows: [existingClass] }) // verifyOwnership
        .mockResolvedValueOnce({ rows: [] }); // delete

      const result = await ClassService.delete(1, 'user123');

      expect(result).toEqual({ message: '班级已删除' });
    });
  });

  describe('toggleArchive', () => {
    it('should toggle class from active to archived', async () => {
      const activeClass = { id: 1, status: 'active', user_id: 'user123' };
      const archivedClass = { id: 1, status: 'archived' };

      query
        .mockResolvedValueOnce({ rows: [activeClass] }) // verifyOwnership
        .mockResolvedValueOnce({ rows: [archivedClass] }); // update

      const result = await ClassService.toggleArchive(1, 'user123');

      expect(result.status).toBe('archived');
    });

    it('should toggle class from archived to active', async () => {
      const archivedClass = { id: 1, status: 'archived', user_id: 'user123' };
      const activeClass = { id: 1, status: 'active' };

      query
        .mockResolvedValueOnce({ rows: [archivedClass] }) // verifyOwnership
        .mockResolvedValueOnce({ rows: [activeClass] }); // update

      const result = await ClassService.toggleArchive(1, 'user123');

      expect(result.status).toBe('active');
    });
  });
});
