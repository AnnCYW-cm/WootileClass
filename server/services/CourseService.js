import { query } from '../db/index.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import crypto from 'crypto';

/**
 * Course Service - Business logic for course operations
 */
export class CourseService {
  /**
   * Generate a unique share code
   */
  static generateShareCode() {
    return crypto.randomBytes(6).toString('hex').toUpperCase();
  }

  /**
   * Get all courses for a user
   */
  static async getAll(userId, status = null) {
    let queryText = `
      SELECT c.*,
             COUNT(DISTINCT cs.id) as section_count,
             COUNT(DISTINCT a.id) as animation_count
      FROM courses c
      LEFT JOIN course_sections cs ON c.id = cs.course_id
      LEFT JOIN animations a ON cs.id = a.section_id
      WHERE c.user_id = $1
    `;
    const params = [userId];

    if (status) {
      queryText += ' AND c.status = $2';
      params.push(status);
    }

    queryText += ' GROUP BY c.id ORDER BY c.created_at DESC';

    const result = await query(queryText, params);
    return result.rows;
  }

  /**
   * Get a single course by ID with sections and animations
   */
  static async getById(courseId, userId) {
    // Get course
    const courseResult = await query(
      `SELECT * FROM courses WHERE id = $1 AND user_id = $2`,
      [courseId, userId]
    );

    if (courseResult.rows.length === 0) {
      throw new NotFoundError('课程');
    }

    const course = courseResult.rows[0];

    // Get sections with animations
    const sectionsResult = await query(
      `SELECT cs.*,
              COALESCE(json_agg(
                json_build_object(
                  'id', a.id,
                  'title', a.title,
                  'description', a.description,
                  'type', a.type,
                  'source_url', a.source_url,
                  'thumbnail', a.thumbnail,
                  'duration_seconds', a.duration_seconds,
                  'config', a.config,
                  'sort_order', a.sort_order
                ) ORDER BY a.sort_order
              ) FILTER (WHERE a.id IS NOT NULL), '[]') as animations
       FROM course_sections cs
       LEFT JOIN animations a ON cs.id = a.section_id
       WHERE cs.course_id = $1
       GROUP BY cs.id
       ORDER BY cs.sort_order`,
      [courseId]
    );

    course.sections = sectionsResult.rows;
    return course;
  }

  /**
   * Get course by share code (public access)
   */
  static async getByShareCode(shareCode) {
    const result = await query(
      `SELECT * FROM courses WHERE share_code = $1 AND status = 'published'`,
      [shareCode]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('课程');
    }

    const course = result.rows[0];

    // Increment view count
    await query(
      'UPDATE courses SET view_count = view_count + 1 WHERE id = $1',
      [course.id]
    );

    // Get sections with animations
    const sectionsResult = await query(
      `SELECT cs.*,
              COALESCE(json_agg(
                json_build_object(
                  'id', a.id,
                  'title', a.title,
                  'description', a.description,
                  'type', a.type,
                  'source_url', a.source_url,
                  'thumbnail', a.thumbnail,
                  'duration_seconds', a.duration_seconds,
                  'config', a.config,
                  'sort_order', a.sort_order
                ) ORDER BY a.sort_order
              ) FILTER (WHERE a.id IS NOT NULL), '[]') as animations
       FROM course_sections cs
       LEFT JOIN animations a ON cs.id = a.section_id
       WHERE cs.course_id = $1
       GROUP BY cs.id
       ORDER BY cs.sort_order`,
      [course.id]
    );

    course.sections = sectionsResult.rows;
    return course;
  }

  /**
   * Create a new course
   */
  static async create(userId, data) {
    const { title, description, grade, subject, classId, coverImage } = data;

    if (!title || !title.trim()) {
      throw new BadRequestError('课程标题不能为空');
    }

    const result = await query(
      `INSERT INTO courses (user_id, class_id, title, description, grade, subject, cover_image)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, classId || null, title.trim(), description || '', grade || '', subject || '', coverImage || null]
    );

    return result.rows[0];
  }

  /**
   * Update a course
   */
  static async update(courseId, userId, data) {
    await this.verifyOwnership(courseId, userId);

    const { title, description, grade, subject, classId, coverImage, status } = data;

    const result = await query(
      `UPDATE courses
       SET title = $1, description = $2, grade = $3, subject = $4, class_id = $5,
           cover_image = $6, status = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [title, description, grade, subject, classId || null, coverImage, status || 'draft', courseId]
    );

    return result.rows[0];
  }

