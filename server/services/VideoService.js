import { query } from '../db/index.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import crypto from 'crypto';

/**
 * Video Service - Business logic for teacher video operations
 */
export class VideoService {
  /**
   * Generate a unique share code
   */
  static generateShareCode() {
    return crypto.randomBytes(6).toString('hex').toUpperCase();
  }

  /**
   * Get all videos for a user
   */
  static async getAll(userId, filters = {}) {
    let queryText = `
      SELECT * FROM teacher_videos
      WHERE user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    if (filters.grade) {
      queryText += ` AND grade = $${paramIndex}`;
      params.push(filters.grade);
      paramIndex++;
    }

    if (filters.subject) {
      queryText += ` AND subject = $${paramIndex}`;
      params.push(filters.subject);
      paramIndex++;
    }

    if (filters.status) {
      queryText += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);
    return result.rows;
  }

  /**
   * Get a single video by ID
   */
  static async getById(videoId, userId) {
    const result = await query(
      `SELECT * FROM teacher_videos WHERE id = $1 AND user_id = $2`,
      [videoId, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('视频');
    }

    return result.rows[0];
  }

  /**
   * Get video by share code (public access)
   */
  static async getByShareCode(shareCode) {
    const result = await query(
      `SELECT * FROM teacher_videos WHERE share_code = $1 AND status = 'public'`,
      [shareCode]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('视频');
    }

    // Increment view count
    await query(
      'UPDATE teacher_videos SET view_count = view_count + 1 WHERE id = $1',
      [result.rows[0].id]
    );

    return result.rows[0];
  }

  /**
   * Create a new video record
   */
  static async create(userId, data) {
    const {
      title,
      description,
      filePath,
      fileSize,
      durationSeconds,
      thumbnail,
      grade,
      subject
    } = data;

    if (!title || !title.trim()) {
      throw new BadRequestError('视频标题不能为空');
    }

    if (!filePath) {
      throw new BadRequestError('视频文件路径不能为空');
    }

    const result = await query(
      `INSERT INTO teacher_videos
        (user_id, title, description, file_path, file_size, duration_seconds, thumbnail, grade, subject)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        userId,
        title.trim(),
        description || '',
        filePath,
        fileSize || 0,
        durationSeconds || null,
        thumbnail || null,
        grade || null,
        subject || null
      ]
    );

    return result.rows[0];
  }

  /**
   * Update a video
   */
  static async update(videoId, userId, data) {
    await this.verifyOwnership(videoId, userId);

    const { title, description, grade, subject, thumbnail, status } = data;

    const result = await query(
      `UPDATE teacher_videos
       SET title = $1, description = $2, grade = $3, subject = $4,
           thumbnail = $5, status = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [title, description, grade, subject, thumbnail, status || 'private', videoId]
    );

    return result.rows[0];
  }

  /**
   * Delete a video
   */
  static async delete(videoId, userId) {
    const video = await this.verifyOwnership(videoId, userId);
    await query('DELETE FROM teacher_videos WHERE id = $1', [videoId]);
    return { message: '视频已删除', filePath: video.file_path };
  }

  /**
   * Publish a video (generate share code)
   */
  static async publish(videoId, userId) {
    const video = await this.verifyOwnership(videoId, userId);

    let shareCode = video.share_code;
    if (!shareCode) {
      shareCode = this.generateShareCode();
    }

    const result = await query(
      `UPDATE teacher_videos
       SET status = 'public', share_code = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [shareCode, videoId]
    );

    return result.rows[0];
  }

  /**
   * Unpublish a video
   */
  static async unpublish(videoId, userId) {
    await this.verifyOwnership(videoId, userId);

    const result = await query(
      `UPDATE teacher_videos
       SET status = 'private', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [videoId]
    );

    return result.rows[0];
  }

  /**
   * Get user's video storage usage
   */
  static async getStorageUsage(userId) {
    const result = await query(
      `SELECT
        COUNT(*) as video_count,
        COALESCE(SUM(file_size), 0) as total_size
       FROM teacher_videos
       WHERE user_id = $1`,
      [userId]
    );

    return {
      videoCount: parseInt(result.rows[0].video_count),
      totalSizeBytes: parseInt(result.rows[0].total_size),
      totalSizeMB: Math.round(parseInt(result.rows[0].total_size) / (1024 * 1024) * 100) / 100
    };
  }

  /**
   * Verify video ownership
   */
  static async verifyOwnership(videoId, userId) {
    const result = await query(
      'SELECT * FROM teacher_videos WHERE id = $1',
      [videoId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('视频');
    }

    if (result.rows[0].user_id !== userId) {
      throw new NotFoundError('视频');
    }

    return result.rows[0];
  }

  /**
   * Get related videos (same subject/grade or same user)
   */
  static async getRelatedVideos(videoId, limit = 6) {
    // First get the current video's info
    const videoResult = await query(
      'SELECT * FROM teacher_videos WHERE id = $1',
      [videoId]
    );

    if (videoResult.rows.length === 0) {
      return [];
    }

    const video = videoResult.rows[0];

    // Get related videos: same subject or same grade, excluding current video
    const result = await query(
      `SELECT * FROM teacher_videos
       WHERE id != $1
         AND user_id = $2
         AND (subject = $3 OR grade = $4)
       ORDER BY
         CASE
           WHEN subject = $3 AND grade = $4 THEN 1
           WHEN subject = $3 THEN 2
           WHEN grade = $4 THEN 3
           ELSE 4
         END,
         created_at DESC
       LIMIT $5`,
      [videoId, video.user_id, video.subject, video.grade, limit]
    );

    // If not enough related videos, get more from the same user
    if (result.rows.length < limit) {
      const moreResult = await query(
        `SELECT * FROM teacher_videos
         WHERE id != $1
           AND user_id = $2
           AND id NOT IN (SELECT unnest($3::int[]))
         ORDER BY created_at DESC
         LIMIT $4`,
        [videoId, video.user_id, result.rows.map(r => r.id), limit - result.rows.length]
      );
      result.rows.push(...moreResult.rows);
    }

    return result.rows;
  }

  /**
   * Get comments for a video
   */
  static async getComments(videoId) {
    const result = await query(
      `SELECT
        vc.*,
        u.name as author_name
       FROM video_comments vc
       LEFT JOIN users u ON vc.user_id = u.id
       WHERE vc.video_id = $1
       ORDER BY vc.created_at DESC`,
      [videoId]
    );

    // Build nested structure for replies
    const comments = result.rows.filter(c => !c.parent_id);
    const replies = result.rows.filter(c => c.parent_id);

    comments.forEach(comment => {
      comment.replies = replies.filter(r => r.parent_id === comment.id);
    });

    return comments;
  }

  /**
   * Add a comment to a video
   */
  static async addComment(videoId, userId, userName, content, parentId = null) {
    if (!content || !content.trim()) {
      throw new BadRequestError('评论内容不能为空');
    }

    const result = await query(
      `INSERT INTO video_comments (video_id, user_id, user_name, content, parent_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [videoId, userId, userName, content.trim(), parentId]
    );

    return result.rows[0];
  }

  /**
   * Delete a comment
   */
  static async deleteComment(commentId, userId) {
    // Only allow comment owner or video owner to delete
    const commentResult = await query(
      `SELECT vc.*, tv.user_id as video_owner_id
       FROM video_comments vc
       JOIN teacher_videos tv ON vc.video_id = tv.id
       WHERE vc.id = $1`,
      [commentId]
    );

    if (commentResult.rows.length === 0) {
      throw new NotFoundError('评论');
    }

    const comment = commentResult.rows[0];
    if (comment.user_id !== userId && comment.video_owner_id !== userId) {
      throw new BadRequestError('无权删除此评论');
    }

    await query('DELETE FROM video_comments WHERE id = $1', [commentId]);
    return { message: '评论已删除' };
  }

  /**
   * Get danmaku (弹幕) for a video
   */
  static async getDanmaku(videoId) {
    const result = await query(
      `SELECT id, content, time_seconds, color
       FROM video_danmaku
       WHERE video_id = $1
       ORDER BY time_seconds ASC`,
      [videoId]
    );
    return result.rows;
  }

  /**
   * Add a danmaku
   */
  static async addDanmaku(videoId, userId, content, timeSeconds, color = '#FFFFFF') {
    if (!content || !content.trim()) {
      throw new BadRequestError('弹幕内容不能为空');
    }

    if (content.length > 100) {
      throw new BadRequestError('弹幕内容不能超过100字');
    }

    const result = await query(
      `INSERT INTO video_danmaku (video_id, user_id, content, time_seconds, color)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [videoId, userId, content.trim(), timeSeconds, color]
    );

    return result.rows[0];
  }
}
