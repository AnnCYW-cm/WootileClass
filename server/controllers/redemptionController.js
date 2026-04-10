import { query } from '../db/index.js';

// Get all rewards for a class
export const getRewards = async (req, res) => {
  try {
    const { classId } = req.params;

    // Check ownership
    const checkResult = await query('SELECT id FROM classes WHERE id = $1 AND user_id = $2', [classId, req.userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    const result = await query(
      `SELECT * FROM redemption_rewards WHERE class_id = $1 AND status = 'active' ORDER BY points_required ASC`,
      [classId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: '获取奖品列表失败' });
  }
};

// Create a new reward
export const createReward = async (req, res) => {
  try {
    const { classId } = req.params;
    const { name, description, points_required, icon, stock } = req.body;

    if (!name || !points_required) {
      return res.status(400).json({ error: '奖品名称和所需积分不能为空' });
    }

    // Check ownership
    const checkResult = await query('SELECT id FROM classes WHERE id = $1 AND user_id = $2', [classId, req.userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    const result = await query(
      `INSERT INTO redemption_rewards (user_id, class_id, name, description, points_required, icon, stock)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.userId, classId, name, description || '', points_required, icon || '🎁', stock || -1]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: '创建奖品失败' });
  }
};

// Update a reward
export const updateReward = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, points_required, icon, stock, status } = req.body;

    // Check ownership
    const checkResult = await query(
      'SELECT id FROM redemption_rewards WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '奖品不存在' });
    }

    const result = await query(
      `UPDATE redemption_rewards SET name = $1, description = $2, points_required = $3, icon = $4, stock = $5, status = $6
       WHERE id = $7 RETURNING *`,
      [name, description, points_required, icon, stock, status || 'active', id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: '更新奖品失败' });
  }
};

// Delete a reward
export const deleteReward = async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const checkResult = await query(
      'SELECT id FROM redemption_rewards WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '奖品不存在' });
    }

    await query('DELETE FROM redemption_rewards WHERE id = $1', [id]);
    res.json({ message: '奖品已删除' });
  } catch (error) {
    res.status(500).json({ error: '删除奖品失败' });
  }
};

// Redeem a reward for a student
export const redeemReward = async (req, res) => {
  try {
    const { classId } = req.params;
    const { student_id, reward_id } = req.body;

    // Check class ownership
    const classCheck = await query('SELECT id FROM classes WHERE id = $1 AND user_id = $2', [classId, req.userId]);
    if (classCheck.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    // Get reward details
    const rewardResult = await query(
      'SELECT * FROM redemption_rewards WHERE id = $1 AND class_id = $2 AND status = $3',
      [reward_id, classId, 'active']
    );
    if (rewardResult.rows.length === 0) {
      return res.status(404).json({ error: '奖品不存在或已下架' });
    }
    const reward = rewardResult.rows[0];

    // Check stock
    if (reward.stock !== -1 && reward.stock <= 0) {
      return res.status(400).json({ error: '奖品库存不足' });
    }

    // Get student's current points
    const pointsResult = await query(
      `SELECT COALESCE(SUM(change), 0) as total_score FROM score_records WHERE student_id = $1`,
      [student_id]
    );
    const totalScore = parseInt(pointsResult.rows[0].total_score);

    if (totalScore < reward.points_required) {
      return res.status(400).json({ error: '积分不足' });
    }

    // Deduct points
    await query(
      `INSERT INTO score_records (class_id, student_id, change, reason, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [classId, student_id, -reward.points_required, `兑换奖品: ${reward.name}`, req.userId]
    );

    // Create redemption record
    const redemptionResult = await query(
      `INSERT INTO redemption_records (reward_id, student_id, class_id, points_spent, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [reward_id, student_id, classId, reward.points_required, 'completed']
    );

    // Update stock if not unlimited
    if (reward.stock !== -1) {
      await query('UPDATE redemption_rewards SET stock = stock - 1 WHERE id = $1', [reward_id]);
    }

    res.json({
      message: '兑换成功',
      redemption: redemptionResult.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: '兑换失败' });
  }
};

// Get redemption history for a class
export const getRedemptionHistory = async (req, res) => {
  try {
    const { classId } = req.params;

    // Check ownership
    const checkResult = await query('SELECT id FROM classes WHERE id = $1 AND user_id = $2', [classId, req.userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    const result = await query(
      `SELECT rr.*, s.name as student_name, s.student_no, r.name as reward_name, r.icon
       FROM redemption_records rr
       JOIN students s ON rr.student_id = s.id
       JOIN redemption_rewards r ON rr.reward_id = r.id
       WHERE rr.class_id = $1
       ORDER BY rr.redeemed_at DESC`,
      [classId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: '获取兑换记录失败' });
  }
};

// Get student's redemption history
export const getStudentRedemptions = async (req, res) => {
  try {
    const { studentId } = req.params;

    const result = await query(
      `SELECT rr.*, r.name as reward_name, r.icon
       FROM redemption_records rr
       JOIN redemption_rewards r ON rr.reward_id = r.id
       WHERE rr.student_id = $1
       ORDER BY rr.redeemed_at DESC`,
      [studentId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: '获取兑换记录失败' });
  }
};
