import { query } from '../db/index.js';

export const getClasses = async (req, res) => {
  try {
    const { status } = req.query;
    let queryText = `
      SELECT c.*, COUNT(s.id) as student_count
      FROM classes c
      LEFT JOIN students s ON c.id = s.class_id
      WHERE c.user_id = $1
    `;
    const params = [req.userId];

    if (status) {
      queryText += ' AND c.status = $2';
      params.push(status);
    }

    queryText += ' GROUP BY c.id ORDER BY c.status ASC, c.created_at DESC';

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: '获取班级列表失败' });
  }
};

export const getClass = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT c.*, COUNT(s.id) as student_count
       FROM classes c
       LEFT JOIN students s ON c.id = s.class_id
       WHERE c.id = $1 AND c.user_id = $2
       GROUP BY c.id`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ error: '获取班级信息失败' });
  }
};

export const createClass = async (req, res) => {
  try {
    const { name, grade, subject } = req.body;

    if (!name) {
      return res.status(400).json({ error: '班级名称不能为空' });
    }

    const result = await query(
      'INSERT INTO classes (user_id, name, grade, subject) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, name, grade || '', subject || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ error: '创建班级失败' });
  }
};

export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, grade, subject, status } = req.body;

    // Check ownership
    const checkResult = await query('SELECT id FROM classes WHERE id = $1 AND user_id = $2', [id, req.userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    const result = await query(
      'UPDATE classes SET name = $1, grade = $2, subject = $3, status = $4 WHERE id = $5 RETURNING *',
      [name, grade, subject, status || 'active', id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ error: '更新班级失败' });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const checkResult = await query('SELECT id FROM classes WHERE id = $1 AND user_id = $2', [id, req.userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    await query('DELETE FROM classes WHERE id = $1', [id]);
    res.json({ message: '班级已删除' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ error: '删除班级失败' });
  }
};

export const archiveClass = async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const checkResult = await query('SELECT id, status FROM classes WHERE id = $1 AND user_id = $2', [id, req.userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    const newStatus = checkResult.rows[0].status === 'archived' ? 'active' : 'archived';
    const result = await query(
      'UPDATE classes SET status = $1 WHERE id = $2 RETURNING *',
      [newStatus, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Archive class error:', error);
    res.status(500).json({ error: '归档班级失败' });
  }
};
