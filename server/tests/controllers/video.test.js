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

describe('VideoService', () => {
  let VideoService;
  let NotFoundError;
  let BadRequestError;

  beforeEach(async () => {
    jest.clearAllMocks();
    const serviceModule = await import('../../services/VideoService.js');
    VideoService = serviceModule.VideoService;
    const errorsModule = await import('../../utils/errors.js');
    NotFoundError = errorsModule.NotFoundError;
    BadRequestError = errorsModule.BadRequestError;
  });

  afterEach(() => {
    jest.resetModules();
  });

  // ==================== getAll ====================
  describe('getAll', () => {
    it('should return all videos for a user', async () => {
      const mockVideos = [
        { id: 1, title: '视频1', user_id: 1 },
        { id: 2, title: '视频2', user_id: 1 }
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockVideos });

      const result = await VideoService.getAll(1);

      expect(result).toEqual(mockVideos);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1'),
        [1]
      );
    });

    it('should return empty array when user has no videos', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await VideoService.getAll(1);

      expect(result).toEqual([]);
    });

    it('should filter by grade', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await VideoService.getAll(1, { grade: '一年级' });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND grade = $2'),
        [1, '一年级']
      );
    });

    it('should filter by subject', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await VideoService.getAll(1, { subject: '数学' });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND subject = $2'),
        [1, '数学']
      );
    });

    it('should filter by status', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await VideoService.getAll(1, { status: 'public' });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND status = $2'),
        [1, 'public']
      );
    });

    it('should apply multiple filters', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await VideoService.getAll(1, { grade: '一年级', subject: '数学', status: 'public' });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND grade = $2'),
        expect.arrayContaining([1, '一年级', '数学', 'public'])
      );
    });

    it('should order by created_at DESC', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await VideoService.getAll(1);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at DESC'),
        expect.any(Array)
      );
    });
  });

  // ==================== getById ====================
  describe('getById', () => {
    it('should return video when found and user owns it', async () => {
      const mockVideo = { id: 1, title: '测试视频', user_id: 1 };
      mockQuery.mockResolvedValueOnce({ rows: [mockVideo] });

      const result = await VideoService.getById(1, 1);

      expect(result).toEqual(mockVideo);
    });

    it('should throw NotFoundError when video does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(VideoService.getById(999, 1))
        .rejects.toThrow('视频不存在');
    });

    it('should throw NotFoundError when user does not own video', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // No match because of user_id check

      await expect(VideoService.getById(1, 999))
        .rejects.toThrow('视频不存在');
    });

    it('should handle invalid videoId gracefully', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(VideoService.getById(null, 1))
        .rejects.toThrow('视频不存在');
    });
  });

  // ==================== getByShareCode ====================
  describe('getByShareCode', () => {
    it('should return video and increment view count', async () => {
      const mockVideo = { id: 1, title: '公开视频', share_code: 'ABC123', status: 'public' };
      mockQuery.mockResolvedValueOnce({ rows: [mockVideo] });
      mockQuery.mockResolvedValueOnce({ rowCount: 1 }); // view count increment

      const result = await VideoService.getByShareCode('ABC123');

      expect(result).toEqual(mockVideo);
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery).toHaveBeenLastCalledWith(
        expect.stringContaining('UPDATE teacher_videos SET view_count'),
        [mockVideo.id]
      );
    });

    it('should throw NotFoundError when share code does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(VideoService.getByShareCode('INVALID'))
        .rejects.toThrow('视频不存在');
    });

    it('should throw NotFoundError for private video share code', async () => {
      // Private videos won't be returned by the query (status = 'public' filter)
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(VideoService.getByShareCode('PRIVATE_CODE'))
        .rejects.toThrow('视频不存在');
    });

    it('should handle empty share code', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(VideoService.getByShareCode(''))
        .rejects.toThrow('视频不存在');
    });

    it('should handle null share code', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(VideoService.getByShareCode(null))
        .rejects.toThrow('视频不存在');
    });
  });

  // ==================== create ====================
  describe('create', () => {
    it('should create video with all fields', async () => {
      const videoData = {
        title: '新视频',
        description: '描述',
        filePath: '/uploads/test.mp4',
        fileSize: 1024000,
        durationSeconds: 120,
        thumbnail: '/thumbnails/test.jpg',
        grade: '一年级',
        subject: '数学'
      };
      const mockCreated = { id: 1, ...videoData, user_id: 1 };
      mockQuery.mockResolvedValueOnce({ rows: [mockCreated] });

      const result = await VideoService.create(1, videoData);

      expect(result).toEqual(mockCreated);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO teacher_videos'),
        expect.arrayContaining([1, '新视频', '描述', '/uploads/test.mp4'])
      );
    });

    it('should throw BadRequestError when title is empty', async () => {
      await expect(VideoService.create(1, { title: '', filePath: '/test.mp4' }))
        .rejects.toThrow('视频标题不能为空');
    });

    it('should throw BadRequestError when title is whitespace only', async () => {
      await expect(VideoService.create(1, { title: '   ', filePath: '/test.mp4' }))
        .rejects.toThrow('视频标题不能为空');
    });

    it('should throw BadRequestError when title is null', async () => {
      await expect(VideoService.create(1, { title: null, filePath: '/test.mp4' }))
        .rejects.toThrow('视频标题不能为空');
    });

    it('should throw BadRequestError when title is undefined', async () => {
      await expect(VideoService.create(1, { filePath: '/test.mp4' }))
        .rejects.toThrow('视频标题不能为空');
    });

    it('should throw BadRequestError when filePath is empty', async () => {
      await expect(VideoService.create(1, { title: '测试', filePath: '' }))
        .rejects.toThrow('视频文件路径不能为空');
    });

    it('should throw BadRequestError when filePath is undefined', async () => {
      await expect(VideoService.create(1, { title: '测试' }))
        .rejects.toThrow('视频文件路径不能为空');
    });

    it('should trim title before saving', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await VideoService.create(1, { title: '  标题  ', filePath: '/test.mp4' });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['标题'])
      );
    });

    it('should use empty string for missing description', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await VideoService.create(1, { title: '标题', filePath: '/test.mp4' });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([''])
      );
    });

    it('should use default values for optional fields', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await VideoService.create(1, { title: '标题', filePath: '/test.mp4' });

      // fileSize should be 0, others should be null
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        [1, '标题', '', '/test.mp4', 0, null, null, null, null]
      );
    });
  });

  // ==================== update ====================
  describe('update', () => {
    it('should update video when user owns it', async () => {
      const mockVideo = { id: 1, user_id: 1, title: '原标题' };
      mockQuery.mockResolvedValueOnce({ rows: [mockVideo] }); // verifyOwnership
      mockQuery.mockResolvedValueOnce({ rows: [{ ...mockVideo, title: '新标题' }] });

      const result = await VideoService.update(1, 1, { title: '新标题' });

      expect(result.title).toBe('新标题');
    });

    it('should throw NotFoundError when video does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(VideoService.update(999, 1, { title: '新标题' }))
        .rejects.toThrow('视频不存在');
    });

    it('should throw NotFoundError when user does not own video', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 2 }] });

      await expect(VideoService.update(1, 1, { title: '新标题' }))
        .rejects.toThrow('视频不存在');
    });

    it('should use default status private when not provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, status: 'private' }] });

      await VideoService.update(1, 1, { title: '新标题' });

      expect(mockQuery).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.arrayContaining(['private'])
      );
    });
  });

  // ==================== delete ====================
  describe('delete', () => {
    it('should delete video and return filePath', async () => {
      const mockVideo = { id: 1, user_id: 1, file_path: '/uploads/test.mp4' };
      mockQuery.mockResolvedValueOnce({ rows: [mockVideo] }); // verifyOwnership
      mockQuery.mockResolvedValueOnce({ rowCount: 1 }); // DELETE

      const result = await VideoService.delete(1, 1);

      expect(result).toEqual({
        message: '视频已删除',
        filePath: '/uploads/test.mp4'
      });
    });

    it('should throw NotFoundError when video does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(VideoService.delete(999, 1))
        .rejects.toThrow('视频不存在');
    });

    it('should throw NotFoundError when user does not own video', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 2 }] });

      await expect(VideoService.delete(1, 1))
        .rejects.toThrow('视频不存在');
    });
  });

  // ==================== publish ====================
  describe('publish', () => {
    it('should publish video and generate share code if none exists', async () => {
      const mockVideo = { id: 1, user_id: 1, share_code: null };
      mockQuery.mockResolvedValueOnce({ rows: [mockVideo] }); // verifyOwnership
      mockQuery.mockResolvedValueOnce({ rows: [{ ...mockVideo, status: 'public', share_code: 'ABC123' }] });

      const result = await VideoService.publish(1, 1);

      expect(result.status).toBe('public');
      expect(result.share_code).toBeTruthy();
    });

    it('should keep existing share code when republishing', async () => {
      const mockVideo = { id: 1, user_id: 1, share_code: 'EXISTING' };
      mockQuery.mockResolvedValueOnce({ rows: [mockVideo] });
      mockQuery.mockResolvedValueOnce({ rows: [{ ...mockVideo, status: 'public' }] });

      await VideoService.publish(1, 1);

      expect(mockQuery).toHaveBeenLastCalledWith(
        expect.any(String),
        ['EXISTING', 1]
      );
    });

    it('should throw NotFoundError when video does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(VideoService.publish(999, 1))
        .rejects.toThrow('视频不存在');
    });

    it('should throw NotFoundError when user does not own video', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 2 }] });

      await expect(VideoService.publish(1, 1))
        .rejects.toThrow('视频不存在');
    });
  });

  // ==================== unpublish ====================
  describe('unpublish', () => {
    it('should unpublish video', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] }); // verifyOwnership
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, status: 'private' }] });

      const result = await VideoService.unpublish(1, 1);

      expect(result.status).toBe('private');
    });

    it('should throw NotFoundError when video does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(VideoService.unpublish(999, 1))
        .rejects.toThrow('视频不存在');
    });
  });

  // ==================== getStorageUsage ====================
  describe('getStorageUsage', () => {
    it('should return storage usage', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ video_count: '5', total_size: '104857600' }] // 100MB
      });

      const result = await VideoService.getStorageUsage(1);

      expect(result).toEqual({
        videoCount: 5,
        totalSizeBytes: 104857600,
        totalSizeMB: 100
      });
    });

    it('should return zero usage for user with no videos', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ video_count: '0', total_size: '0' }]
      });

      const result = await VideoService.getStorageUsage(1);

      expect(result).toEqual({
        videoCount: 0,
        totalSizeBytes: 0,
        totalSizeMB: 0
      });
    });

    it('should handle null total_size (COALESCE returns 0)', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ video_count: '0', total_size: '0' }]
      });

      const result = await VideoService.getStorageUsage(999);

      expect(result.totalSizeBytes).toBe(0);
    });
  });

  // ==================== verifyOwnership ====================
  describe('verifyOwnership', () => {
    it('should return video when user owns it', async () => {
      const mockVideo = { id: 1, user_id: 1, title: '我的视频' };
      mockQuery.mockResolvedValueOnce({ rows: [mockVideo] });

      const result = await VideoService.verifyOwnership(1, 1);

      expect(result).toEqual(mockVideo);
    });

    it('should throw NotFoundError when video does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(VideoService.verifyOwnership(999, 1))
        .rejects.toThrow('视频不存在');
    });

    it('should throw NotFoundError when user does not own video (security)', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 2 }] });

      // Returns NotFoundError instead of ForbiddenError for security
      await expect(VideoService.verifyOwnership(1, 1))
        .rejects.toThrow('视频不存在');
    });
  });

  // ==================== getRelatedVideos ====================
  describe('getRelatedVideos', () => {
    it('should return related videos by subject and grade', async () => {
      const currentVideo = { id: 1, user_id: 1, subject: '数学', grade: '一年级' };
      const relatedVideos = [
        { id: 2, subject: '数学', grade: '一年级' },
        { id: 3, subject: '数学', grade: '二年级' },
        { id: 4, subject: '数学', grade: '三年级' },
        { id: 5, subject: '数学', grade: '四年级' },
        { id: 6, subject: '数学', grade: '五年级' },
        { id: 7, subject: '数学', grade: '六年级' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: [currentVideo] });
      mockQuery.mockResolvedValueOnce({ rows: relatedVideos }); // Enough videos, no need for more

      const result = await VideoService.getRelatedVideos(1);

      expect(result).toEqual(relatedVideos);
    });

    it('should return empty array when video does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await VideoService.getRelatedVideos(999);

      expect(result).toEqual([]);
    });

    it('should fetch more videos if not enough related', async () => {
      const currentVideo = { id: 1, user_id: 1, subject: '数学', grade: '一年级' };
      mockQuery.mockResolvedValueOnce({ rows: [currentVideo] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 2 }] }); // Only 1 related
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 3 }, { id: 4 }] }); // More from user

      const result = await VideoService.getRelatedVideos(1, 6);

      expect(mockQuery).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);
    });

    it('should respect limit parameter', async () => {
      const currentVideo = { id: 1, user_id: 1, subject: '数学', grade: '一年级' };
      const relatedVideos = [
        { id: 2 }, { id: 3 }, { id: 4 }
      ];
      mockQuery.mockResolvedValueOnce({ rows: [currentVideo] });
      mockQuery.mockResolvedValueOnce({ rows: relatedVideos }); // Exactly 3 videos

      const result = await VideoService.getRelatedVideos(1, 3);

      expect(result).toHaveLength(3);
      expect(mockQuery).toHaveBeenNthCalledWith(2,
        expect.any(String),
        expect.arrayContaining([3]) // limit
      );
    });
  });

  // ==================== Comments ====================
  describe('getComments', () => {
    it('should return nested comments with replies', async () => {
      const mockComments = [
        { id: 1, content: '主评论', parent_id: null },
        { id: 2, content: '回复', parent_id: 1 }
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockComments });

      const result = await VideoService.getComments(1);

      expect(result).toHaveLength(1);
      expect(result[0].replies).toHaveLength(1);
      expect(result[0].replies[0].content).toBe('回复');
    });

    it('should return empty array when no comments', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await VideoService.getComments(1);

      expect(result).toEqual([]);
    });

    it('should handle multiple top-level comments', async () => {
      const mockComments = [
        { id: 1, content: '评论1', parent_id: null },
        { id: 2, content: '评论2', parent_id: null },
        { id: 3, content: '回复1', parent_id: 1 }
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockComments });

      const result = await VideoService.getComments(1);

      expect(result).toHaveLength(2);
      expect(result[0].replies).toHaveLength(1);
      expect(result[1].replies).toHaveLength(0);
    });
  });

  describe('addComment', () => {
    it('should add a comment', async () => {
      const mockComment = { id: 1, content: '好视频', video_id: 1 };
      mockQuery.mockResolvedValueOnce({ rows: [mockComment] });

      const result = await VideoService.addComment(1, 1, '张三', '好视频');

      expect(result).toEqual(mockComment);
    });

    it('should throw BadRequestError when content is empty', async () => {
      await expect(VideoService.addComment(1, 1, '张三', ''))
        .rejects.toThrow('评论内容不能为空');
    });

    it('should throw BadRequestError when content is whitespace only', async () => {
      await expect(VideoService.addComment(1, 1, '张三', '   '))
        .rejects.toThrow('评论内容不能为空');
    });

    it('should throw BadRequestError when content is null', async () => {
      await expect(VideoService.addComment(1, 1, '张三', null))
        .rejects.toThrow('评论内容不能为空');
    });

    it('should trim content before saving', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await VideoService.addComment(1, 1, '张三', '  评论内容  ');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['评论内容'])
      );
    });

    it('should support reply with parentId', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 2 }] });

      await VideoService.addComment(1, 1, '张三', '回复', 1);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        [1, 1, '张三', '回复', 1]
      );
    });
  });

  describe('deleteComment', () => {
    it('should allow comment owner to delete', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, user_id: 1, video_owner_id: 2 }]
      });
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const result = await VideoService.deleteComment(1, 1);

      expect(result).toEqual({ message: '评论已删除' });
    });

    it('should allow video owner to delete any comment', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, user_id: 2, video_owner_id: 1 }]
      });
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const result = await VideoService.deleteComment(1, 1);

      expect(result).toEqual({ message: '评论已删除' });
    });

    it('should throw NotFoundError when comment does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(VideoService.deleteComment(999, 1))
        .rejects.toThrow('评论不存在');
    });

    it('should throw BadRequestError when user has no permission', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, user_id: 2, video_owner_id: 3 }]
      });

      await expect(VideoService.deleteComment(1, 1))
        .rejects.toThrow('无权删除此评论');
    });
  });

  // ==================== Danmaku ====================
  describe('getDanmaku', () => {
    it('should return danmaku ordered by time', async () => {
      const mockDanmaku = [
        { id: 1, content: '弹幕1', time_seconds: 10 },
        { id: 2, content: '弹幕2', time_seconds: 20 }
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockDanmaku });

      const result = await VideoService.getDanmaku(1);

      expect(result).toEqual(mockDanmaku);
    });

    it('should return empty array when no danmaku', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await VideoService.getDanmaku(1);

      expect(result).toEqual([]);
    });
  });

  describe('addDanmaku', () => {
    it('should add danmaku with color', async () => {
      const mockDanmaku = { id: 1, content: '弹幕', time_seconds: 10, color: '#FF0000' };
      mockQuery.mockResolvedValueOnce({ rows: [mockDanmaku] });

      const result = await VideoService.addDanmaku(1, 1, '弹幕', 10, '#FF0000');

      expect(result).toEqual(mockDanmaku);
    });

    it('should use default white color', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await VideoService.addDanmaku(1, 1, '弹幕', 10);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        [1, 1, '弹幕', 10, '#FFFFFF']
      );
    });

    it('should throw BadRequestError when content is empty', async () => {
      await expect(VideoService.addDanmaku(1, 1, '', 10))
        .rejects.toThrow('弹幕内容不能为空');
    });

    it('should throw BadRequestError when content is whitespace only', async () => {
      await expect(VideoService.addDanmaku(1, 1, '   ', 10))
        .rejects.toThrow('弹幕内容不能为空');
    });

    it('should throw BadRequestError when content exceeds 100 characters', async () => {
      const longContent = 'a'.repeat(101);

      await expect(VideoService.addDanmaku(1, 1, longContent, 10))
        .rejects.toThrow('弹幕内容不能超过100字');
    });

    it('should allow content with exactly 100 characters', async () => {
      const content = 'a'.repeat(100);
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await expect(VideoService.addDanmaku(1, 1, content, 10))
        .resolves.toBeDefined();
    });

    it('should trim content before saving', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await VideoService.addDanmaku(1, 1, '  弹幕内容  ', 10);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['弹幕内容'])
      );
    });
  });

  // ==================== generateShareCode ====================
  describe('generateShareCode', () => {
    it('should generate 12 character hex code', () => {
      const code = VideoService.generateShareCode();

      expect(code).toHaveLength(12);
      expect(code).toMatch(/^[A-F0-9]+$/);
    });

    it('should generate unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(VideoService.generateShareCode());
      }
      expect(codes.size).toBe(100);
    });
  });
});
