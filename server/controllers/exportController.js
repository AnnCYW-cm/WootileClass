import { query } from '../db/index.js';
import ExcelJS from 'exceljs';
import { MembershipService } from '../services/MembershipService.js';

// Helper to get date range
const getDateRange = (dateRange, semesterStart, semesterEnd) => {
  const now = new Date();
  let start, end;

  switch (dateRange.type) {
    case 'week':
      start = new Date(now);
      start.setDate(now.getDate() - now.getDay() + 1); // Monday
      end = now;
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = now;
      break;
    case 'semester':
      start = semesterStart || new Date(now.getFullYear(), now.getMonth() - 4, 1);
      end = semesterEnd || now;
      break;
    case 'custom':
      start = new Date(dateRange.start);
      end = new Date(dateRange.end);
      break;
    default:
      start = new Date(now.getFullYear(), 0, 1);
      end = now;
  }

  return { start, end };
};

// Preview export data
export const previewExport = async (req, res) => {
  try {
    const { class_id, export_type, date_range } = req.body;
    const userId = req.userId;

    // 检查数据导出权限
    const exportCheck = await MembershipService.checkExportAccess(userId);
    if (!exportCheck.allowed) {
      return res.status(403).json({
        error: exportCheck.message,
        code: 'FEATURE_RESTRICTED'
      });
    }

    // Verify class ownership
    const classCheck = await query(
      'SELECT id, name FROM classes WHERE id = $1 AND user_id = $2',
      [class_id, userId]
    );
    if (classCheck.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    const { start, end } = getDateRange(date_range || { type: 'semester' });
    const data = await getExportData(class_id, export_type, start, end, 10);

    res.json({
      preview: data,
      total: data.length,
      class_name: classCheck.rows[0].name
    });
  } catch (error) {
    res.status(500).json({ error: '预览数据失败' });
  }
};

// Download export file
export const downloadExport = async (req, res) => {
  try {
    const { class_id, export_type, date_range } = req.body;
    const userId = req.userId;

    // 检查数据导出权限
    const exportCheck = await MembershipService.checkExportAccess(userId);
    if (!exportCheck.allowed) {
      return res.status(403).json({
        error: exportCheck.message,
        code: 'FEATURE_RESTRICTED'
      });
    }

    // Verify class ownership
    const classCheck = await query(
      'SELECT id, name FROM classes WHERE id = $1 AND user_id = $2',
      [class_id, userId]
    );
    if (classCheck.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    const className = classCheck.rows[0].name;
    const { start, end } = getDateRange(date_range || { type: 'semester' });
    const data = await getExportData(class_id, export_type, start, end);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('数据');

    // Set columns and add data based on export type
    const config = getExportConfig(export_type);
    worksheet.columns = config.columns;

    // Add header styling
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    data.forEach(row => {
      worksheet.addRow(config.transform(row));
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = Math.max(column.width || 10, 12);
    });

    // Generate filename
    const typeNames = {
      students: '学生名单',
      attendance: '出勤记录',
      scores: '积分明细',
      score_summary: '积分汇总',
      assignments: '作业统计',
      student_assignments: '学生作业明细',
      comprehensive: '综合报表'
    };
    const typeName = typeNames[export_type] || '数据';
    const dateStr = `${start.toISOString().slice(0, 10)}_${end.toISOString().slice(0, 10)}`;
    const filename = `${className}_${typeName}_${dateStr}.xlsx`;

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: '导出数据失败' });
  }
};

