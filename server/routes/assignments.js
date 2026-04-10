import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
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

// Multer config for student submission images
const submissionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/submissions';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const submissionUpload = multer({
  storage: submissionStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per image
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|heic/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype.split('/')[1]);
    cb(null, ext || mime);
  }
});

// Public routes (no auth required) - for student submission
router.get('/submit/:code', getAssignmentByCode);
router.post('/submit/:code/upload', submissionUpload.array('images', 9), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: '请上传图片' });
  }
  const urls = req.files.map(f => `/uploads/submissions/${f.filename}`);
  res.json({ urls });
});
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
