import { query } from '../db/index.js';

// Get class dashboard summary
export const getClassSummary = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.userId;

    // Verify class ownership
    const classCheck = await query(
      'SELECT id FROM classes WHERE id = $1 AND user_id = $2',
      [classId, userId]
    );
    if (classCheck.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    // Get student count
    const studentCount = await query(
      'SELECT COUNT(*) as count FROM students WHERE class_id = $1',
      [classId]
    );

    // Get this week's attendance rate
    const weekAttendance = await query(`
      SELECT
        COUNT(CASE WHEN status = 'present' THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100 as rate,
        COUNT(*) as total
      FROM attendance_records
      WHERE class_id = $1
        AND date >= CURRENT_DATE - INTERVAL '7 days'
    `, [classId]);

    // Get last week's attendance for comparison
    const lastWeekAttendance = await query(`
      SELECT
        COUNT(CASE WHEN status = 'present' THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100 as rate
      FROM attendance_records
      WHERE class_id = $1
        AND date >= CURRENT_DATE - INTERVAL '14 days'
        AND date < CURRENT_DATE - INTERVAL '7 days'
    `, [classId]);

    // Get this month's average score
    const monthScore = await query(`
      SELECT COALESCE(SUM(change)::float / NULLIF(COUNT(DISTINCT student_id), 0), 0) as avg_score
      FROM score_records
      WHERE class_id = $1
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `, [classId]);

    // Get last month's average score for comparison
    const lastMonthScore = await query(`
      SELECT COALESCE(SUM(change)::float / NULLIF(COUNT(DISTINCT student_id), 0), 0) as avg_score
      FROM score_records
      WHERE class_id = $1
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
        AND created_at < DATE_TRUNC('month', CURRENT_DATE)
    `, [classId]);

    // Get assignment submission rate this week
    const weekAssignment = await query(`
      SELECT
        COUNT(DISTINCT s.id)::float / NULLIF(
          (SELECT COUNT(*) FROM students WHERE class_id = $1) *
          (SELECT COUNT(*) FROM assignments WHERE class_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days'), 0
        ) * 100 as rate
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      WHERE a.class_id = $1
        AND a.created_at >= CURRENT_DATE - INTERVAL '7 days'
    `, [classId]);

    // Get assignment average score
    const assignmentAvg = await query(`
      SELECT COALESCE(AVG(s.score), 0) as avg_score
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      WHERE a.class_id = $1
        AND s.score IS NOT NULL
        AND a.created_at >= CURRENT_DATE - INTERVAL '7 days'
    `, [classId]);

    res.json({
      student_count: parseInt(studentCount.rows[0].count),
      attendance: {
        rate: parseFloat(weekAttendance.rows[0].rate) || 0,
        change: (parseFloat(weekAttendance.rows[0].rate) || 0) - (parseFloat(lastWeekAttendance.rows[0].rate) || 0)
      },
      score: {
        avg: parseFloat(monthScore.rows[0].avg_score) || 0,
        change: (parseFloat(monthScore.rows[0].avg_score) || 0) - (parseFloat(lastMonthScore.rows[0].avg_score) || 0)
      },
      assignment: {
        submit_rate: parseFloat(weekAssignment.rows[0].rate) || 0,
        avg_score: parseFloat(assignmentAvg.rows[0].avg_score) || 0
      }
    });
  } catch (error) {
    console.error('Get class summary error:', error);
    res.status(500).json({ error: '获取班级概览失败' });
  }
};

