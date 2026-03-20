import express from 'express';
import multer from 'multer';
import { authMiddleware as authenticate } from '../middleware/auth.js';
import { getStudentComment, getLessonPlan, getClassSummary, uploadPPT } from '../controllers/aiController.js';
import { getCurriculum, getAvailableCurriculum } from '../config/curriculum.js';
import { query as dbQuery } from '../db/index.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/ppt/', limits: { fileSize: 50 * 1024 * 1024 } });

// Curriculum endpoints (no auth needed for browsing)
router.get('/curriculum', (req, res) => {
  res.json(getAvailableCurriculum());
});

router.get('/curriculum/:grade/:subject', (req, res) => {
  const { grade, subject } = req.params;
  const data = getCurriculum(grade, subject);
  if (!data) return res.status(404).json({ error: '暂无该年级学科的课程目录' });
  res.json(data);
});

router.use(authenticate);

// PPT upload and text extraction
router.post('/upload-ppt', upload.single('ppt'), uploadPPT);

// Get related course animations for a grade+subject
router.get('/related-animations/:grade/:subject', async (req, res) => {
  try {
    const { grade, subject } = req.params;
    const result = await dbQuery(
      `SELECT c.id, c.title, c.description, c.cover_image, c.status, c.view_count,
              (SELECT COUNT(*) FROM course_sections cs WHERE cs.course_id = c.id) as section_count,
              (SELECT COUNT(*) FROM animations a JOIN course_sections cs2 ON a.section_id = cs2.id WHERE cs2.course_id = c.id) as animation_count
       FROM courses c
       WHERE c.grade = $1 AND (c.subject = $2 OR c.subject IS NULL)
       AND c.status = 'published'
       ORDER BY c.view_count DESC
       LIMIT 6`,
      [grade, subject]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Related animations error:', error);
    res.status(500).json({ error: '获取相关动画失败: ' + error.message });
  }
});

// AI student evaluation comment
router.get('/comment/student/:studentId', getStudentComment);

// AI lesson plan generation
router.post('/lesson-plan', getLessonPlan);

// AI class daily summary
router.get('/summary/class/:classId', getClassSummary);

export default router;
