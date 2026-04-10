import { query } from '../db/index.js';

export const getAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;

    // Check ownership
    const checkResult = await query('SELECT id FROM classes WHERE id = $1 AND user_id = $2', [classId, req.userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    let queryText = `
      SELECT ar.*, s.name as student_name, s.student_no
      FROM attendance_records ar
      JOIN students s ON ar.student_id = s.id
      WHERE ar.class_id = $1
    `;
    const params = [classId];

    if (date) {
      queryText += ' AND ar.date = $2';
      params.push(date);
    }

    queryText += ' ORDER BY ar.date DESC, s.student_no, s.name';

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: '获取点名记录失败' });
  }
};

export const recordAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { student_id, status, date } = req.body;

    if (!student_id || !status) {
      return res.status(400).json({ error: '学生ID和状态不能为空' });
    }

    // Check ownership
    const checkResult = await query('SELECT id FROM classes WHERE id = $1 AND user_id = $2', [classId, req.userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    const attendanceDate = date || new Date().toISOString().split('T')[0];

    // Upsert attendance record
    const existingRecord = await query(
      'SELECT id FROM attendance_records WHERE class_id = $1 AND student_id = $2 AND date = $3',
      [classId, student_id, attendanceDate]
    );

    let result;
    if (existingRecord.rows.length > 0) {
      result = await query(
        'UPDATE attendance_records SET status = $1 WHERE id = $2 RETURNING *',
        [status, existingRecord.rows[0].id]
      );
    } else {
      result = await query(
        'INSERT INTO attendance_records (class_id, student_id, status, date) VALUES ($1, $2, $3, $4) RETURNING *',
        [classId, student_id, status, attendanceDate]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: '记录点名失败' });
  }
};

export const batchRecordAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { records, date } = req.body;

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: '请提供点名记录数组' });
    }

    // Check ownership
    const checkResult = await query('SELECT id FROM classes WHERE id = $1 AND user_id = $2', [classId, req.userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    const attendanceDate = date || new Date().toISOString().split('T')[0];
    const results = [];

    for (const record of records) {
      const { student_id, status } = record;

      // Upsert attendance record
      const existingRecord = await query(
        'SELECT id FROM attendance_records WHERE class_id = $1 AND student_id = $2 AND date = $3',
        [classId, student_id, attendanceDate]
      );

      let result;
      if (existingRecord.rows.length > 0) {
        result = await query(
          'UPDATE attendance_records SET status = $1 WHERE id = $2 RETURNING *',
          [status, existingRecord.rows[0].id]
        );
      } else {
        result = await query(
          'INSERT INTO attendance_records (class_id, student_id, status, date) VALUES ($1, $2, $3, $4) RETURNING *',
          [classId, student_id, status, attendanceDate]
        );
      }
      results.push(result.rows[0]);
    }

    res.json({ message: '批量点名成功', records: results });
  } catch (error) {
    res.status(500).json({ error: '批量点名失败' });
  }
};

export const getRandomStudent = async (req, res) => {
  try {
    const { classId } = req.params;

    // Check ownership
    const checkResult = await query('SELECT id FROM classes WHERE id = $1 AND user_id = $2', [classId, req.userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    const result = await query(
      'SELECT * FROM students WHERE class_id = $1 ORDER BY RANDOM() LIMIT 1',
      [classId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '班级中没有学生' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: '随机抽取学生失败' });
  }
};

export const getAttendanceStats = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    // Check ownership
    const checkResult = await query('SELECT id FROM classes WHERE id = $1 AND user_id = $2', [classId, req.userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    let queryText = `
      SELECT
        s.id,
        s.name,
        s.student_no,
        COUNT(CASE WHEN ar.status = 'present' THEN 1 END)::int as present_count,
        COUNT(CASE WHEN ar.status = 'absent' THEN 1 END)::int as absent_count,
        COUNT(CASE WHEN ar.status = 'late' THEN 1 END)::int as late_count,
        COUNT(CASE WHEN ar.status = 'leave' THEN 1 END)::int as leave_count,
        COUNT(ar.id)::int as total_count
      FROM students s
      LEFT JOIN attendance_records ar ON s.id = ar.student_id
    `;
    const params = [classId];
    let paramIndex = 2;

    if (startDate && endDate) {
      queryText += ` AND ar.date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(startDate, endDate);
      paramIndex += 2;
    }

    queryText += `
      WHERE s.class_id = $1
      GROUP BY s.id, s.name, s.student_no
      ORDER BY s.student_no, s.name
    `;

    const result = await query(queryText, params);
    const students = result.rows;

    // Calculate summary
    const summary = students.reduce((acc, s) => {
      acc.present += s.present_count || 0;
      acc.absent += s.absent_count || 0;
      acc.late += s.late_count || 0;
      acc.leave += s.leave_count || 0;
      acc.total += s.total_count || 0;
      return acc;
    }, { present: 0, absent: 0, late: 0, leave: 0, total: 0 });

    res.json({ students, summary });
  } catch (error) {
    res.status(500).json({ error: '获取统计数据失败' });
  }
};
