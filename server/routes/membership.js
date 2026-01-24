import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getPlans,
  getMembershipStatus,
  purchaseMembership,
  checkPremiumAccess
} from '../controllers/membershipController.js';

const router = express.Router();

// Public route - get available plans
router.get('/plans', getPlans);

// Protected routes
router.get('/status', authMiddleware, getMembershipStatus);
router.post('/purchase', authMiddleware, purchaseMembership);

export default router;
