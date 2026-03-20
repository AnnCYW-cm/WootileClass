import express from 'express';
import { authMiddleware as authenticate } from '../middleware/auth.js';
import { getStudentComment, getLessonPlan, getClassSummary } from '../controllers/aiController.js';
import { getCurriculum, getAvailableCurriculum } from '../config/curriculum.js';

const router = express.Router();

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

// AI student evaluation comment
router.get('/comment/student/:studentId', getStudentComment);

// AI lesson plan generation
router.post('/lesson-plan', getLessonPlan);

// AI class daily summary
router.get('/summary/class/:classId', getClassSummary);

export default router;
