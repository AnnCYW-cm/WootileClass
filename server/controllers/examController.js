import { query } from '../db/index.js';

// Get all exams for a class
export const getExams = async (req, res) => {
  try {
    const { classId } = req.params;
    const { semester_id } = req.query;
    const userId = req.userId;

    const classCheck = await query(
      'SELECT id, subject FROM classes WHERE id = $1 AND user_id = $2',
      [classId, userId]
    );
    if (classCheck.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    let dateFilter = '';
    if (semester_id) {
      const semester = await query('SELECT start_date, end_date FROM semesters WHERE id = $1', [semester_id]);
      if (semester.rows.length > 0) {
        dateFilter = `AND exam_date >= '${semester.rows[0].start_date}' AND exam_date <= '${semester.rows[0].end_date}'`;
      }
    }

    const result = await query(`
      SELECT e.*,
        (SELECT COUNT(*) FROM exam_scores WHERE exam_id = e.id AND score IS NOT NULL) as graded_count,
        (SELECT COUNT(*) FROM students WHERE class_id = e.class_id) as total_students
      FROM exams e
      WHERE e.class_id = $1 ${dateFilter}
      ORDER BY e.exam_date DESC, e.created_at DESC
    `, [classId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({ error: '获取考试列表失败' });
  }
};

// Create exam
export const createExam = async (req, res) => {
  try {
    const { class_id, name, subject, exam_date, full_score, pass_score } = req.body;
    const userId = req.userId;

    if (!class_id || !name) {
      return res.status(400).json({ error: '班级和考试名称不能为空' });
    }

    const classCheck = await query(
      'SELECT id, subject FROM classes WHERE id = $1 AND user_id = $2',
      [class_id, userId]
    );
    if (classCheck.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    const result = await query(`
      INSERT INTO exams (class_id, user_id, name, subject, exam_date, full_score, pass_score)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      class_id,
      userId,
      name,
      subject || classCheck.rows[0].subject || '',
      exam_date || new Date(),
      full_score || 100,
      pass_score || 60
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ error: '创建考试失败' });
  }
};

// Get exam details
export const getExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.userId;

    const result = await query(`
      SELECT e.* FROM exams e
      JOIN classes c ON e.class_id = c.id
      WHERE e.id = $1 AND c.user_id = $2
    `, [examId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '考试不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({ error: '获取考试详情失败' });
  }
};

// Update exam
export const updateExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { name, subject, exam_date, full_score, pass_score } = req.body;
    const userId = req.userId;

    const check = await query(`
      SELECT e.id FROM exams e
      JOIN classes c ON e.class_id = c.id
      WHERE e.id = $1 AND c.user_id = $2
    `, [examId, userId]);

    if (check.rows.length === 0) {
      return res.status(404).json({ error: '考试不存在' });
    }

    const result = await query(`
      UPDATE exams SET
        name = COALESCE($1, name),
        subject = COALESCE($2, subject),
        exam_date = COALESCE($3, exam_date),
        full_score = COALESCE($4, full_score),
        pass_score = COALESCE($5, pass_score)
      WHERE id = $6
      RETURNING *
    `, [name, subject, exam_date, full_score, pass_score, examId]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({ error: '更新考试失败' });
  }
};

// Delete exam
export const deleteExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.userId;

    const check = await query(`
      SELECT e.id FROM exams e
      JOIN classes c ON e.class_id = c.id
      WHERE e.id = $1 AND c.user_id = $2
    `, [examId, userId]);

    if (check.rows.length === 0) {
      return res.status(404).json({ error: '考试不存在' });
    }

    await query('DELETE FROM exams WHERE id = $1', [examId]);
    res.json({ message: '考试已删除' });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({ error: '删除考试失败' });
  }
};

// Save scores (create or update)
export const saveScores = async (req, res) => {
  try {
    const { examId } = req.params;
    const { scores } = req.body; // Array of { student_id, score, comment }
    const userId = req.userId;

    const check = await query(`
      SELECT e.id, e.class_id FROM exams e
      JOIN classes c ON e.class_id = c.id
      WHERE e.id = $1 AND c.user_id = $2
    `, [examId, userId]);

    if (check.rows.length === 0) {
      return res.status(404).json({ error: '考试不存在' });
    }

    if (!scores || !Array.isArray(scores)) {
      return res.status(400).json({ error: '成绩数据格式错误' });
    }

    const results = [];
    for (const s of scores) {
      if (s.student_id !== undefined) {
        const result = await query(`
          INSERT INTO exam_scores (exam_id, student_id, score, comment, updated_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (exam_id, student_id)
          DO UPDATE SET score = $3, comment = $4, updated_at = NOW()
          RETURNING *
        `, [examId, s.student_id, s.score, s.comment || null]);
        results.push(result.rows[0]);
      }
    }

    // Update rankings
    await updateRankings(examId);

    res.json({ message: '成绩保存成功', count: results.length });
  } catch (error) {
    console.error('Save scores error:', error);
    res.status(500).json({ error: '保存成绩失败' });
  }
};

// Import scores from Excel data
export const importScores = async (req, res) => {
  try {
    const { examId } = req.params;
    const { data } = req.body; // Array from Excel: [{ student_no, name, score }]
    const userId = req.userId;

    const check = await query(`
      SELECT e.id, e.class_id FROM exams e
      JOIN classes c ON e.class_id = c.id
      WHERE e.id = $1 AND c.user_id = $2
    `, [examId, userId]);

    if (check.rows.length === 0) {
      return res.status(404).json({ error: '考试不存在' });
    }

    const classId = check.rows[0].class_id;

    // Get all students in class
    const students = await query(
      'SELECT id, student_no, name FROM students WHERE class_id = $1',
      [classId]
    );

    const studentMap = new Map();
    students.rows.forEach(s => {
      if (s.student_no) studentMap.set(s.student_no, s.id);
      studentMap.set(s.name, s.id);
    });

    let imported = 0;
    let failed = [];

    for (const row of data) {
      const studentId = studentMap.get(row.student_no) || studentMap.get(row['学号']) ||
                       studentMap.get(row.name) || studentMap.get(row['姓名']);

      if (studentId) {
        const score = parseFloat(row.score || row['成绩'] || row['分数']);
        if (!isNaN(score)) {
          await query(`
            INSERT INTO exam_scores (exam_id, student_id, score, updated_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (exam_id, student_id)
            DO UPDATE SET score = $3, updated_at = NOW()
          `, [examId, studentId, score]);
          imported++;
        }
      } else {
        failed.push(row.student_no || row['学号'] || row.name || row['姓名']);
      }
    }

    // Update rankings
    await updateRankings(examId);

    res.json({
      message: `成功导入 ${imported} 条成绩`,
      imported,
      failed
    });
  } catch (error) {
    console.error('Import scores error:', error);
    res.status(500).json({ error: '导入成绩失败' });
  }
};

// Get exam statistics
export const getExamStats = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.userId;

    const check = await query(`
      SELECT e.*, c.name as class_name FROM exams e
      JOIN classes c ON e.class_id = c.id
      WHERE e.id = $1 AND c.user_id = $2
    `, [examId, userId]);

    if (check.rows.length === 0) {
      return res.status(404).json({ error: '考试不存在' });
    }

    const exam = check.rows[0];

    // Get statistics
    const stats = await query(`
      SELECT
        COUNT(*) FILTER (WHERE score IS NOT NULL) as graded_count,
        COUNT(*) FILTER (WHERE score IS NULL) as absent_count,
        AVG(score) as avg_score,
        MAX(score) as max_score,
        MIN(score) as min_score,
        STDDEV(score) as std_dev,
        COUNT(*) FILTER (WHERE score >= $2) as pass_count,
        COUNT(*) FILTER (WHERE score >= $3 * 0.9) as excellent_count
      FROM exam_scores es
      JOIN students s ON es.student_id = s.id
      WHERE es.exam_id = $1
    `, [examId, exam.pass_score, exam.full_score]);

    // Get total students
    const totalResult = await query(
      'SELECT COUNT(*) as count FROM students WHERE class_id = $1',
      [exam.class_id]
    );
    const totalStudents = parseInt(totalResult.rows[0].count);

    const statRow = stats.rows[0];
    const gradedCount = parseInt(statRow.graded_count) || 0;

    // Get score distribution
    const distribution = await query(`
      SELECT
        CASE
          WHEN score >= 90 THEN '90-100'
          WHEN score >= 80 THEN '80-89'
          WHEN score >= 70 THEN '70-79'
          WHEN score >= 60 THEN '60-69'
          ELSE '0-59'
        END as range,
        COUNT(*) as count
      FROM exam_scores
      WHERE exam_id = $1 AND score IS NOT NULL
      GROUP BY range
      ORDER BY range DESC
    `, [examId]);

    res.json({
      exam,
      stats: {
        total_students: totalStudents,
        graded_count: gradedCount,
        absent_count: parseInt(statRow.absent_count) || 0,
        avg_score: parseFloat(statRow.avg_score) || 0,
        max_score: parseFloat(statRow.max_score) || 0,
        min_score: parseFloat(statRow.min_score) || 0,
        std_dev: parseFloat(statRow.std_dev) || 0,
        pass_count: parseInt(statRow.pass_count) || 0,
        pass_rate: gradedCount > 0 ? (parseInt(statRow.pass_count) / gradedCount * 100) : 0,
        excellent_count: parseInt(statRow.excellent_count) || 0,
        excellent_rate: gradedCount > 0 ? (parseInt(statRow.excellent_count) / gradedCount * 100) : 0
      },
      distribution: distribution.rows
    });
  } catch (error) {
    console.error('Get exam stats error:', error);
    res.status(500).json({ error: '获取成绩统计失败' });
  }
};

// Get exam ranking
export const getExamRanking = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.userId;

    const check = await query(`
      SELECT e.id, e.full_score, e.pass_score FROM exams e
      JOIN classes c ON e.class_id = c.id
      WHERE e.id = $1 AND c.user_id = $2
    `, [examId, userId]);

    if (check.rows.length === 0) {
      return res.status(404).json({ error: '考试不存在' });
    }

    const exam = check.rows[0];

    // Get class average
    const avgResult = await query(
      'SELECT AVG(score) as avg FROM exam_scores WHERE exam_id = $1 AND score IS NOT NULL',
      [examId]
    );
    const classAvg = parseFloat(avgResult.rows[0].avg) || 0;

    const result = await query(`
      SELECT
        es.rank,
        s.id as student_id,
        s.name,
        s.student_no,
        es.score,
        es.comment,
        CASE
          WHEN es.score >= $2 * 0.9 THEN '优秀'
          WHEN es.score >= $2 * 0.8 THEN '良好'
          WHEN es.score >= $3 THEN '及格'
          ELSE '不及格'
        END as grade
      FROM exam_scores es
      JOIN students s ON es.student_id = s.id
      WHERE es.exam_id = $1
      ORDER BY es.rank NULLS LAST, s.student_no
    `, [examId, exam.full_score, exam.pass_score]);

    // Add diff from average
    const ranking = result.rows.map(row => ({
      ...row,
      diff_from_avg: row.score !== null ? (row.score - classAvg).toFixed(1) : null
    }));

    res.json(ranking);
  } catch (error) {
    console.error('Get exam ranking error:', error);
    res.status(500).json({ error: '获取排名失败' });
  }
};

// Compare two exams (progress analysis)
export const compareExams = async (req, res) => {
  try {
    const { exam_id_1, exam_id_2 } = req.body;
    const userId = req.userId;

    // Verify both exams belong to user
    const examsCheck = await query(`
      SELECT e.id, e.name, e.exam_date, e.class_id FROM exams e
      JOIN classes c ON e.class_id = c.id
      WHERE e.id IN ($1, $2) AND c.user_id = $3
    `, [exam_id_1, exam_id_2, userId]);

    if (examsCheck.rows.length !== 2) {
      return res.status(404).json({ error: '考试不存在' });
    }

    // Determine which is earlier
    const exam1 = examsCheck.rows.find(e => e.id == exam_id_1);
    const exam2 = examsCheck.rows.find(e => e.id == exam_id_2);

    const result = await query(`
      SELECT
        s.id as student_id,
        s.name,
        s.student_no,
        es1.score as score_1,
        es1.rank as rank_1,
        es2.score as score_2,
        es2.rank as rank_2,
        (es2.score - es1.score) as score_change,
        (es1.rank - es2.rank) as rank_change
      FROM students s
      LEFT JOIN exam_scores es1 ON s.id = es1.student_id AND es1.exam_id = $1
      LEFT JOIN exam_scores es2 ON s.id = es2.student_id AND es2.exam_id = $2
      WHERE s.class_id = $3
      ORDER BY rank_change DESC NULLS LAST
    `, [exam_id_1, exam_id_2, exam1.class_id]);

    // Add progress labels
    const comparison = result.rows.map(row => {
      let label = '稳定';
      if (row.rank_change >= 5 || row.score_change >= 10) {
        label = '显著进步';
      } else if (row.rank_change <= -5 || row.score_change <= -10) {
        label = '显著退步';
      } else if (row.rank_change > 0 || row.score_change > 0) {
        label = '进步';
      } else if (row.rank_change < 0 || row.score_change < 0) {
        label = '退步';
      }
      return { ...row, label };
    });

    res.json({
      exam_1: exam1,
      exam_2: exam2,
      comparison
    });
  } catch (error) {
    console.error('Compare exams error:', error);
    res.status(500).json({ error: '对比分析失败' });
  }
};

// Generate score report for a student
export const getStudentReport = async (req, res) => {
  try {
    const { examId, studentId } = req.params;
    const userId = req.userId;

    const check = await query(`
      SELECT e.*, c.name as class_name FROM exams e
      JOIN classes c ON e.class_id = c.id
      WHERE e.id = $1 AND c.user_id = $2
    `, [examId, userId]);

    if (check.rows.length === 0) {
      return res.status(404).json({ error: '考试不存在' });
    }

    const exam = check.rows[0];

    // Get student score
    const scoreResult = await query(`
      SELECT es.*, s.name, s.student_no
      FROM exam_scores es
      JOIN students s ON es.student_id = s.id
      WHERE es.exam_id = $1 AND es.student_id = $2
    `, [examId, studentId]);

    if (scoreResult.rows.length === 0) {
      return res.status(404).json({ error: '学生成绩不存在' });
    }

    const studentScore = scoreResult.rows[0];

    // Get class stats
    const statsResult = await query(`
      SELECT
        AVG(score) as avg_score,
        MAX(score) as max_score,
        COUNT(*) as total
      FROM exam_scores
      WHERE exam_id = $1 AND score IS NOT NULL
    `, [examId]);

    const stats = statsResult.rows[0];

    // Determine grade
    let grade = '不及格';
    if (studentScore.score >= exam.full_score * 0.9) grade = '优秀';
    else if (studentScore.score >= exam.full_score * 0.8) grade = '良好';
    else if (studentScore.score >= exam.pass_score) grade = '及格';

    res.json({
      student: {
        name: studentScore.name,
        student_no: studentScore.student_no,
        class_name: exam.class_name
      },
      exam: {
        name: exam.name,
        subject: exam.subject,
        exam_date: exam.exam_date,
        full_score: exam.full_score
      },
      result: {
        score: studentScore.score,
        rank: studentScore.rank,
        total_students: parseInt(stats.total),
        grade,
        comment: studentScore.comment
      },
      class_stats: {
        avg_score: parseFloat(stats.avg_score) || 0,
        max_score: parseFloat(stats.max_score) || 0
      }
    });
  } catch (error) {
    console.error('Get student report error:', error);
    res.status(500).json({ error: '获取成绩报告失败' });
  }
};

// Helper: Update rankings for an exam
async function updateRankings(examId) {
  await query(`
    WITH ranked AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY score DESC NULLS LAST) as new_rank
      FROM exam_scores
      WHERE exam_id = $1 AND score IS NOT NULL
    )
    UPDATE exam_scores es
    SET rank = r.new_rank
    FROM ranked r
    WHERE es.id = r.id
  `, [examId]);
}
