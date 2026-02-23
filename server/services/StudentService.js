import { query } from '../db/index.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import * as XLSX from 'xlsx';
import { ClassService } from './ClassService.js';

/**
 * Student Service - Business logic for student operations
 */
export class StudentService {
  /**
   * Get all students in a class
   */
  static async getByClass(classId, userId) {
    // Verify class ownership
    await ClassService.verifyOwnership(classId, userId);

    const result = await query(
      'SELECT * FROM students WHERE class_id = $1 ORDER BY student_no, name',
      [classId]
    );

    return result.rows;
  }

  /**
   * Get a single student by ID
   */
  static async getById(studentId, userId) {
    const result = await query(
      `SELECT s.*, c.user_id
       FROM students s
       JOIN classes c ON s.class_id = c.id
       WHERE s.id = $1`,
      [studentId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('学生');
    }

    if (result.rows[0].user_id !== userId) {
      throw new NotFoundError('学生');
    }

    return result.rows[0];
  }

  /**
   * Add a new student to a class
   */
  static async create(classId, userId, data) {
    const { name, student_no, gender } = data;

    if (!name || !name.trim()) {
      throw new BadRequestError('学生姓名不能为空');
    }

    // Verify class ownership
    await ClassService.verifyOwnership(classId, userId);

    const result = await query(
      'INSERT INTO students (class_id, name, student_no, gender) VALUES ($1, $2, $3, $4) RETURNING *',
      [classId, name.trim(), student_no || '', gender || '']
    );

    return result.rows[0];
  }

  /**
   * Update a student
   */
  static async update(studentId, userId, data) {
    const { name, student_no, gender } = data;

    // Verify ownership
    await this.verifyOwnership(studentId, userId);

    const result = await query(
      'UPDATE students SET name = $1, student_no = $2, gender = $3 WHERE id = $4 RETURNING *',
      [name, student_no, gender, studentId]
    );

    return result.rows[0];
  }

  /**
   * Delete a student
   */
  static async delete(studentId, userId) {
    // Verify ownership
    await this.verifyOwnership(studentId, userId);

    await query('DELETE FROM students WHERE id = $1', [studentId]);
    return { message: '学生已删除' };
  }

  /**
   * Import students from Excel file
   */
  static async importFromExcel(classId, userId, fileBuffer) {
    // Verify class ownership
    await ClassService.verifyOwnership(classId, userId);

    // Parse Excel file
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      throw new BadRequestError('Excel文件中没有数据');
    }

    const students = [];
    for (const row of data) {
      // Support different column names
      const name = row['姓名'] || row['name'] || row['Name'] || '';
      const studentNo = row['学号'] || row['student_no'] || row['StudentNo'] || '';
      const gender = row['性别'] || row['gender'] || row['Gender'] || '';

      if (name) {
        const result = await query(
          'INSERT INTO students (class_id, name, student_no, gender) VALUES ($1, $2, $3, $4) RETURNING *',
          [classId, name, studentNo, gender]
        );
        students.push(result.rows[0]);
      }
    }

    return {
      message: `成功导入 ${students.length} 名学生`,
      students
    };
  }

  /**
   * Verify student ownership through class
   */
  static async verifyOwnership(studentId, userId) {
    const result = await query(
      `SELECT s.id, s.class_id, c.user_id
       FROM students s
       JOIN classes c ON s.class_id = c.id
       WHERE s.id = $1`,
      [studentId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('学生');
    }

    if (result.rows[0].user_id !== userId) {
      throw new NotFoundError('学生');
    }

    return result.rows[0];
  }
}
