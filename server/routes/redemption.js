import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getRewards,
  createReward,
  updateReward,
  deleteReward,
  redeemReward,
  getRedemptionHistory,
  getStudentRedemptions
} from '../controllers/redemptionController.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Rewards CRUD
router.get('/classes/:classId/rewards', getRewards);
router.post('/classes/:classId/rewards', createReward);
router.put('/rewards/:id', updateReward);
router.delete('/rewards/:id', deleteReward);

// Redemption operations
router.post('/classes/:classId/redeem', redeemReward);
router.get('/classes/:classId/redemption-history', getRedemptionHistory);
router.get('/students/:studentId/redemptions', getStudentRedemptions);

export default router;
