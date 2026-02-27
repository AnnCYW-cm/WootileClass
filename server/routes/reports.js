import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  previewReport,
  generateReport,
  batchGenerateReports,
  getReport,
  getReportByShareUrl,
  getReportHistory,
  getPresetComments,
  deleteReport
} from '../controllers/reportController.js';

const router = express.Router();

// Public route - share URL (no auth)
router.get('/share/:shareCode', getReportByShareUrl);

// Protected routes
router.use(authMiddleware);

router.post('/preview', previewReport);
router.post('/generate', generateReport);
router.post('/batch', batchGenerateReports);
router.get('/history', getReportHistory);
router.get('/comments', getPresetComments);
router.get('/:reportId', getReport);
router.delete('/:reportId', deleteReport);

export default router;