// Get attendance trend
export const getAttendanceTrend = async (req, res) => {
  try {
    const { classId } = req.params;
    const { days = 30 } = req.query;
    const userId = req.userId;

    const classCheck = await query(
      'SELECT id FROM classes WHERE id = $1 AND user_id = $2',
      [classId, userId]
    );
    if (classCheck.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    const result = await query(`
      SELECT
        date,
        COUNT(CASE WHEN status = 'present' THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100 as rate,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late,
        COUNT(CASE WHEN status = 'leave' THEN 1 END) as leave
      FROM attendance_records
      WHERE class_id = $1
        AND date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
      GROUP BY date
      ORDER BY date
    `, [classId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get attendance trend error:', error);
    res.status(500).json({ error: '获取出勤趋势失败' });
  }
};

// Get score ranking
export const getScoreRanking = async (req, res) => {
  try {
    const { classId } = req.params;
    const { period = 'all', limit = 10 } = req.query;
    const userId = req.userId;

    const classCheck = await query(
      'SELECT id FROM classes WHERE id = $1 AND user_id = $2',
      [classId, userId]
    );
    if (classCheck.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    let dateFilter = '';
    if (period === 'week') {
      dateFilter = "AND sr.created_at >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (period === 'month') {
      dateFilter = "AND sr.created_at >= DATE_TRUNC('month', CURRENT_DATE)";
    }

    const result = await query(`
      SELECT
        s.id,
        s.name,
        s.student_no,
        COALESCE(SUM(sr.change), 0) as total_score,
        COALESCE(SUM(CASE WHEN sr.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN sr.change ELSE 0 END), 0) as week_change
      FROM students s
      LEFT JOIN score_records sr ON s.id = sr.student_id ${dateFilter}
      WHERE s.class_id = $1
      GROUP BY s.id, s.name, s.student_no
      ORDER BY total_score DESC
      LIMIT $2
    `, [classId, parseInt(limit)]);

    // Add rank
    const ranked = result.rows.map((row, index) => ({
      ...row,
      rank: index + 1
    }));

    res.json(ranked);
  } catch (error) {
    console.error('Get score ranking error:', error);
    res.status(500).json({ error: '获取积分排行失败' });
  }
};

// Get assignment stats
export const getAssignmentStats = async (req, res) => {
  try {
    const { classId } = req.params;
    const { limit = 5 } = req.query;
    const userId = req.userId;

    const classCheck = await query(
      'SELECT id FROM classes WHERE id = $1 AND user_id = $2',
      [classId, userId]
    );
    if (classCheck.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    // Get student count for this class
    const studentCountResult = await query(
      'SELECT COUNT(*) as count FROM students WHERE class_id = $1',
      [classId]
    );
    const studentCount = parseInt(studentCountResult.rows[0].count);

    const result = await query(`
      SELECT
        a.id,
        a.title,
        a.created_at,
        COUNT(s.id) as submitted_count,
        COALESCE(AVG(s.score), 0) as avg_score
      FROM assignments a
      LEFT JOIN submissions s ON a.id = s.assignment_id
      WHERE a.class_id = $1
      GROUP BY a.id, a.title, a.created_at
      ORDER BY a.created_at DESC
      LIMIT $2
    `, [classId, parseInt(limit)]);

    const stats = result.rows.map(row => ({
      ...row,
      student_count: studentCount,
      submit_rate: studentCount > 0 ? (parseInt(row.submitted_count) / studentCount * 100) : 0
    }));

    res.json(stats);
  } catch (error) {
    console.error('Get assignment stats error:', error);
    res.status(500).json({ error: '获取作业统计失败' });
  }
};

// Get student dashboard summary
export const getStudentSummary = async (req, res) => {
  try {
    const { studentId } = req.params;
    const userId = req.userId;

    // Verify student ownership through class
    const studentCheck = await query(`
      SELECT s.id, s.name, s.student_no, s.class_id, c.name as class_name
      FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = $1 AND c.user_id = $2
    `, [studentId, userId]);

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ error: '学生不存在' });
    }

    const student = studentCheck.rows[0];
    const classId = student.class_id;

    // Get student count for ranking
    const studentCountResult = await query(
      'SELECT COUNT(*) as count FROM students WHERE class_id = $1',
      [classId]
    );
    const totalStudents = parseInt(studentCountResult.rows[0].count);

    // Get attendance rate
    const attendance = await query(`
      SELECT
        COUNT(CASE WHEN status = 'present' THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100 as rate,
        COUNT(*) as total
      FROM attendance_records
      WHERE student_id = $1
    `, [studentId]);

    // Get class attendance rate for comparison
    const classAttendance = await query(`
      SELECT
        COUNT(CASE WHEN status = 'present' THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100 as rate
      FROM attendance_records
      WHERE class_id = $1
    `, [classId]);

    // Get total score and rank
    const scoreResult = await query(`
      SELECT
        COALESCE(SUM(change), 0) as total_score
      FROM score_records
      WHERE student_id = $1
    `, [studentId]);

    // Get score rank
    const scoreRank = await query(`
      SELECT COUNT(*) + 1 as rank
      FROM (
        SELECT student_id, SUM(change) as total
        FROM score_records
        WHERE class_id = $1
        GROUP BY student_id
        HAVING SUM(change) > (
          SELECT COALESCE(SUM(change), 0) FROM score_records WHERE student_id = $2
        )
      ) t
    `, [classId, studentId]);

    // Get assignment stats
    const assignmentStats = await query(`
      SELECT
        COUNT(s.id)::float / NULLIF(COUNT(DISTINCT a.id), 0) * 100 as submit_rate,
        COALESCE(AVG(s.score), 0) as avg_score
      FROM assignments a
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $1
      WHERE a.class_id = $2
    `, [studentId, classId]);

    // Get class assignment average for comparison
    const classAssignment = await query(`
      SELECT COALESCE(AVG(s.score), 0) as avg_score
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      WHERE a.class_id = $1 AND s.score IS NOT NULL
    `, [classId]);

    res.json({
      student: {
        id: student.id,
        name: student.name,
        student_no: student.student_no,
        class_name: student.class_name
      },
      attendance: {
        rate: parseFloat(attendance.rows[0].rate) || 0,
        class_rate: parseFloat(classAttendance.rows[0].rate) || 0
      },
      score: {
        total: parseInt(scoreResult.rows[0].total_score) || 0,
        rank: parseInt(scoreRank.rows[0].rank) || 1,
        total_students: totalStudents
      },
      assignment: {
        submit_rate: parseFloat(assignmentStats.rows[0].submit_rate) || 0,
        avg_score: parseFloat(assignmentStats.rows[0].avg_score) || 0,
        class_avg: parseFloat(classAssignment.rows[0].avg_score) || 0
      }
    });
  } catch (error) {
    console.error('Get student summary error:', error);
    res.status(500).json({ error: '获取学生概览失败' });
  }
};

// Get student score trend
export const getStudentScoreTrend = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { days = 30 } = req.query;
    const userId = req.userId;

    // Verify ownership
    const studentCheck = await query(`
      SELECT s.id FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = $1 AND c.user_id = $2
    `, [studentId, userId]);

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ error: '学生不存在' });
    }

    const result = await query(`
      SELECT
        DATE(created_at) as date,
        SUM(change) as daily_change,
        SUM(SUM(change)) OVER (ORDER BY DATE(created_at)) as cumulative
      FROM score_records
      WHERE student_id = $1
        AND created_at >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [studentId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get student score trend error:', error);
    res.status(500).json({ error: '获取积分趋势失败' });
  }
};

// Get student attendance calendar
export const getStudentAttendanceCalendar = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month } = req.query; // format: YYYY-MM
    const userId = req.userId;

    // Verify ownership
    const studentCheck = await query(`
      SELECT s.id FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = $1 AND c.user_id = $2
    `, [studentId, userId]);

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ error: '学生不存在' });
    }

    let dateFilter = '';
    if (month) {
      dateFilter = `AND DATE_TRUNC('month', date) = '${month}-01'::date`;
    } else {
      dateFilter = `AND date >= DATE_TRUNC('month', CURRENT_DATE)`;
    }

    const result = await query(`
      SELECT date, status
      FROM attendance_records
      WHERE student_id = $1 ${dateFilter}
      ORDER BY date
    `, [studentId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get student attendance calendar error:', error);
    res.status(500).json({ error: '获取出勤日历失败' });
  }
};

// Get student assignments
export const getStudentAssignments = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    const userId = req.userId;

    // Verify ownership
    const studentCheck = await query(`
      SELECT s.id, s.class_id FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = $1 AND c.user_id = $2
    `, [studentId, userId]);

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ error: '学生不存在' });
    }

    const classId = studentCheck.rows[0].class_id;

    const result = await query(`
      SELECT
        a.id,
        a.title,
        a.created_at,
        a.deadline,
        s.id as submission_id,
        s.score,
        s.grade,
        s.comment,
        s.submitted_at,
        CASE WHEN s.id IS NOT NULL THEN 'submitted'
             WHEN a.deadline < NOW() THEN 'overdue'
             ELSE 'pending' END as status
      FROM assignments a
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $1
      WHERE a.class_id = $2
      ORDER BY a.created_at DESC
      LIMIT $3 OFFSET $4
    `, [studentId, classId, parseInt(limit), parseInt(offset)]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get student assignments error:', error);
    res.status(500).json({ error: '获取学生作业失败' });
  }
};

// Get pending todos for dashboard
export const getPendingTodos = async (req, res) => {
  try {
    const userId = req.userId;

    // Get ungraded assignments count
    const ungradedResult = await query(`
      SELECT COUNT(*) as count
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      WHERE a.user_id = $1 AND s.score IS NULL
    `, [userId]);

    // Get today's classes without attendance
    const noAttendanceResult = await query(`
      SELECT c.id, c.name
      FROM classes c
      WHERE c.user_id = $1
        AND c.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM attendance_records ar
          WHERE ar.class_id = c.id AND ar.date = CURRENT_DATE
        )
    `, [userId]);

    // Get students with no score change in a week
    const inactiveStudentsResult = await query(`
      SELECT COUNT(DISTINCT s.id) as count
      FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE c.user_id = $1
        AND NOT EXISTS (
          SELECT 1 FROM score_records sr
          WHERE sr.student_id = s.id
            AND sr.created_at >= CURRENT_DATE - INTERVAL '7 days'
        )
    `, [userId]);

    // Get pending redemption requests
    const pendingRedemptionResult = await query(`
      SELECT COUNT(*) as count
      FROM redemption_records rr
      JOIN redemption_rewards r ON rr.reward_id = r.id
      WHERE r.user_id = $1 AND rr.status = 'pending'
    `, [userId]);

    res.json({
      ungraded_assignments: parseInt(ungradedResult.rows[0].count),
      classes_no_attendance: noAttendanceResult.rows,
      inactive_students: parseInt(inactiveStudentsResult.rows[0].count),
      pending_redemptions: parseInt(pendingRedemptionResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get pending todos error:', error);
    res.status(500).json({ error: '获取待办事项失败' });
  }
};
