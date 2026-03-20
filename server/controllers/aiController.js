import { query } from '../db/index.js';
import { generateStudentComment, generateLessonPlan, generateClassSummary } from '../services/aiService.js';

// Generate comment for a single student
export const getStudentComment = async (req, res) => {
  try {
    const { studentId } = req.params;
    const userId = req.userId;

    // Verify student belongs to user's class
    const studentResult = await query(
      `SELECT s.*, c.name as class_name, c.user_id
       FROM students s
       JOIN classes c ON s.class_id = c.id
       WHERE s.id = $1`,
      [studentId]
    );

    if (studentResult.rows.length === 0) return res.status(404).json({ error: '学生不存在' });
    if (studentResult.rows[0].user_id !== userId) return res.status(403).json({ error: '无权限' });

    const student = studentResult.rows[0];

    // Get attendance data (last 30 days)
    const attendanceResult = await query(
      `SELECT status, COUNT(*) as count
       FROM attendance_records
       WHERE student_id = $1 AND date >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY status`,
      [studentId]
    );
    const attendance = { present: 0, absent: 0, late: 0, leave: 0 };
    attendanceResult.rows.forEach(r => { attendance[r.status] = parseInt(r.count); });
    const totalDays = Object.values(attendance).reduce((a, b) => a + b, 0);
    attendance.rate = totalDays > 0 ? Math.round((attendance.present / totalDays) * 100) : 0;

    // Get score data
    const scoreResult = await query(
      `SELECT COALESCE(SUM(change), 0) as total FROM score_records WHERE student_id = $1`,
      [studentId]
    );
    const rankResult = await query(
      `SELECT student_id, SUM(change) as total
       FROM score_records
       WHERE student_id IN (SELECT id FROM students WHERE class_id = $1)
       GROUP BY student_id
       ORDER BY total DESC`,
      [student.class_id]
    );
    const rank = rankResult.rows.findIndex(r => r.student_id === parseInt(studentId)) + 1;

    // Get top reasons for positive scores
    const reasonResult = await query(
      `SELECT reason, COUNT(*) as count
       FROM score_records
       WHERE student_id = $1 AND change > 0 AND reason IS NOT NULL AND reason != ''
       GROUP BY reason ORDER BY count DESC LIMIT 3`,
      [studentId]
    );

    // Get assignment data
    const assignmentResult = await query(
      `SELECT
         COUNT(DISTINCT a.id) as total_assignments,
         COUNT(DISTINCT sub.assignment_id) as submitted,
         ROUND(AVG(sub.score)::numeric, 1) as avg_score
       FROM assignments a
       LEFT JOIN submissions sub ON a.id = sub.assignment_id AND sub.student_id = $1
       WHERE a.class_id = $2`,
      [studentId, student.class_id]
    );
    const aData = assignmentResult.rows[0];

    const studentData = {
      id: student.id,
      name: student.name,
      studentNo: student.student_no,
      gender: student.gender,
      attendance,
      score: {
        total: parseInt(scoreResult.rows[0].total),
        rank,
        totalStudents: rankResult.rows.length,
        topReasons: reasonResult.rows.map(r => r.reason),
      },
      assignment: {
        submitRate: aData.total_assignments > 0 ? Math.round((aData.submitted / aData.total_assignments) * 100) : 0,
        avgScore: aData.avg_score || '无评分',
      },
    };

    const comment = await generateStudentComment(studentData);
    res.json({ comment, studentData });
  } catch (error) {
    console.error('AI comment error:', error);
    if (error.code === 'ECONNREFUSED' || error.message?.includes('API')) {
      return res.status(503).json({ error: 'AI 服务暂时不可用，请检查 AI_API_KEY 配置' });
    }
    res.status(500).json({ error: '生成评语失败：' + error.message });
  }
};

