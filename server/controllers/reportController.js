import { query } from '../db/index.js';
import crypto from 'crypto';
import { MembershipService } from '../services/MembershipService.js';

// Preview report
export const previewReport = async (req, res) => {
  try {
    const { student_id, report_type, start_date, end_date, modules } = req.body;
    const userId = req.userId;

    // Verify student ownership
    const studentCheck = await query(`
      SELECT s.*, c.name as class_name FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = $1 AND c.user_id = $2
    `, [student_id, userId]);

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ error: '学生不存在' });
    }

    const student = studentCheck.rows[0];
    const reportData = await generateReportData(student, start_date, end_date, modules);

    res.json(reportData);
  } catch (error) {
    res.status(500).json({ error: '预览报告失败' });
  }
};

// Generate single report
export const generateReport = async (req, res) => {
  try {
    const { student_id, report_type, start_date, end_date, modules, teacher_comment, template } = req.body;
    const userId = req.userId;

    // 检查家长报告额度
    const reportCheck = await MembershipService.checkParentReportLimit(userId);
    if (!reportCheck.allowed) {
      return res.status(403).json({
        error: reportCheck.message,
        code: 'LIMIT_EXCEEDED',
        current: reportCheck.current,
        limit: reportCheck.limit
      });
    }

    // Verify student ownership
    const studentCheck = await query(`
      SELECT s.*, c.name as class_name FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = $1 AND c.user_id = $2
    `, [student_id, userId]);

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ error: '学生不存在' });
    }

    const student = studentCheck.rows[0];

    // Generate share URL
    const shareCode = crypto.randomBytes(8).toString('hex');
    const shareUrl = `/report/${shareCode}`;

    // Calculate expire date (default 30 days)
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + 30);

    // Save report
    const result = await query(`
      INSERT INTO parent_reports
        (student_id, class_id, report_type, start_date, end_date, modules, teacher_comment, template, share_url, expire_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      student_id,
      student.class_id,
      report_type || 'weekly',
      start_date,
      end_date,
      JSON.stringify(modules || { attendance: true, scores: true, assignments: true }),
      teacher_comment || '',
      template || 'simple',
      shareUrl,
      expireAt
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: '生成报告失败' });
  }
};

// Batch generate reports
export const batchGenerateReports = async (req, res) => {
  try {
    const { class_id, report_type, start_date, end_date, modules, comments, template } = req.body;
    const userId = req.userId;

    // Verify class ownership
    const classCheck = await query(
      'SELECT id FROM classes WHERE id = $1 AND user_id = $2',
      [class_id, userId]
    );
    if (classCheck.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    // Get all students
    const students = await query(
      'SELECT id, name FROM students WHERE class_id = $1',
      [class_id]
    );

    // 检查家长报告额度（需要足够的剩余额度）
    const reportCheck = await MembershipService.checkParentReportLimit(userId);
    if (!reportCheck.allowed) {
      return res.status(403).json({
        error: reportCheck.message,
        code: 'LIMIT_EXCEEDED',
        current: reportCheck.current,
        limit: reportCheck.limit
      });
    }
    // 检查剩余额度是否足够生成所有报告
    if (reportCheck.remaining !== undefined && reportCheck.remaining < students.rows.length) {
      return res.status(403).json({
        error: `本月剩余报告额度不足。需要 ${students.rows.length} 份，剩余 ${reportCheck.remaining} 份。升级会员解锁无限报告。`,
        code: 'LIMIT_EXCEEDED',
        needed: students.rows.length,
        remaining: reportCheck.remaining
      });
    }

    const reports = [];
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + 30);

    for (const student of students.rows) {
      const shareCode = crypto.randomBytes(8).toString('hex');
      const shareUrl = `/report/${shareCode}`;
      const comment = comments?.[student.id] || comments?.default || '';

      const result = await query(`
        INSERT INTO parent_reports
          (student_id, class_id, report_type, start_date, end_date, modules, teacher_comment, template, share_url, expire_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, student_id, share_url
      `, [
        student.id,
        class_id,
        report_type || 'weekly',
        start_date,
        end_date,
        JSON.stringify(modules || { attendance: true, scores: true, assignments: true }),
        comment,
        template || 'simple',
        shareUrl,
        expireAt
      ]);

      reports.push({
        ...result.rows[0],
        student_name: student.name
      });
    }

    res.status(201).json({
      message: `成功生成 ${reports.length} 份报告`,
      reports
    });
  } catch (error) {
    res.status(500).json({ error: '批量生成报告失败' });
  }
};

// Get report by ID
export const getReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.userId;

    const result = await query(`
      SELECT pr.*, s.name as student_name, s.student_no, c.name as class_name
      FROM parent_reports pr
      JOIN students s ON pr.student_id = s.id
      JOIN classes c ON pr.class_id = c.id
      WHERE pr.id = $1 AND c.user_id = $2
    `, [reportId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '报告不存在' });
    }

    const report = result.rows[0];
    const student = {
      id: report.student_id,
      name: report.student_name,
      student_no: report.student_no,
      class_id: report.class_id,
      class_name: report.class_name
    };

    const reportData = await generateReportData(
      student,
      report.start_date,
      report.end_date,
      report.modules
    );

    res.json({
      ...report,
      data: reportData
    });
  } catch (error) {
    res.status(500).json({ error: '获取报告失败' });
  }
};

// Get report by share URL (public, no auth required)
export const getReportByShareUrl = async (req, res) => {
  try {
    const { shareCode } = req.params;
    const { password } = req.query;

    const result = await query(`
      SELECT pr.*, s.name as student_name, s.student_no, c.name as class_name
      FROM parent_reports pr
      JOIN students s ON pr.student_id = s.id
      JOIN classes c ON pr.class_id = c.id
      WHERE pr.share_url = $1
    `, [`/report/${shareCode}`]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '报告不存在' });
    }

    const report = result.rows[0];

    // Check expiration
    if (report.expire_at && new Date(report.expire_at) < new Date()) {
      return res.status(410).json({ error: '报告链接已过期' });
    }

    // Check password if set
    if (report.share_password && report.share_password !== password) {
      return res.status(401).json({ error: '需要密码', require_password: true });
    }

    const student = {
      id: report.student_id,
      name: report.student_name,
      student_no: report.student_no,
      class_id: report.class_id,
      class_name: report.class_name
    };

    const reportData = await generateReportData(
      student,
      report.start_date,
      report.end_date,
      report.modules
    );

    res.json({
      student_name: report.student_name,
      class_name: report.class_name,
      report_type: report.report_type,
      start_date: report.start_date,
      end_date: report.end_date,
      teacher_comment: report.teacher_comment,
      template: report.template,
      created_at: report.created_at,
      data: reportData
    });
  } catch (error) {
    res.status(500).json({ error: '获取报告失败' });
  }
};

// Get report history
export const getReportHistory = async (req, res) => {
  try {
    const { class_id, student_id } = req.query;
    const userId = req.userId;

    let whereClause = 'c.user_id = $1';
    const params = [userId];

    if (class_id) {
      params.push(class_id);
      whereClause += ` AND pr.class_id = $${params.length}`;
    }
    if (student_id) {
      params.push(student_id);
      whereClause += ` AND pr.student_id = $${params.length}`;
    }

    const result = await query(`
      SELECT pr.id, pr.report_type, pr.start_date, pr.end_date, pr.share_url, pr.created_at,
             s.name as student_name, c.name as class_name
      FROM parent_reports pr
      JOIN students s ON pr.student_id = s.id
      JOIN classes c ON pr.class_id = c.id
      WHERE ${whereClause}
      ORDER BY pr.created_at DESC
      LIMIT 100
    `, params);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: '获取报告历史失败' });
  }
};

// Get preset comments
export const getPresetComments = async (req, res) => {
  const comments = {
    positive: [
      '本周表现优秀，继续保持！',
      '积极参与课堂，值得表扬！',
      '作业认真，进步明显！',
      '乐于助人，是同学们的好榜样！',
      '学习态度端正，成绩稳步提升！'
    ],
    encouraging: [
      '本周有所进步，期待更好的表现！',
      '作业还需更加认真，加油！',
      '上课可以更专注一些，老师相信你！',
      '积分还有提升空间，继续努力！',
      '希望下周能看到更大的进步！'
    ],
    attention: [
      '本周出勤需要关注，请家长了解情况。',
      '作业完成情况不理想，建议加强监督。',
      '课堂表现需要改进，希望家校配合。',
      '最近学习状态有所下滑，需要关注。'
    ]
  };

  res.json(comments);
};

// Delete report
export const deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.userId;

    const check = await query(`
      SELECT pr.id FROM parent_reports pr
      JOIN classes c ON pr.class_id = c.id
      WHERE pr.id = $1 AND c.user_id = $2
    `, [reportId, userId]);

    if (check.rows.length === 0) {
      return res.status(404).json({ error: '报告不存在' });
    }

    await query('DELETE FROM parent_reports WHERE id = $1', [reportId]);
    res.json({ message: '报告已删除' });
  } catch (error) {
    res.status(500).json({ error: '删除报告失败' });
  }
};

// Helper: Generate report data
async function generateReportData(student, startDate, endDate, modules) {
  const data = {
    period: {
      start: startDate,
      end: endDate
    }
  };

  const mods = typeof modules === 'string' ? JSON.parse(modules) : modules;

  // Attendance data
  if (!mods || mods.attendance !== false) {
    const attendance = await query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late,
        COUNT(CASE WHEN status = 'leave' THEN 1 END) as leave
      FROM attendance_records
      WHERE student_id = $1
        AND date >= $2 AND date <= $3
    `, [student.id, startDate, endDate]);

    const details = await query(`
      SELECT date, status FROM attendance_records
      WHERE student_id = $1 AND date >= $2 AND date <= $3
      ORDER BY date
    `, [student.id, startDate, endDate]);

    const att = attendance.rows[0];
    data.attendance = {
      total_days: parseInt(att.total) || 0,
      present: parseInt(att.present) || 0,
      absent: parseInt(att.absent) || 0,
      late: parseInt(att.late) || 0,
      leave: parseInt(att.leave) || 0,
      rate: att.total > 0 ? (parseInt(att.present) / parseInt(att.total) * 100).toFixed(1) : 0,
      details: details.rows
    };
  }

  // Score data
  if (!mods || mods.scores !== false) {
    const scores = await query(`
      SELECT
        SUM(change) as period_score,
        (SELECT SUM(change) FROM score_records WHERE student_id = $1) as total_score
      FROM score_records
      WHERE student_id = $1
        AND created_at >= $2 AND created_at <= $3
    `, [student.id, startDate, endDate]);

    const topReasons = await query(`
      SELECT reason, SUM(change) as total
      FROM score_records
      WHERE student_id = $1 AND created_at >= $2 AND created_at <= $3 AND change > 0
      GROUP BY reason
      ORDER BY total DESC
      LIMIT 3
    `, [student.id, startDate, endDate]);

    // Get rank
    const rankResult = await query(`
      SELECT COUNT(*) + 1 as rank
      FROM (
        SELECT student_id, SUM(change) as total
        FROM score_records sr
        JOIN students s ON sr.student_id = s.id
        WHERE s.class_id = $1
        GROUP BY student_id
        HAVING SUM(change) > (
          SELECT COALESCE(SUM(change), 0) FROM score_records WHERE student_id = $2
        )
      ) t
    `, [student.class_id, student.id]);

    data.scores = {
      period_score: parseInt(scores.rows[0].period_score) || 0,
      total_score: parseInt(scores.rows[0].total_score) || 0,
      rank: parseInt(rankResult.rows[0].rank) || 1,
      top_reasons: topReasons.rows
    };
  }

  // Assignment data
  if (!mods || mods.assignments !== false) {
    const assignments = await query(`
      SELECT
        COUNT(DISTINCT a.id) as total,
        COUNT(DISTINCT CASE WHEN s.id IS NOT NULL THEN a.id END) as submitted,
        AVG(s.score) as avg_score
      FROM assignments a
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $1
      WHERE a.class_id = $2
        AND a.created_at >= $3 AND a.created_at <= $4
    `, [student.id, student.class_id, startDate, endDate]);

    const unsubmitted = await query(`
      SELECT a.title FROM assignments a
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $1
      WHERE a.class_id = $2 AND a.created_at >= $3 AND a.created_at <= $4
        AND s.id IS NULL
    `, [student.id, student.class_id, startDate, endDate]);

    const excellent = await query(`
      SELECT a.title, s.score FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      WHERE s.student_id = $1 AND a.created_at >= $2 AND a.created_at <= $3
        AND s.score >= 90
      ORDER BY s.score DESC
      LIMIT 3
    `, [student.id, startDate, endDate]);

    const ass = assignments.rows[0];
    data.assignments = {
      total: parseInt(ass.total) || 0,
      submitted: parseInt(ass.submitted) || 0,
      submit_rate: ass.total > 0 ? (parseInt(ass.submitted) / parseInt(ass.total) * 100).toFixed(1) : 0,
      avg_score: parseFloat(ass.avg_score) || 0,
      unsubmitted: unsubmitted.rows.map(r => r.title),
      excellent: excellent.rows
    };
  }

  // Exam data (if any exams in period)
  if (!mods || mods.exams !== false) {
    const exams = await query(`
      SELECT e.name, e.subject, e.exam_date, es.score, es.rank, e.full_score
      FROM exam_scores es
      JOIN exams e ON es.exam_id = e.id
      WHERE es.student_id = $1
        AND e.exam_date >= $2 AND e.exam_date <= $3
      ORDER BY e.exam_date DESC
    `, [student.id, startDate, endDate]);

    if (exams.rows.length > 0) {
      data.exams = exams.rows;
    }
  }

  return data;
}
