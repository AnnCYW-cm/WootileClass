import { query } from '../db/index.js';
import * as XLSX from 'xlsx';

export const getStudents = async (req, res) => {
  try {
    const { classId } = req.params;

    // Check ownership
    const checkResult = await query('SELECT id FROM classes WHERE id = $1 AND user_id = $2', [classId, req.userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    const result = await query(
      'SELECT * FROM students WHERE class_id = $1 ORDER BY student_no, name',
      [classId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: '获取学生列表失败' });
  }
};

export const addStudent = async (req, res) => {
  try {
    const { classId } = req.params;
    const { name, student_no, gender } = req.body;

    if (!name) {
      return res.status(400).json({ error: '学生姓名不能为空' });
    }

    // Check ownership
    const checkResult = await query('SELECT id FROM classes WHERE id = $1 AND user_id = $2', [classId, req.userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    const result = await query(
      'INSERT INTO students (class_id, name, student_no, gender) VALUES ($1, $2, $3, $4) RETURNING *',
      [classId, name, student_no || '', gender || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ error: '添加学生失败' });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, student_no, gender } = req.body;

    // Check ownership through class
    const checkResult = await query(
      `SELECT s.id FROM students s
       JOIN classes c ON s.class_id = c.id
       WHERE s.id = $1 AND c.user_id = $2`,
      [id, req.userId]
    );
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '学生不存在' });
    }

    const result = await query(
      'UPDATE students SET name = $1, student_no = $2, gender = $3 WHERE id = $4 RETURNING *',
      [name, student_no, gender, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: '更新学生信息失败' });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership through class
    const checkResult = await query(
      `SELECT s.id FROM students s
       JOIN classes c ON s.class_id = c.id
       WHERE s.id = $1 AND c.user_id = $2`,
      [id, req.userId]
    );
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '学生不存在' });
    }

    await query('DELETE FROM students WHERE id = $1', [id]);
    res.json({ message: '学生已删除' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: '删除学生失败' });
  }
};

export const importStudents = async (req, res) => {
  try {
    const { classId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: '请上传Excel文件' });
    }

    // Check ownership
    const checkResult = await query('SELECT id FROM classes WHERE id = $1 AND user_id = $2', [classId, req.userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return res.status(400).json({ error: 'Excel文件中没有数据' });
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

    res.status(201).json({
      message: `成功导入 ${students.length} 名学生`,
      students
    });
  } catch (error) {
    console.error('Import students error:', error);
    res.status(500).json({ error: '导入学生失败' });
  }
};
