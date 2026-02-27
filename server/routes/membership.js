import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getPlans,
  getMembershipStatus,
  purchaseMembership,
  checkPremiumAccess,
  getUsageStats,
  getMembershipPlans
} from '../controllers/membershipController.js';

const router = express.Router();

// Public route - get available plans
router.get('/plans', getPlans);

// Protected routes
router.get('/status', authMiddleware, getMembershipStatus);
router.get('/usage', authMiddleware, getUsageStats);  // 获取使用量统计
router.get('/plans-detail', authMiddleware, getMembershipPlans);  // 获取详细方案和限制
router.post('/purchase', authMiddleware, purchaseMembership);

export default router;
