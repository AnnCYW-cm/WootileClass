import express from 'express';
import { authMiddleware as authenticate } from '../middleware/auth.js';
import { getStudentComment, getLessonPlan, getClassSummary } from '../controllers/aiController.js';

const router = express.Router();

router.use(authenticate);

// AI student evaluation comment
router.get('/comment/student/:studentId', getStudentComment);

// AI lesson plan generation
router.post('/lesson-plan', getLessonPlan);

// AI class daily summary
router.get('/summary/class/:classId', getClassSummary);

export default router;
