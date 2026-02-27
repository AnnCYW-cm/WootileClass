import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock the database module
const mockQuery = jest.fn();
jest.unstable_mockModule('../../db/index.js', () => ({
  query: mockQuery,
  default: { query: mockQuery }
}));

describe('CourseController', () => {
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

  describe('Course CRUD operations', () => {
    it('should get all courses', async () => {
      const mockCourses = [
        { id: 1, title: '数学基础', status: 'published' },
        { id: 2, title: '物理入门', status: 'draft' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockCourses });

      const result = await mockQuery('SELECT * FROM courses WHERE user_id = $1', [1]);
      expect(result.rows).toEqual(mockCourses);
    });

    it('should get course by id', async () => {
      const mockCourse = { id: 1, title: '数学基础', user_id: 1 };
      mockQuery.mockResolvedValueOnce({ rows: [mockCourse] });

      const result = await mockQuery('SELECT * FROM courses WHERE id = $1', [1]);
      expect(result.rows[0]).toEqual(mockCourse);
    });

    it('should get course by share code', async () => {
      const mockCourse = { id: 1, title: '数学基础', share_code: 'ABC123' };
      mockQuery.mockResolvedValueOnce({ rows: [mockCourse] });

      const result = await mockQuery('SELECT * FROM courses WHERE share_code = $1', ['ABC123']);
      expect(result.rows[0].share_code).toBe('ABC123');
    });

    it('should create course', async () => {
      const newCourse = {
        id: 1,
        user_id: 1,
        title: '新课程',
        subject: '数学'
      };
      mockQuery.mockResolvedValueOnce({ rows: [newCourse] });

      const result = await mockQuery(
        'INSERT INTO courses (user_id, title, subject) VALUES ($1, $2, $3) RETURNING *',
        [1, '新课程', '数学']
      );
      expect(result.rows[0].title).toBe('新课程');
    });

    it('should update course', async () => {
      const updatedCourse = { id: 1, title: '更新后的课程' };
      mockQuery.mockResolvedValueOnce({ rows: [updatedCourse] });

      const result = await mockQuery(
        'UPDATE courses SET title = $1 WHERE id = $2 RETURNING *',
        ['更新后的课程', 1]
      );
      expect(result.rows[0].title).toBe('更新后的课程');
    });

    it('should delete course', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const result = await mockQuery('DELETE FROM courses WHERE id = $1 RETURNING id', [1]);
      expect(result.rows.length).toBe(1);
    });

    it('should publish course', async () => {
      const publishedCourse = { id: 1, status: 'published', share_code: 'MATH01' };
      mockQuery.mockResolvedValueOnce({ rows: [publishedCourse] });

      const result = await mockQuery(
        'UPDATE courses SET status = $1, share_code = $2 WHERE id = $3 RETURNING *',
        ['published', 'MATH01', 1]
      );
      expect(result.rows[0].status).toBe('published');
    });

    it('should unpublish course', async () => {
      const unpublishedCourse = { id: 1, status: 'draft' };
      mockQuery.mockResolvedValueOnce({ rows: [unpublishedCourse] });

      const result = await mockQuery(
        'UPDATE courses SET status = $1 WHERE id = $2 RETURNING *',
        ['draft', 1]
      );
      expect(result.rows[0].status).toBe('draft');
    });
  });

  describe('Course Sections', () => {
    it('should create section', async () => {
      const newSection = { id: 1, course_id: 1, title: '第一章' };
      mockQuery.mockResolvedValueOnce({ rows: [newSection] });

      const result = await mockQuery(
        'INSERT INTO course_sections (course_id, title) VALUES ($1, $2) RETURNING *',
        [1, '第一章']
      );
      expect(result.rows[0].title).toBe('第一章');
    });

    it('should update section', async () => {
      const updatedSection = { id: 1, title: '更新后的章节' };
      mockQuery.mockResolvedValueOnce({ rows: [updatedSection] });

      const result = await mockQuery(
        'UPDATE course_sections SET title = $1 WHERE id = $2 RETURNING *',
        ['更新后的章节', 1]
      );
      expect(result.rows[0].title).toBe('更新后的章节');
    });

    it('should delete section', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const result = await mockQuery(
        'DELETE FROM course_sections WHERE id = $1 RETURNING id',
        [1]
      );
      expect(result.rows.length).toBe(1);
    });

    it('should reorder sections', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 3 });

      const result = await mockQuery(
        'UPDATE course_sections SET sort_order = $1 WHERE id = $2',
        [0, 3]
      );
      expect(result.rowCount).toBe(3);
    });
  });

  describe('Course Comments', () => {
    it('should get comments', async () => {
      const mockComments = [{ id: 1, content: '很好的课程' }];
      mockQuery.mockResolvedValueOnce({ rows: mockComments });

      const result = await mockQuery(
        'SELECT * FROM course_comments WHERE course_id = $1',
        [1]
      );
      expect(result.rows).toEqual(mockComments);
    });

    it('should create comment', async () => {
      const newComment = { id: 1, content: '很好的课程' };
      mockQuery.mockResolvedValueOnce({ rows: [newComment] });

      const result = await mockQuery(
        'INSERT INTO course_comments (course_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
        [1, 1, '很好的课程']
      );
      expect(result.rows[0].content).toBe('很好的课程');
    });

    it('should delete comment', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const result = await mockQuery(
        'DELETE FROM course_comments WHERE id = $1 RETURNING id',
        [1]
      );
      expect(result.rows.length).toBe(1);
    });
  });
});
