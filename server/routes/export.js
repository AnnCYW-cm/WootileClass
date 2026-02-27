import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  previewExport,
  downloadExport,
  getSemester,
  setSemester
} from '../controllers/exportController.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Export routes
router.post('/preview', previewExport);
router.post('/download', downloadExport);

// Semester settings
router.get('/semester', getSemester);
router.post('/semester', setSemester);

export default router;
