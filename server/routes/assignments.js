import { Router } from 'express';
import {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentByCode,
  getSubmissions,
  submitAssignment,
  teacherSubmit,
  gradeSubmission,
  batchGrade,
  getStatistics,
  getQuickComments,
  createQuickComment,
  deleteQuickComment
} from '../controllers/assignmentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Public routes (no auth required) - for student submission
router.get('/submit/:code', getAssignmentByCode);
router.post('/submit/:code', submitAssignment);

// Protected routes (auth required)
router.use(authMiddleware);

router.get('/', getAssignments);
router.get('/quick-comments', getQuickComments);
router.post('/quick-comments', createQuickComment);
router.delete('/quick-comments/:id', deleteQuickComment);

router.get('/:id', getAssignment);
router.post('/', createAssignment);
router.put('/:id', updateAssignment);
router.delete('/:id', deleteAssignment);

router.get('/:id/submissions', getSubmissions);
router.post('/:id/submissions', teacherSubmit);
router.put('/:id/submissions/batch', batchGrade);
router.get('/:id/statistics', getStatistics);

router.put('/submissions/:submissionId/grade', gradeSubmission);

export default router;
