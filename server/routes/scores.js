import { Router } from 'express';
import {
  getClassScores,
  addScore,
  batchAddScore,
  getRanking,
  getStudentHistory,
  getPresets,
  createPreset,
  deletePreset,
  resetScores
} from '../controllers/scoreController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

// Class score routes
router.get('/class/:classId', getClassScores);
router.post('/class/:classId', addScore);
router.post('/class/:classId/batch', batchAddScore);
router.get('/class/:classId/ranking', getRanking);
router.delete('/class/:classId/reset', resetScores);

// Student history
router.get('/student/:studentId/history', getStudentHistory);

// Presets
router.get('/presets', getPresets);
router.post('/presets', createPreset);
router.delete('/presets/:id', deletePreset);

export default router;
