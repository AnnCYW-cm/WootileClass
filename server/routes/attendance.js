import { Router } from 'express';
import {
  getAttendance,
  recordAttendance,
  batchRecordAttendance,
  getRandomStudent,
  getAttendanceStats
} from '../controllers/attendanceController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/class/:classId', getAttendance);
router.post('/class/:classId', recordAttendance);
router.post('/class/:classId/batch', batchRecordAttendance);
router.get('/class/:classId/random', getRandomStudent);
router.get('/class/:classId/stats', getAttendanceStats);

export default router;
