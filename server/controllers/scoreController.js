import { query } from '../db/index.js';

// Get all students with their total scores for a class
export const getClassScores = async (req, res) => {
  try {
    const { classId } = req.params;

    // Check ownership
    const checkResult = await query('SELECT id FROM classes WHERE id = $1 AND user_id = $2', [classId, req.userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    const result = await query(`
      SELECT
        s.id,
        s.name,
        s.student_no,
        s.gender,
        COALESCE(SUM(sr.change), 0) as total_score
      FROM students s
      LEFT JOIN score_records sr ON s.id = sr.student_id
      WHERE s.class_id = $1
      GROUP BY s.id, s.name, s.student_no, s.gender
      ORDER BY total_score DESC, s.student_no, s.name
    `, [classId]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: '获取积分列表失败' });
  }
};

// Add score record (add or subtract points)
export const addScore = async (req, res) => {
  try {
    const { classId } = req.params;
    const { student_id, change, reason } = req.body;

    if (!student_id || change === undefined) {
      return res.status(400).json({ error: '学生ID和分值不能为空' });
    }

    // Check ownership
    const checkResult = await query('SELECT id FROM classes WHERE id = $1 AND user_id = $2', [classId, req.userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    const result = await query(`
      INSERT INTO score_records (class_id, student_id, change, reason, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [classId, student_id, change, reason || '', req.userId]);

    // Get updated total score for this student
    const totalResult = await query(`
      SELECT COALESCE(SUM(change), 0) as total_score
      FROM score_records
      WHERE student_id = $1
    `, [student_id]);

    res.status(201).json({
      record: result.rows[0],
      total_score: parseInt(totalResult.rows[0].total_score)
    });
  } catch (error) {
    res.status(500).json({ error: '添加积分失败' });
  }
};

// Batch add scores (for multiple students at once)
export const batchAddScore = async (req, res) => {
  try {
    const { classId } = req.params;
    const { records } = req.body;

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: '请提供积分记录数组' });
    }

    // Check ownership
    const checkResult = await query('SELECT id FROM classes WHERE id = $1 AND user_id = $2', [classId, req.userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    const results = [];
    for (const record of records) {
      const { student_id, change, reason } = record;
      const result = await query(`
        INSERT INTO score_records (class_id, student_id, change, reason, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [classId, student_id, change, reason || '', req.userId]);
      results.push(result.rows[0]);
    }

    res.status(201).json({ message: '批量添加积分成功', records: results });
  } catch (error) {
    res.status(500).json({ error: '批量添加积分失败' });
  }
};

// Get ranking for a class
export const getRanking = async (req, res) => {
  try {
    const { classId } = req.params;
    const { period } = req.query; // day, week, month, all

    // Check ownership
    const checkResult = await query('SELECT id FROM classes WHERE id = $1 AND user_id = $2', [classId, req.userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    let dateFilter = '';
    if (period === 'day') {
      dateFilter = "AND sr.created_at >= CURRENT_DATE";
    } else if (period === 'week') {
      dateFilter = "AND sr.created_at >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (period === 'month') {
      dateFilter = "AND sr.created_at >= CURRENT_DATE - INTERVAL '30 days'";
    }

    const result = await query(`
      SELECT
        s.id,
        s.name,
        s.student_no,
        COALESCE(SUM(sr.change), 0) as total_score
      FROM students s
      LEFT JOIN score_records sr ON s.id = sr.student_id ${dateFilter}
      WHERE s.class_id = $1
      GROUP BY s.id, s.name, s.student_no
      ORDER BY total_score DESC, s.name
    `, [classId]);

    // Add rank
    const ranked = result.rows.map((student, index) => ({
      ...student,
      rank: index + 1
    }));

    res.json(ranked);
  } catch (error) {
    res.status(500).json({ error: '获取排行榜失败' });
  }
};

// Get score history for a student
export const getStudentHistory = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Check ownership through class
    const checkResult = await query(`
      SELECT s.id FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = $1 AND c.user_id = $2
    `, [studentId, req.userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '学生不存在' });
    }

    const result = await query(`
      SELECT sr.*, s.name as student_name
      FROM score_records sr
      JOIN students s ON sr.student_id = s.id
      WHERE sr.student_id = $1
      ORDER BY sr.created_at DESC
      LIMIT 100
    `, [studentId]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: '获取积分历史失败' });
  }
};

// Get score presets for current user
export const getPresets = async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM score_presets
      WHERE user_id = $1
      ORDER BY created_at ASC
    `, [req.userId]);

    // If no presets, return default presets
    if (result.rows.length === 0) {
      const defaults = [
        { name: '回答正确', score: 2, icon: '✓' },
        { name: '积极举手', score: 1, icon: '✋' },
        { name: '帮助同学', score: 2, icon: '🤝' },
        { name: '作业优秀', score: 3, icon: '⭐' },
        { name: '违反纪律', score: -2, icon: '⚠️' },
        { name: '迟到', score: -1, icon: '⏰' },
      ];
      return res.json(defaults.map((p, i) => ({ id: `default-${i}`, ...p, is_default: true })));
    }

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: '获取预设失败' });
  }
};

// Create a score preset
export const createPreset = async (req, res) => {
  try {
    const { name, score, icon } = req.body;

    if (!name || score === undefined) {
      return res.status(400).json({ error: '名称和分值不能为空' });
    }

    const result = await query(`
      INSERT INTO score_presets (user_id, name, score, icon)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [req.userId, name, score, icon || '']);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: '创建预设失败' });
  }
};

// Delete a score preset
export const deletePreset = async (req, res) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM score_presets WHERE id = $1 AND user_id = $2', [id, req.userId]);
    res.json({ message: '预设已删除' });
  } catch (error) {
    res.status(500).json({ error: '删除预设失败' });
  }
};

// Reset scores for a class
export const resetScores = async (req, res) => {
  try {
    const { classId } = req.params;

    // Check ownership
    const checkResult = await query('SELECT id FROM classes WHERE id = $1 AND user_id = $2', [classId, req.userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    await query('DELETE FROM score_records WHERE class_id = $1', [classId]);
    res.json({ message: '积分已重置' });
  } catch (error) {
    res.status(500).json({ error: '重置积分失败' });
  }
};
