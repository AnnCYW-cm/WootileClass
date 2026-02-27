import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getSeating,
  saveSeating,
  randomSeating,
  autoSeating,
  getSeatingHistory,
  toggleSeatLock
} from '../controllers/seatingController.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Seating routes
router.get('/:classId', getSeating);
router.post('/:classId', saveSeating);
router.post('/:classId/random', randomSeating);
router.post('/:classId/auto', autoSeating);
router.get('/:classId/history', getSeatingHistory);
router.put('/assignment/:assignmentId/lock', toggleSeatLock);

export default router;
