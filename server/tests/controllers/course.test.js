import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock the database module
const mockQuery = jest.fn();
jest.unstable_mockModule('../../db/index.js', () => ({
  query: mockQuery,
  default: { query: mockQuery }
}));

// Mock errors
jest.unstable_mockModule('../../utils/errors.js', () => ({
  NotFoundError: class NotFoundError extends Error {
    constructor(resource) {
      super(`${resource}不存在`);
      this.statusCode = 404;
      this.code = 'NOT_FOUND';
    }
  },
  BadRequestError: class BadRequestError extends Error {
    constructor(message) {
      super(message);
      this.statusCode = 400;
      this.code = 'BAD_REQUEST';
    }
  }
}));

describe('CourseService', () => {
  let CourseService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const serviceModule = await import('../../services/CourseService.js');
    CourseService = serviceModule.CourseService;
  });

  afterEach(() => {
    jest.resetModules();
  });

  // ==================== getAll ====================
  describe('getAll', () => {
    it('should return all courses for a user', async () => {
      const mockCourses = [
        { id: 1, title: '课程1', section_count: '2', animation_count: '5' },
        { id: 2, title: '课程2', section_count: '3', animation_count: '8' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockCourses });

      const result = await CourseService.getAll(1);

      expect(result).toEqual(mockCourses);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.user_id = $1'),
        [1]
      );
    });

    it('should return empty array when user has no courses', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await CourseService.getAll(1);

      expect(result).toEqual([]);
    });

    it('should filter by status when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await CourseService.getAll(1, 'published');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND c.status = $2'),
        [1, 'published']
      );
    });

    it('should not filter by status when null', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await CourseService.getAll(1, null);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.not.stringContaining('AND c.status'),
        [1]
      );
    });

    it('should order by created_at DESC', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await CourseService.getAll(1);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY c.created_at DESC'),
        expect.any(Array)
      );
    });

    it('should include section and animation counts', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await CourseService.getAll(1);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(DISTINCT cs.id) as section_count'),
        expect.any(Array)
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(DISTINCT a.id) as animation_count'),
        expect.any(Array)
      );
    });
  });

  // ==================== getById ====================
  describe('getById', () => {
    it('should return course with sections and animations', async () => {
      const mockCourse = { id: 1, title: '测试课程', user_id: 1 };
      const mockSections = [
        { id: 1, title: '章节1', animations: [{ id: 1, title: '动画1' }] }
      ];
      mockQuery.mockResolvedValueOnce({ rows: [mockCourse] });
      mockQuery.mockResolvedValueOnce({ rows: mockSections });

      const result = await CourseService.getById(1, 1);

      expect(result).toEqual({ ...mockCourse, sections: mockSections });
    });

    it('should throw NotFoundError when course does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(CourseService.getById(999, 1))
        .rejects.toThrow('课程不存在');
    });

    it('should throw NotFoundError when user does not own course', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // user_id check in query

      await expect(CourseService.getById(1, 999))
        .rejects.toThrow('课程不存在');
    });

    it('should return course with empty sections array', async () => {
      const mockCourse = { id: 1, title: '测试课程', user_id: 1 };
      mockQuery.mockResolvedValueOnce({ rows: [mockCourse] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await CourseService.getById(1, 1);

      expect(result.sections).toEqual([]);
    });
  });

  // ==================== getByShareCode ====================
  describe('getByShareCode', () => {
    it('should return course and increment view count', async () => {
      const mockCourse = { id: 1, title: '公开课程', share_code: 'ABC123' };
      const mockSections = [];
      mockQuery.mockResolvedValueOnce({ rows: [mockCourse] });
      mockQuery.mockResolvedValueOnce({ rowCount: 1 }); // view count increment
      mockQuery.mockResolvedValueOnce({ rows: mockSections });

      const result = await CourseService.getByShareCode('ABC123');

      expect(result.share_code).toBe('ABC123');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE courses SET view_count'),
        [mockCourse.id]
      );
    });

    it('should throw NotFoundError when share code does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(CourseService.getByShareCode('INVALID'))
        .rejects.toThrow('课程不存在');
    });

    it('should throw NotFoundError for draft course', async () => {
      // Query includes status = 'published' filter
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(CourseService.getByShareCode('DRAFT_CODE'))
        .rejects.toThrow('课程不存在');
    });

    it('should handle empty share code', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(CourseService.getByShareCode(''))
        .rejects.toThrow('课程不存在');
    });

    it('should handle null share code', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(CourseService.getByShareCode(null))
        .rejects.toThrow('课程不存在');
    });
  });

  // ==================== create ====================
  describe('create', () => {
    it('should create course with all fields', async () => {
      const courseData = {
        title: '新课程',
        description: '课程描述',
        grade: '一年级',
        subject: '数学',
        classId: 1,
        coverImage: '/covers/course.jpg'
      };
      const mockCreated = { id: 1, ...courseData, user_id: 1 };
      mockQuery.mockResolvedValueOnce({ rows: [mockCreated] });

      const result = await CourseService.create(1, courseData);

      expect(result).toEqual(mockCreated);
    });

    it('should throw BadRequestError when title is empty', async () => {
      await expect(CourseService.create(1, { title: '' }))
        .rejects.toThrow('课程标题不能为空');
    });

    it('should throw BadRequestError when title is whitespace only', async () => {
      await expect(CourseService.create(1, { title: '   ' }))
        .rejects.toThrow('课程标题不能为空');
    });

    it('should throw BadRequestError when title is null', async () => {
      await expect(CourseService.create(1, { title: null }))
        .rejects.toThrow('课程标题不能为空');
    });

    it('should throw BadRequestError when title is undefined', async () => {
      await expect(CourseService.create(1, {}))
        .rejects.toThrow('课程标题不能为空');
    });

    it('should trim title before saving', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await CourseService.create(1, { title: '  标题  ' });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['标题'])
      );
    });

    it('should use empty string for missing optional fields', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await CourseService.create(1, { title: '标题' });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        [1, null, '标题', '', '', '', null] // classId null, description/grade/subject empty
      );
    });

    it('should handle null classId', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await CourseService.create(1, { title: '标题', classId: null });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([null]) // classId
      );
    });
  });

  // ==================== update ====================
  describe('update', () => {
    it('should update course when user owns it', async () => {
      const mockCourse = { id: 1, user_id: 1 };
      mockQuery.mockResolvedValueOnce({ rows: [mockCourse] }); // verifyOwnership
      mockQuery.mockResolvedValueOnce({ rows: [{ ...mockCourse, title: '新标题' }] });

      const result = await CourseService.update(1, 1, { title: '新标题' });

      expect(result.title).toBe('新标题');
    });

    it('should throw NotFoundError when course does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(CourseService.update(999, 1, { title: '新标题' }))
        .rejects.toThrow('课程不存在');
    });

    it('should throw NotFoundError when user does not own course', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 2 }] });

      await expect(CourseService.update(1, 1, { title: '新标题' }))
        .rejects.toThrow('课程不存在');
    });

    it('should use default status draft when not provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await CourseService.update(1, 1, { title: '新标题' });

      expect(mockQuery).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.arrayContaining(['draft'])
      );
    });
  });

  // ==================== delete ====================
  describe('delete', () => {
    it('should delete course', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] }); // verifyOwnership
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const result = await CourseService.delete(1, 1);

      expect(result).toEqual({ message: '课程已删除' });
    });

    it('should throw NotFoundError when course does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(CourseService.delete(999, 1))
        .rejects.toThrow('课程不存在');
    });

    it('should throw NotFoundError when user does not own course', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 2 }] });

      await expect(CourseService.delete(1, 1))
        .rejects.toThrow('课程不存在');
    });
  });

  // ==================== publish ====================
  describe('publish', () => {
    it('should publish course and generate share code', async () => {
      const mockCourse = { id: 1, user_id: 1, share_code: null };
      mockQuery.mockResolvedValueOnce({ rows: [mockCourse] }); // verifyOwnership
      mockQuery.mockResolvedValueOnce({ rows: [{ ...mockCourse, status: 'published', share_code: 'ABC123' }] });

      const result = await CourseService.publish(1, 1);

      expect(result.status).toBe('published');
      expect(result.share_code).toBeTruthy();
    });

    it('should keep existing share code when republishing', async () => {
      const mockCourse = { id: 1, user_id: 1, share_code: 'EXISTING' };
      mockQuery.mockResolvedValueOnce({ rows: [mockCourse] });
      mockQuery.mockResolvedValueOnce({ rows: [{ ...mockCourse, status: 'published' }] });

      await CourseService.publish(1, 1);

      expect(mockQuery).toHaveBeenLastCalledWith(
        expect.any(String),
        ['EXISTING', 1]
      );
    });

    it('should throw NotFoundError when course does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(CourseService.publish(999, 1))
        .rejects.toThrow('课程不存在');
    });
  });

  // ==================== unpublish ====================
  describe('unpublish', () => {
    it('should unpublish course', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, status: 'draft' }] });

      const result = await CourseService.unpublish(1, 1);

      expect(result.status).toBe('draft');
    });

    it('should throw NotFoundError when course does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(CourseService.unpublish(999, 1))
        .rejects.toThrow('课程不存在');
    });
  });

  // ==================== verifyOwnership ====================
  describe('verifyOwnership', () => {
    it('should return course when user owns it', async () => {
      const mockCourse = { id: 1, user_id: 1 };
      mockQuery.mockResolvedValueOnce({ rows: [mockCourse] });

      const result = await CourseService.verifyOwnership(1, 1);

      expect(result).toEqual(mockCourse);
    });

    it('should throw NotFoundError when course does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(CourseService.verifyOwnership(999, 1))
        .rejects.toThrow('课程不存在');
    });

    it('should throw NotFoundError when user does not own course', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 2 }] });

      await expect(CourseService.verifyOwnership(1, 1))
        .rejects.toThrow('课程不存在');
    });
  });

  // ==================== Section Methods ====================
  describe('createSection', () => {
    it('should create section with correct sort order', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] }); // verifyOwnership
      mockQuery.mockResolvedValueOnce({ rows: [{ next_order: 0 }] }); // max sort order
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, title: '第一章', sort_order: 0 }] });

      const result = await CourseService.createSection(1, 1, { title: '第一章' });

      expect(result.title).toBe('第一章');
      expect(result.sort_order).toBe(0);
    });

    it('should increment sort order for subsequent sections', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ next_order: 3 }] }); // already has 3 sections
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 4, sort_order: 3 }] });

      const result = await CourseService.createSection(1, 1, { title: '第四章' });

      expect(result.sort_order).toBe(3);
    });

    it('should throw BadRequestError when title is empty', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] });

      await expect(CourseService.createSection(1, 1, { title: '' }))
        .rejects.toThrow('章节标题不能为空');
    });

    it('should throw BadRequestError when title is whitespace', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] });

      await expect(CourseService.createSection(1, 1, { title: '   ' }))
        .rejects.toThrow('章节标题不能为空');
    });

    it('should throw NotFoundError when course does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(CourseService.createSection(999, 1, { title: '章节' }))
        .rejects.toThrow('课程不存在');
    });

    it('should trim title before saving', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ next_order: 0 }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await CourseService.createSection(1, 1, { title: '  标题  ' });

      expect(mockQuery).toHaveBeenLastCalledWith(
        expect.any(String),
        [1, '标题', 0]
      );
    });
  });

  describe('updateSection', () => {
    it('should update section', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] }); // verifyOwnership
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, title: '新标题' }] });

      const result = await CourseService.updateSection(1, 1, 1, { title: '新标题' });

      expect(result.title).toBe('新标题');
    });

    it('should throw NotFoundError when section does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] });
      mockQuery.mockResolvedValueOnce({ rows: [] }); // section not found

      await expect(CourseService.updateSection(1, 999, 1, { title: '新标题' }))
        .rejects.toThrow('章节不存在');
    });

    it('should throw NotFoundError when course does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(CourseService.updateSection(999, 1, 1, { title: '新标题' }))
        .rejects.toThrow('课程不存在');
    });
  });

  describe('deleteSection', () => {
    it('should delete section', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] }); // verifyOwnership
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // DELETE RETURNING

      const result = await CourseService.deleteSection(1, 1, 1);

      expect(result).toEqual({ message: '章节已删除' });
    });

    it('should throw NotFoundError when section does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(CourseService.deleteSection(1, 999, 1))
        .rejects.toThrow('章节不存在');
    });

    it('should throw NotFoundError when course does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(CourseService.deleteSection(999, 1, 1))
        .rejects.toThrow('课程不存在');
    });
  });

  describe('reorderSections', () => {
    it('should reorder sections', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] }); // verifyOwnership
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const result = await CourseService.reorderSections(1, 1, [3, 1, 2]);

      expect(result).toEqual({ message: '排序已更新' });
      expect(mockQuery).toHaveBeenCalledTimes(4); // 1 ownership + 3 updates
    });

    it('should handle empty section array', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] });

      const result = await CourseService.reorderSections(1, 1, []);

      expect(result).toEqual({ message: '排序已更新' });
      expect(mockQuery).toHaveBeenCalledTimes(1); // only ownership check
    });

    it('should throw NotFoundError when course does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(CourseService.reorderSections(999, 1, [1, 2, 3]))
        .rejects.toThrow('课程不存在');
    });
  });

  // ==================== Comment Methods ====================
  describe('getComments', () => {
    it('should return comments ordered by created_at DESC', async () => {
      const mockComments = [
        { id: 2, content: '第二条', created_at: '2026-01-02' },
        { id: 1, content: '第一条', created_at: '2026-01-01' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockComments });

      const result = await CourseService.getComments(1);

      expect(result).toEqual(mockComments);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY cc.created_at DESC'),
        [1]
      );
    });

    it('should return empty array when no comments', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await CourseService.getComments(1);

      expect(result).toEqual([]);
    });
  });

  describe('createComment', () => {
    it('should create comment and return with user info', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // INSERT
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, content: '好课程', user_name: '张三' }] }); // SELECT with user

      const result = await CourseService.createComment(1, 1, '好课程');

      expect(result.user_name).toBe('张三');
    });

    it('should throw BadRequestError when content is empty', async () => {
      await expect(CourseService.createComment(1, 1, ''))
        .rejects.toThrow('评论内容不能为空');
    });

    it('should throw BadRequestError when content is whitespace', async () => {
      await expect(CourseService.createComment(1, 1, '   '))
        .rejects.toThrow('评论内容不能为空');
    });

    it('should throw BadRequestError when content is null', async () => {
      await expect(CourseService.createComment(1, 1, null))
        .rejects.toThrow('评论内容不能为空');
    });

    it('should trim content before saving', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await CourseService.createComment(1, 1, '  内容  ');

      expect(mockQuery).toHaveBeenNthCalledWith(1,
        expect.any(String),
        [1, 1, '内容', null]
      );
    });

    it('should support parent comment for replies', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 2 }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 2 }] });

      await CourseService.createComment(1, 1, '回复', 1);

      expect(mockQuery).toHaveBeenNthCalledWith(1,
        expect.any(String),
        [1, 1, '回复', 1]
      );
    });
  });

  describe('deleteComment', () => {
    it('should allow comment owner to delete', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] }); // SELECT
      mockQuery.mockResolvedValueOnce({ rowCount: 1 }); // DELETE

      const result = await CourseService.deleteComment(1, 1);

      expect(result).toEqual({ message: '评论已删除' });
    });

    it('should throw NotFoundError when comment does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(CourseService.deleteComment(999, 1))
        .rejects.toThrow('评论不存在');
    });

    it('should throw BadRequestError when user is not owner', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 2 }] }); // different user

      await expect(CourseService.deleteComment(1, 1))
        .rejects.toThrow('无权删除此评论');
    });
  });

  // ==================== generateShareCode ====================
  describe('generateShareCode', () => {
    it('should generate 12 character hex code', () => {
      const code = CourseService.generateShareCode();

      expect(code).toHaveLength(12);
      expect(code).toMatch(/^[A-F0-9]+$/);
    });

    it('should generate unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(CourseService.generateShareCode());
      }
      expect(codes.size).toBe(100);
    });
  });
});
