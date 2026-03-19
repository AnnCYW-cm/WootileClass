import { query } from '../db/index.js';
import crypto from 'crypto';

// Generate a unique submit code for assignments
const generateSubmitCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Get all assignments for the current user
export const getAssignments = async (req, res) => {
  try {
    const { class_id, status } = req.query;
    let queryText = `
      SELECT a.*, c.name as class_name,
        (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) as submission_count,
        (SELECT COUNT(*) FROM students st WHERE st.class_id = a.class_id) as student_count
      FROM assignments a
      JOIN classes c ON a.class_id = c.id
      WHERE a.user_id = $1
    `;
    const params = [req.userId];

    if (class_id) {
      params.push(class_id);
      queryText += ` AND a.class_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      queryText += ` AND a.status = $${params.length}`;
    }

    queryText += ' ORDER BY a.created_at DESC';

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: '获取作业列表失败' });
  }
};

// Get a single assignment by ID
export const getAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT a.*, c.name as class_name,
        (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) as submission_count,
        (SELECT COUNT(*) FROM students st WHERE st.class_id = a.class_id) as student_count
      FROM assignments a
      JOIN classes c ON a.class_id = c.id
      WHERE a.id = $1 AND a.user_id = $2`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '作业不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ error: '获取作业详情失败' });
  }
};

// Create a new assignment
export const createAssignment = async (req, res) => {
  try {
    const { class_id, title, description, type, deadline } = req.body;

    if (!class_id || !title) {
      return res.status(400).json({ error: '班级和标题不能为空' });
    }

    // Verify class ownership
    const classCheck = await query('SELECT id FROM classes WHERE id = $1 AND user_id = $2', [class_id, req.userId]);
    if (classCheck.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    const submitCode = type === 'homework' ? generateSubmitCode() : null;

    const result = await query(
      `INSERT INTO assignments (user_id, class_id, title, description, type, deadline, submit_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.userId, class_id, title, description || '', type || 'classroom', deadline || null, submitCode]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: '创建作业失败' });
  }
};

// Update an assignment
export const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership and get existing data
    const checkResult = await query('SELECT * FROM assignments WHERE id = $1 AND user_id = $2', [id, req.userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '作业不存在' });
    }

    // Merge with existing values to prevent nullifying unset fields
    const existing = checkResult.rows[0];
    const title = req.body.title !== undefined ? req.body.title : existing.title;
    const description = req.body.description !== undefined ? req.body.description : existing.description;
    const deadline = req.body.deadline !== undefined ? req.body.deadline : existing.deadline;
    const status = req.body.status !== undefined ? req.body.status : existing.status;

    const result = await query(
      `UPDATE assignments SET title = $1, description = $2, deadline = $3, status = $4
       WHERE id = $5 RETURNING *`,
      [title, description, deadline, status, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ error: '更新作业失败' });
  }
};

// Delete an assignment
export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const checkResult = await query('SELECT id FROM assignments WHERE id = $1 AND user_id = $2', [id, req.userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '作业不存在' });
    }

    await query('DELETE FROM assignments WHERE id = $1', [id]);
    res.json({ message: '作业已删除' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: '删除作业失败' });
  }
};

// Get assignment info by submit code (public, no auth required)
export const getAssignmentByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const result = await query(
      `SELECT a.id, a.title, a.description, a.deadline, a.class_id, c.name as class_name
       FROM assignments a
       JOIN classes c ON a.class_id = c.id
       WHERE a.submit_code = $1 AND a.status = 'active'`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '作业不存在或已关闭' });
    }

    // Get students list for selection
    const students = await query(
      'SELECT id, name, student_no FROM students WHERE class_id = $1 ORDER BY student_no, name',
      [result.rows[0].class_id]
    );

    res.json({
      ...result.rows[0],
      students: students.rows
    });
  } catch (error) {
    console.error('Get assignment by code error:', error);
    res.status(500).json({ error: '获取作业信息失败' });
  }
};

// Get all submissions for an assignment
export const getSubmissions = async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const checkResult = await query('SELECT id, class_id FROM assignments WHERE id = $1 AND user_id = $2', [id, req.userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '作业不存在' });
    }

    // Get all students with their submissions
    const result = await query(
      `SELECT s.id as student_id, s.name, s.student_no,
        sub.id as submission_id, sub.images, sub.score, sub.grade, sub.comment, sub.graded_at, sub.submitted_at
       FROM students s
       LEFT JOIN submissions sub ON s.id = sub.student_id AND sub.assignment_id = $1
       WHERE s.class_id = $2
       ORDER BY s.student_no, s.name`,
      [id, checkResult.rows[0].class_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: '获取提交列表失败' });
  }
};

// Submit assignment (student, no auth required)
export const submitAssignment = async (req, res) => {
  try {
    const { code } = req.params;
    const { student_id, images } = req.body;

    if (!student_id || !images || images.length === 0) {
      return res.status(400).json({ error: '请选择学生并上传作业图片' });
    }

    // Get assignment by code
    const assignmentResult = await query(
      'SELECT id, class_id, deadline FROM assignments WHERE submit_code = $1 AND status = $2',
      [code, 'active']
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: '作业不存在或已关闭' });
    }

    const assignment = assignmentResult.rows[0];

    // Check deadline
    if (assignment.deadline && new Date(assignment.deadline) < new Date()) {
      return res.status(400).json({ error: '作业已截止提交' });
    }

    // Verify student belongs to the class
    const studentCheck = await query(
      'SELECT id FROM students WHERE id = $1 AND class_id = $2',
      [student_id, assignment.class_id]
    );
    if (studentCheck.rows.length === 0) {
      return res.status(400).json({ error: '学生不在该班级中' });
    }

    // Check if already submitted, update if exists
    const existingSubmission = await query(
      'SELECT id FROM submissions WHERE assignment_id = $1 AND student_id = $2',
      [assignment.id, student_id]
    );

    let result;
    if (existingSubmission.rows.length > 0) {
      result = await query(
        'UPDATE submissions SET images = $1, submitted_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [images, existingSubmission.rows[0].id]
      );
    } else {
      result = await query(
        'INSERT INTO submissions (assignment_id, student_id, images) VALUES ($1, $2, $3) RETURNING *',
        [assignment.id, student_id, images]
      );
    }

    res.json({ message: '提交成功', submission: result.rows[0] });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ error: '提交作业失败' });
  }
};

// Teacher submit for student (classroom assignment - teacher uploads)
export const teacherSubmit = async (req, res) => {
  try {
    const { id } = req.params;
    const { student_id, images } = req.body;

    // Check assignment ownership
    const assignmentCheck = await query(
      'SELECT id, class_id FROM assignments WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (assignmentCheck.rows.length === 0) {
      return res.status(404).json({ error: '作业不存在' });
    }

    // Verify student belongs to the class
    const studentCheck = await query(
      'SELECT id FROM students WHERE id = $1 AND class_id = $2',
      [student_id, assignmentCheck.rows[0].class_id]
    );
    if (studentCheck.rows.length === 0) {
      return res.status(400).json({ error: '学生不在该班级中' });
    }

    // Check if already submitted, update if exists
    const existingSubmission = await query(
      'SELECT id FROM submissions WHERE assignment_id = $1 AND student_id = $2',
      [id, student_id]
    );

    let result;
    if (existingSubmission.rows.length > 0) {
      result = await query(
        'UPDATE submissions SET images = $1, submitted_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [images, existingSubmission.rows[0].id]
      );
    } else {
      result = await query(
        'INSERT INTO submissions (assignment_id, student_id, images) VALUES ($1, $2, $3) RETURNING *',
        [id, student_id, images]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Teacher submit error:', error);
    res.status(500).json({ error: '上传作业失败' });
  }
};

// Grade a submission
export const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { score, grade, comment } = req.body;

    // Check ownership via assignment
    const checkResult = await query(
      `SELECT s.id FROM submissions s
       JOIN assignments a ON s.assignment_id = a.id
       WHERE s.id = $1 AND a.user_id = $2`,
      [submissionId, req.userId]
    );
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '提交记录不存在' });
    }

    const result = await query(
      `UPDATE submissions SET score = $1, grade = $2, comment = $3, graded_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [score, grade, comment, submissionId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ error: '批改失败' });
  }
};

// Batch grade submissions
export const batchGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const { submissions } = req.body; // Array of { submission_id, score, grade, comment }

    // Check assignment ownership
    const checkResult = await query('SELECT id FROM assignments WHERE id = $1 AND user_id = $2', [id, req.userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '作业不存在' });
    }

    for (const sub of submissions) {
      await query(
        `UPDATE submissions SET score = $1, grade = $2, comment = $3, graded_at = CURRENT_TIMESTAMP
         WHERE id = $4 AND assignment_id = $5`,
        [sub.score, sub.grade, sub.comment, sub.submission_id, id]
      );
    }

    res.json({ message: '批量批改成功' });
  } catch (error) {
    console.error('Batch grade error:', error);
    res.status(500).json({ error: '批量批改失败' });
  }
};

