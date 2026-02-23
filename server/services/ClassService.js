import { query } from '../db/index.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

/**
 * Class Service - Business logic for class operations
 */
export class ClassService {
  /**
   * Get all classes for a user
   */
  static async getAll(userId, status = null) {
    let queryText = `
      SELECT c.*, COUNT(s.id) as student_count
      FROM classes c
      LEFT JOIN students s ON c.id = s.class_id
      WHERE c.user_id = $1
    `;
    const params = [userId];

    if (status) {
      queryText += ' AND c.status = $2';
      params.push(status);
    }

    queryText += ' GROUP BY c.id ORDER BY c.status ASC, c.created_at DESC';

    const result = await query(queryText, params);
    return result.rows;
  }

  /**
   * Get a single class by ID
   */
  static async getById(classId, userId) {
    const result = await query(
      `SELECT c.*, COUNT(s.id) as student_count
       FROM classes c
       LEFT JOIN students s ON c.id = s.class_id
       WHERE c.id = $1 AND c.user_id = $2
       GROUP BY c.id`,
      [classId, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('班级');
    }

    return result.rows[0];
  }

  /**
   * Create a new class
   */
  static async create(userId, data) {
    const { name, grade, subject } = data;

    if (!name || !name.trim()) {
      throw new BadRequestError('班级名称不能为空');
    }

    const result = await query(
      'INSERT INTO classes (user_id, name, grade, subject) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, name.trim(), grade || '', subject || '']
    );

    return result.rows[0];
  }

  /**
   * Update a class
   */
  static async update(classId, userId, data) {
    const { name, grade, subject, status } = data;

    // Verify ownership
    await this.verifyOwnership(classId, userId);

    const result = await query(
      'UPDATE classes SET name = $1, grade = $2, subject = $3, status = $4 WHERE id = $5 RETURNING *',
      [name, grade, subject, status || 'active', classId]
    );

    return result.rows[0];
  }

  /**
   * Delete a class
   */
  static async delete(classId, userId) {
    // Verify ownership
    await this.verifyOwnership(classId, userId);

    await query('DELETE FROM classes WHERE id = $1', [classId]);
    return { message: '班级已删除' };
  }

  /**
   * Toggle archive status
   */
  static async toggleArchive(classId, userId) {
    const cls = await this.verifyOwnership(classId, userId);

    const newStatus = cls.status === 'archived' ? 'active' : 'archived';
    const result = await query(
      'UPDATE classes SET status = $1 WHERE id = $2 RETURNING *',
      [newStatus, classId]
    );

    return result.rows[0];
  }

  /**
   * Verify class ownership
   */
  static async verifyOwnership(classId, userId) {
    const result = await query(
      'SELECT id, status, user_id FROM classes WHERE id = $1',
      [classId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('班级');
    }

    if (result.rows[0].user_id !== userId) {
      throw new NotFoundError('班级'); // Return 404 instead of 403 for security
    }

    return result.rows[0];
  }
}
