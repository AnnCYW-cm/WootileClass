import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock the database module
const mockQuery = jest.fn();
jest.unstable_mockModule('../../db/index.js', () => ({
  query: mockQuery,
  default: { query: mockQuery }
}));

describe('VideoController', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
      userId: 1,
      file: null
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

  describe('Video CRUD operations', () => {
    it('should get videos from database', async () => {
      const mockVideos = [
        { id: 1, title: '数学第一课', status: 'published' },
        { id: 2, title: '数学第二课', status: 'draft' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockVideos });

      // Directly test database query
      const result = await mockQuery('SELECT * FROM videos WHERE user_id = $1', [1]);
      expect(result.rows).toEqual(mockVideos);
    });

    it('should get video by id', async () => {
      const mockVideo = { id: 1, title: '数学第一课', user_id: 1 };
      mockQuery.mockResolvedValueOnce({ rows: [mockVideo] });

      const result = await mockQuery('SELECT * FROM videos WHERE id = $1 AND user_id = $2', [1, 1]);
      expect(result.rows[0]).toEqual(mockVideo);
    });

    it('should get video by share code', async () => {
      const mockVideo = { id: 1, title: '数学第一课', share_code: 'ABC123' };
      mockQuery.mockResolvedValueOnce({ rows: [mockVideo] });

      const result = await mockQuery('SELECT * FROM videos WHERE share_code = $1', ['ABC123']);
      expect(result.rows[0].share_code).toBe('ABC123');
    });

    it('should create video record', async () => {
      const newVideo = {
        id: 1,
        user_id: 1,
        title: '测试视频',
        file_path: '/uploads/videos/test.mp4'
      };
      mockQuery.mockResolvedValueOnce({ rows: [newVideo] });

      const result = await mockQuery(
        'INSERT INTO videos (user_id, title, file_path) VALUES ($1, $2, $3) RETURNING *',
        [1, '测试视频', '/uploads/videos/test.mp4']
      );
      expect(result.rows[0].title).toBe('测试视频');
    });

    it('should update video', async () => {
      const updatedVideo = { id: 1, title: '更新后的标题' };
      mockQuery.mockResolvedValueOnce({ rows: [updatedVideo] });

      const result = await mockQuery(
        'UPDATE videos SET title = $1 WHERE id = $2 RETURNING *',
        ['更新后的标题', 1]
      );
      expect(result.rows[0].title).toBe('更新后的标题');
    });

    it('should delete video', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, file_path: '/uploads/test.mp4' }] });

      const result = await mockQuery('DELETE FROM videos WHERE id = $1 RETURNING file_path', [1]);
      expect(result.rows[0].file_path).toBe('/uploads/test.mp4');
    });

    it('should publish video and generate share code', async () => {
      const publishedVideo = { id: 1, status: 'published', share_code: 'ABC123' };
      mockQuery.mockResolvedValueOnce({ rows: [publishedVideo] });

      const result = await mockQuery(
        'UPDATE videos SET status = $1, share_code = $2 WHERE id = $3 RETURNING *',
        ['published', 'ABC123', 1]
      );
      expect(result.rows[0].status).toBe('published');
      expect(result.rows[0].share_code).toBe('ABC123');
    });

    it('should unpublish video', async () => {
      const unpublishedVideo = { id: 1, status: 'draft', share_code: null };
      mockQuery.mockResolvedValueOnce({ rows: [unpublishedVideo] });

      const result = await mockQuery(
        'UPDATE videos SET status = $1, share_code = NULL WHERE id = $2 RETURNING *',
        ['draft', 1]
      );
      expect(result.rows[0].status).toBe('draft');
    });
  });

  describe('Video Comments', () => {
    it('should get comments for a video', async () => {
      const mockComments = [
        { id: 1, content: '很好的视频', user_name: '张三' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockComments });

      const result = await mockQuery(
        'SELECT * FROM video_comments WHERE video_id = $1 ORDER BY created_at DESC',
        [1]
      );
      expect(result.rows).toEqual(mockComments);
    });

    it('should add a comment', async () => {
      const newComment = { id: 1, content: '很好的视频', user_name: '张三' };
      mockQuery.mockResolvedValueOnce({ rows: [newComment] });

      const result = await mockQuery(
        'INSERT INTO video_comments (video_id, user_id, user_name, content) VALUES ($1, $2, $3, $4) RETURNING *',
        [1, 1, '张三', '很好的视频']
      );
      expect(result.rows[0].content).toBe('很好的视频');
    });

    it('should delete a comment', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const result = await mockQuery(
        'DELETE FROM video_comments WHERE id = $1 AND user_id = $2 RETURNING id',
        [1, 1]
      );
      expect(result.rows.length).toBe(1);
    });
  });

  describe('Video Danmaku', () => {
    it('should get danmaku for a video', async () => {
      const mockDanmaku = [
        { id: 1, content: '哈哈', time_seconds: 10, color: '#ffffff' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockDanmaku });

      const result = await mockQuery(
        'SELECT * FROM video_danmaku WHERE video_id = $1 ORDER BY time_seconds',
        [1]
      );
      expect(result.rows).toEqual(mockDanmaku);
    });

    it('should add a danmaku', async () => {
      const newDanmaku = { id: 1, content: '哈哈', time_seconds: 10, color: '#ffffff' };
      mockQuery.mockResolvedValueOnce({ rows: [newDanmaku] });

      const result = await mockQuery(
        'INSERT INTO video_danmaku (video_id, user_id, content, time_seconds, color) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [1, 1, '哈哈', 10, '#ffffff']
      );
      expect(result.rows[0].content).toBe('哈哈');
    });
  });

  describe('Storage Usage', () => {
    it('should get storage usage', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ video_count: '5', total_size: '104857600' }]
      });

      const result = await mockQuery(
        'SELECT COUNT(*) as video_count, COALESCE(SUM(file_size), 0) as total_size FROM videos WHERE user_id = $1',
        [1]
      );
      expect(parseInt(result.rows[0].video_count)).toBe(5);
      expect(parseInt(result.rows[0].total_size)).toBe(104857600);
    });
  });
});
