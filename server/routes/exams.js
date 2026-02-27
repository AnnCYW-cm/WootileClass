import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getExams,
  createExam,
  getExam,
  updateExam,
  deleteExam,
  saveScores,
  importScores,
  getExamStats,
  getExamRanking,
  compareExams,
  getStudentReport
} from '../controllers/examController.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Exam CRUD
router.get('/class/:classId', getExams);
router.post('/', createExam);
router.get('/:examId', getExam);
router.put('/:examId', updateExam);
router.delete('/:examId', deleteExam);

// Scores
router.post('/:examId/scores', saveScores);
router.post('/:examId/scores/import', importScores);

// Stats and ranking
router.get('/:examId/stats', getExamStats);
router.get('/:examId/ranking', getExamRanking);

// Comparison
router.post('/compare', compareExams);

// Student report
router.get('/:examId/report/:studentId', getStudentReport);

export default router;
