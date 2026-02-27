import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getClassSummary,
  getAttendanceTrend,
  getScoreRanking,
  getAssignmentStats,
  getStudentSummary,
  getStudentScoreTrend,
  getStudentAttendanceCalendar,
  getStudentAssignments,
  getPendingTodos
} from '../controllers/dashboardController.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Class dashboard
router.get('/class/:classId/summary', getClassSummary);
router.get('/class/:classId/attendance-trend', getAttendanceTrend);
router.get('/class/:classId/score-ranking', getScoreRanking);
router.get('/class/:classId/assignment-stats', getAssignmentStats);

// Student dashboard
router.get('/student/:studentId/summary', getStudentSummary);
router.get('/student/:studentId/score-trend', getStudentScoreTrend);
router.get('/student/:studentId/attendance-calendar', getStudentAttendanceCalendar);
router.get('/student/:studentId/assignments', getStudentAssignments);

// Pending todos
router.get('/todos', getPendingTodos);

export default router;