// Generate lesson plan
export const getLessonPlan = async (req, res) => {
  try {
    const { grade, subject, topic, duration, objectives, pptContent } = req.body;

    if (!grade || !subject || !topic) {
      return res.status(400).json({ error: '请填写年级、学科和课题' });
    }

    const plan = await generateLessonPlan({ grade, subject, topic, duration, objectives, pptContent });
    res.json({ plan });
  } catch (error) {
    console.error('AI lesson plan error:', error);
    if (error.code === 'ECONNREFUSED' || error.message?.includes('API')) {
      return res.status(503).json({ error: 'AI 服务暂时不可用，请检查 AI_API_KEY 配置' });
    }
    res.status(500).json({ error: '生成教案失败：' + error.message });
  }
};

// Upload PPT and extract text content
export const uploadPPT = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传PPT文件' });
    }

    const AdmZip = (await import('adm-zip')).default;
    const path = await import('path');
    const fs = await import('fs');

    const filePath = req.file.path;
    const ext = path.default.extname(req.file.originalname).toLowerCase();

    if (ext !== '.pptx') {
      fs.default.unlinkSync(filePath);
      return res.status(400).json({ error: '仅支持 .pptx 格式的PPT文件' });
    }

    // Extract text from PPTX
    const zip = new AdmZip(filePath);
    const entries = zip.getEntries();
    let slideTexts = [];

    entries.forEach(entry => {
      if (entry.entryName.match(/ppt\/slides\/slide\d+\.xml$/)) {
        const xml = entry.getData().toString('utf8');
        // Extract text between <a:t> tags
        const texts = [];
        const regex = /<a:t>([^<]*)<\/a:t>/g;
        let match;
        while ((match = regex.exec(xml)) !== null) {
          if (match[1].trim()) texts.push(match[1].trim());
        }
        if (texts.length > 0) {
          const slideNum = entry.entryName.match(/slide(\d+)/)[1];
          slideTexts.push({ slide: parseInt(slideNum), text: texts.join(' ') });
        }
      }
    });

    // Sort by slide number
    slideTexts.sort((a, b) => a.slide - b.slide);

    // Clean up uploaded file
    fs.default.unlinkSync(filePath);

    const fullText = slideTexts.map(s => `[第${s.slide}页] ${s.text}`).join('\n');

    res.json({
      slides: slideTexts.length,
      content: fullText,
      slideDetails: slideTexts,
    });
  } catch (error) {
    console.error('PPT upload error:', error);
    res.status(500).json({ error: '解析PPT失败：' + error.message });
  }
};

// Generate class summary
export const getClassSummary = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.userId;

    // Verify class ownership
    const classResult = await query('SELECT * FROM classes WHERE id = $1 AND user_id = $2', [classId, userId]);
    if (classResult.rows.length === 0) return res.status(404).json({ error: '班级不存在' });

    const cls = classResult.rows[0];
    const today = new Date().toISOString().split('T')[0];

    // Get today's stats
    const studentsResult = await query('SELECT COUNT(*) as count FROM students WHERE class_id = $1', [classId]);
    const totalStudents = parseInt(studentsResult.rows[0].count);

    const attendanceResult = await query(
      `SELECT status, COUNT(*) as count
       FROM attendance_records
       WHERE class_id = $1 AND date = $2
       GROUP BY status`,
      [classId, today]
    );
    const att = { present: 0, absent: 0, late: 0, leave: 0 };
    attendanceResult.rows.forEach(r => { att[r.status] = parseInt(r.count); });

    const scoreResult = await query(
      `SELECT
         COUNT(CASE WHEN change > 0 THEN 1 END) as added,
         COUNT(CASE WHEN change < 0 THEN 1 END) as deducted
       FROM score_records
       WHERE class_id = $1 AND DATE(created_at) = $2`,
      [classId, today]
    );

    const classData = {
      className: cls.name,
      date: today,
      totalStudents,
      present: att.present,
      absent: att.absent,
      late: att.late,
      leave: att.leave,
      scoreAdded: parseInt(scoreResult.rows[0]?.added || 0),
      scoreDeducted: parseInt(scoreResult.rows[0]?.deducted || 0),
      assignmentsDue: 0,
      submitRate: 0,
    };

    const summary = await generateClassSummary(classData);
    res.json({ summary, data: classData });
  } catch (error) {
    console.error('AI class summary error:', error);
    res.status(500).json({ error: '生成课堂小结失败：' + error.message });
  }
};