// Get export data based on type
async function getExportData(classId, exportType, start, end, limit = null) {
  const limitClause = limit ? `LIMIT ${limit}` : '';

  switch (exportType) {
    case 'students':
      const students = await query(`
        SELECT student_no, name, gender, created_at
        FROM students
        WHERE class_id = $1
        ORDER BY student_no, name
        ${limitClause}
      `, [classId]);
      return students.rows;

    case 'attendance':
      const attendance = await query(`
        SELECT ar.date, s.name, s.student_no, ar.status
        FROM attendance_records ar
        JOIN students s ON ar.student_id = s.id
        WHERE ar.class_id = $1
          AND ar.date >= $2 AND ar.date <= $3
        ORDER BY ar.date DESC, s.student_no
        ${limitClause}
      `, [classId, start, end]);
      return attendance.rows;

    case 'scores':
      const scores = await query(`
        SELECT sr.created_at, s.name, s.student_no, sr.change, sr.reason,
          (SELECT COALESCE(SUM(change), 0) FROM score_records
           WHERE student_id = s.id AND created_at <= sr.created_at) as cumulative
        FROM score_records sr
        JOIN students s ON sr.student_id = s.id
        WHERE sr.class_id = $1
          AND sr.created_at >= $2 AND sr.created_at <= $3
        ORDER BY sr.created_at DESC
        ${limitClause}
      `, [classId, start, end]);
      return scores.rows;

    case 'score_summary':
      const scoreSummary = await query(`
        SELECT
          s.name, s.student_no,
          COALESCE(SUM(sr.change), 0) as total_score,
          COALESCE(SUM(CASE WHEN sr.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN sr.change ELSE 0 END), 0) as month_score
        FROM students s
        LEFT JOIN score_records sr ON s.id = sr.student_id
        WHERE s.class_id = $1
        GROUP BY s.id, s.name, s.student_no
        ORDER BY total_score DESC
        ${limitClause}
      `, [classId]);
      // Add rank
      return scoreSummary.rows.map((row, idx) => ({ ...row, rank: idx + 1 }));

    case 'assignments':
      const studentCount = await query(
        'SELECT COUNT(*) as count FROM students WHERE class_id = $1',
        [classId]
      );
      const totalStudents = parseInt(studentCount.rows[0].count);

      const assignments = await query(`
        SELECT
          a.title,
          a.created_at,
          COUNT(sub.id) as submitted,
          COALESCE(AVG(sub.score), 0) as avg_score
        FROM assignments a
        LEFT JOIN submissions sub ON a.id = sub.assignment_id
        WHERE a.class_id = $1
          AND a.created_at >= $2 AND a.created_at <= $3
        GROUP BY a.id, a.title, a.created_at
        ORDER BY a.created_at DESC
        ${limitClause}
      `, [classId, start, end]);
      return assignments.rows.map(row => ({
        ...row,
        total_students: totalStudents,
        submit_rate: totalStudents > 0 ? (parseInt(row.submitted) / totalStudents * 100).toFixed(1) : 0
      }));

    case 'student_assignments':
      const studentAssignments = await query(`
        SELECT
          s.name, s.student_no, a.title,
          CASE WHEN sub.id IS NOT NULL THEN '已提交' ELSE '未提交' END as status,
          sub.score, sub.comment
        FROM students s
        CROSS JOIN assignments a
        LEFT JOIN submissions sub ON s.id = sub.student_id AND a.id = sub.assignment_id
        WHERE s.class_id = $1 AND a.class_id = $1
          AND a.created_at >= $2 AND a.created_at <= $3
        ORDER BY a.created_at DESC, s.student_no
        ${limitClause}
      `, [classId, start, end]);
      return studentAssignments.rows;

    case 'comprehensive':
      const comprehensive = await query(`
        SELECT
          s.name, s.student_no,
          COALESCE(
            (SELECT COUNT(CASE WHEN status = 'present' THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100
             FROM attendance_records WHERE student_id = s.id), 0
          ) as attendance_rate,
          COALESCE((SELECT SUM(change) FROM score_records WHERE student_id = s.id), 0) as total_score,
          COALESCE(
            (SELECT COUNT(sub.id)::float / NULLIF(COUNT(DISTINCT a.id), 0) * 100
             FROM assignments a
             LEFT JOIN submissions sub ON a.id = sub.assignment_id AND sub.student_id = s.id
             WHERE a.class_id = s.class_id), 0
          ) as submit_rate,
          COALESCE(
            (SELECT AVG(sub.score) FROM submissions sub
             JOIN assignments a ON sub.assignment_id = a.id
             WHERE sub.student_id = s.id AND sub.score IS NOT NULL), 0
          ) as avg_score
        FROM students s
        WHERE s.class_id = $1
        ORDER BY total_score DESC
        ${limitClause}
      `, [classId]);
      return comprehensive.rows.map((row, idx) => ({ ...row, rank: idx + 1 }));

    default:
      return [];
  }
}