// Get assignment statistics
export const getStatistics = async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const assignmentResult = await query(
      'SELECT a.*, c.name as class_name FROM assignments a JOIN classes c ON a.class_id = c.id WHERE a.id = $1 AND a.user_id = $2',
      [id, req.userId]
    );
    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: '作业不存在' });
    }

    const assignment = assignmentResult.rows[0];

    // Get student count
    const studentCountResult = await query(
      'SELECT COUNT(*) FROM students WHERE class_id = $1',
      [assignment.class_id]
    );
    const studentCount = parseInt(studentCountResult.rows[0].count);

    // Get submission count
    const submissionCountResult = await query(
      'SELECT COUNT(*) FROM submissions WHERE assignment_id = $1',
      [id]
    );
    const submissionCount = parseInt(submissionCountResult.rows[0].count);

    // Get graded count
    const gradedCountResult = await query(
      'SELECT COUNT(*) FROM submissions WHERE assignment_id = $1 AND graded_at IS NOT NULL',
      [id]
    );
    const gradedCount = parseInt(gradedCountResult.rows[0].count);

    // Get score statistics
    const scoreStatsResult = await query(
      `SELECT
        AVG(score) as avg_score,
        MAX(score) as max_score,
        MIN(score) as min_score
       FROM submissions WHERE assignment_id = $1 AND score IS NOT NULL`,
      [id]
    );

    // Get score distribution
    const scoreDistResult = await query(
      `SELECT
        CASE
          WHEN score >= 90 THEN 'A'
          WHEN score >= 80 THEN 'B'
          WHEN score >= 70 THEN 'C'
          WHEN score >= 60 THEN 'D'
          ELSE 'F'
        END as grade_level,
        COUNT(*) as count
       FROM submissions
       WHERE assignment_id = $1 AND score IS NOT NULL
       GROUP BY grade_level
       ORDER BY grade_level`,
      [id]
    );

    res.json({
      assignment,
      studentCount,
      submissionCount,
      gradedCount,
      submissionRate: studentCount > 0 ? (submissionCount / studentCount * 100).toFixed(1) : 0,
      avgScore: scoreStatsResult.rows[0].avg_score ? parseFloat(scoreStatsResult.rows[0].avg_score).toFixed(1) : null,
      maxScore: scoreStatsResult.rows[0].max_score,
      minScore: scoreStatsResult.rows[0].min_score,
      scoreDistribution: scoreDistResult.rows
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
};

// Get quick comments
export const getQuickComments = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM quick_comments WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get quick comments error:', error);
    res.status(500).json({ error: '获取快捷评语失败' });
  }
};

// Create quick comment
export const createQuickComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: '评语内容不能为空' });
    }

    const result = await query(
      'INSERT INTO quick_comments (user_id, content) VALUES ($1, $2) RETURNING *',
      [req.userId, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create quick comment error:', error);
    res.status(500).json({ error: '创建快捷评语失败' });
  }
};

// Delete quick comment
export const deleteQuickComment = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM quick_comments WHERE id = $1 AND user_id = $2', [id, req.userId]);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete quick comment error:', error);
    res.status(500).json({ error: '删除快捷评语失败' });
  }
};