  /**
   * Delete a course
   */
  static async delete(courseId, userId) {
    await this.verifyOwnership(courseId, userId);
    await query('DELETE FROM courses WHERE id = $1', [courseId]);
    return { message: '课程已删除' };
  }

  /**
   * Publish a course (generate share code)
   */
  static async publish(courseId, userId) {
    const course = await this.verifyOwnership(courseId, userId);

    let shareCode = course.share_code;
    if (!shareCode) {
      shareCode = this.generateShareCode();
    }

    const result = await query(
      `UPDATE courses SET status = 'published', share_code = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [shareCode, courseId]
    );

    return result.rows[0];
  }

  /**
   * Unpublish a course
   */
  static async unpublish(courseId, userId) {
    await this.verifyOwnership(courseId, userId);

    const result = await query(
      `UPDATE courses SET status = 'draft', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [courseId]
    );

    return result.rows[0];
  }

  /**
   * Verify course ownership
   */
  static async verifyOwnership(courseId, userId) {
    const result = await query(
      'SELECT * FROM courses WHERE id = $1',
      [courseId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('课程');
    }

    if (result.rows[0].user_id !== userId) {
      throw new NotFoundError('课程');
    }

    return result.rows[0];
  }

  // ============ Section Methods ============

  /**
   * Create a section
   */
  static async createSection(courseId, userId, data) {
    await this.verifyOwnership(courseId, userId);

    const { title } = data;
    if (!title || !title.trim()) {
      throw new BadRequestError('章节标题不能为空');
    }

    // Get max sort_order
    const maxOrderResult = await query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM course_sections WHERE course_id = $1',
      [courseId]
    );
    const sortOrder = maxOrderResult.rows[0].next_order;

    const result = await query(
      'INSERT INTO course_sections (course_id, title, sort_order) VALUES ($1, $2, $3) RETURNING *',
      [courseId, title.trim(), sortOrder]
    );

    return result.rows[0];
  }

  /**
   * Update a section
   */
  static async updateSection(courseId, sectionId, userId, data) {
    await this.verifyOwnership(courseId, userId);

    const { title } = data;

    const result = await query(
      'UPDATE course_sections SET title = $1 WHERE id = $2 AND course_id = $3 RETURNING *',
      [title, sectionId, courseId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('章节');
    }

    return result.rows[0];
  }

  /**
   * Delete a section
   */
  static async deleteSection(courseId, sectionId, userId) {
    await this.verifyOwnership(courseId, userId);

    const result = await query(
      'DELETE FROM course_sections WHERE id = $1 AND course_id = $2 RETURNING id',
      [sectionId, courseId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('章节');
    }

    return { message: '章节已删除' };
  }

  /**
   * Reorder sections
   */
  static async reorderSections(courseId, userId, sectionIds) {
    await this.verifyOwnership(courseId, userId);

    for (let i = 0; i < sectionIds.length; i++) {
      await query(
        'UPDATE course_sections SET sort_order = $1 WHERE id = $2 AND course_id = $3',
        [i, sectionIds[i], courseId]
      );
    }

    return { message: '排序已更新' };
  }

  // ============ Comment Methods ============

  /**
   * Get comments for a course
   */
  static async getComments(courseId) {
    const result = await query(
      `SELECT cc.*, u.name as user_name
       FROM course_comments cc
       JOIN users u ON cc.user_id = u.id
       WHERE cc.course_id = $1
       ORDER BY cc.created_at DESC`,
      [courseId]
    );
    return result.rows;
  }

  /**
   * Create a comment
   */
  static async createComment(courseId, userId, content, parentId = null) {
    if (!content || !content.trim()) {
      throw new BadRequestError('评论内容不能为空');
    }

    const result = await query(
      `INSERT INTO course_comments (course_id, user_id, content, parent_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [courseId, userId, content.trim(), parentId]
    );

    // Get the comment with user info
    const commentResult = await query(
      `SELECT cc.*, u.name as user_name
       FROM course_comments cc
       JOIN users u ON cc.user_id = u.id
       WHERE cc.id = $1`,
      [result.rows[0].id]
    );

    return commentResult.rows[0];
  }

  /**
   * Delete a comment
   */
  static async deleteComment(commentId, userId) {
    const result = await query(
      'SELECT * FROM course_comments WHERE id = $1',
      [commentId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('评论');
    }

    // Only allow owner to delete
    if (result.rows[0].user_id !== userId) {
      throw new BadRequestError('无权删除此评论');
    }

    await query('DELETE FROM course_comments WHERE id = $1', [commentId]);
    return { message: '评论已删除' };
  }
}