// Get export configuration (columns and transform)
function getExportConfig(exportType) {
  const configs = {
    students: {
      columns: [
        { header: '学号', key: 'student_no', width: 15 },
        { header: '姓名', key: 'name', width: 12 },
        { header: '性别', key: 'gender', width: 8 },
        { header: '入班时间', key: 'created_at', width: 20 }
      ],
      transform: row => ({
        student_no: row.student_no || '',
        name: row.name,
        gender: row.gender || '',
        created_at: row.created_at ? new Date(row.created_at).toLocaleDateString('zh-CN') : ''
      })
    },
    attendance: {
      columns: [
        { header: '日期', key: 'date', width: 12 },
        { header: '姓名', key: 'name', width: 12 },
        { header: '学号', key: 'student_no', width: 15 },
        { header: '出勤状态', key: 'status', width: 12 }
      ],
      transform: row => ({
        date: new Date(row.date).toLocaleDateString('zh-CN'),
        name: row.name,
        student_no: row.student_no || '',
        status: { present: '出勤', absent: '缺勤', late: '迟到', leave: '请假' }[row.status] || row.status
      })
    },
    scores: {
      columns: [
        { header: '时间', key: 'created_at', width: 18 },
        { header: '姓名', key: 'name', width: 12 },
        { header: '学号', key: 'student_no', width: 15 },
        { header: '变动分值', key: 'change', width: 10 },
        { header: '原因', key: 'reason', width: 25 },
        { header: '变动后总分', key: 'cumulative', width: 12 }
      ],
      transform: row => ({
        created_at: new Date(row.created_at).toLocaleString('zh-CN'),
        name: row.name,
        student_no: row.student_no || '',
        change: row.change > 0 ? `+${row.change}` : row.change,
        reason: row.reason || '',
        cumulative: parseInt(row.cumulative)
      })
    },
    score_summary: {
      columns: [
        { header: '排名', key: 'rank', width: 8 },
        { header: '姓名', key: 'name', width: 12 },
        { header: '学号', key: 'student_no', width: 15 },
        { header: '总积分', key: 'total_score', width: 10 },
        { header: '本月积分', key: 'month_score', width: 10 }
      ],
      transform: row => ({
        rank: row.rank,
        name: row.name,
        student_no: row.student_no || '',
        total_score: parseInt(row.total_score),
        month_score: parseInt(row.month_score)
      })
    },
    assignments: {
      columns: [
        { header: '作业名称', key: 'title', width: 25 },
        { header: '布置时间', key: 'created_at', width: 18 },
        { header: '应交人数', key: 'total_students', width: 10 },
        { header: '已交人数', key: 'submitted', width: 10 },
        { header: '提交率', key: 'submit_rate', width: 10 },
        { header: '平均分', key: 'avg_score', width: 10 }
      ],
      transform: row => ({
        title: row.title,
        created_at: new Date(row.created_at).toLocaleDateString('zh-CN'),
        total_students: row.total_students,
        submitted: parseInt(row.submitted),
        submit_rate: `${row.submit_rate}%`,
        avg_score: parseFloat(row.avg_score).toFixed(1)
      })
    },
    student_assignments: {
      columns: [
        { header: '姓名', key: 'name', width: 12 },
        { header: '学号', key: 'student_no', width: 15 },
        { header: '作业名称', key: 'title', width: 25 },
        { header: '提交状态', key: 'status', width: 10 },
        { header: '得分', key: 'score', width: 8 },
        { header: '评语', key: 'comment', width: 30 }
      ],
      transform: row => ({
        name: row.name,
        student_no: row.student_no || '',
        title: row.title,
        status: row.status,
        score: row.score || '',
        comment: row.comment || ''
      })
    },
    comprehensive: {
      columns: [
        { header: '排名', key: 'rank', width: 8 },
        { header: '姓名', key: 'name', width: 12 },
        { header: '学号', key: 'student_no', width: 15 },
        { header: '出勤率', key: 'attendance_rate', width: 10 },
        { header: '总积分', key: 'total_score', width: 10 },
        { header: '作业提交率', key: 'submit_rate', width: 12 },
        { header: '作业平均分', key: 'avg_score', width: 12 }
      ],
      transform: row => ({
        rank: row.rank,
        name: row.name,
        student_no: row.student_no || '',
        attendance_rate: `${parseFloat(row.attendance_rate).toFixed(1)}%`,
        total_score: parseInt(row.total_score),
        submit_rate: `${parseFloat(row.submit_rate).toFixed(1)}%`,
        avg_score: parseFloat(row.avg_score).toFixed(1)
      })
    }
  };

  return configs[exportType] || configs.students;
}

// Get/set semester settings
export const getSemester = async (req, res) => {
  try {
    const userId = req.userId;
    const result = await query(
      'SELECT * FROM semesters WHERE user_id = $1 ORDER BY start_date DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: '获取学期设置失败' });
  }
};

export const setSemester = async (req, res) => {
  try {
    const { name, start_date, end_date, is_current } = req.body;
    const userId = req.userId;

    if (!name || !start_date || !end_date) {
      return res.status(400).json({ error: '学期名称和日期不能为空' });
    }

    // If setting as current, unset others first
    if (is_current) {
      await query(
        'UPDATE semesters SET is_current = false WHERE user_id = $1',
        [userId]
      );
    }

    const result = await query(`
      INSERT INTO semesters (user_id, name, start_date, end_date, is_current)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, name, start_date, end_date, is_current || false]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: '设置学期失败' });
  }
};
