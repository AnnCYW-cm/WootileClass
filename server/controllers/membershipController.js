import { query } from '../db/index.js';
import { MembershipService } from '../services/MembershipService.js';
import { MEMBERSHIP_PLANS as PLANS_CONFIG, MEMBERSHIP_LIMITS } from '../config/membershipLimits.js';

// Membership plans configuration
const MEMBERSHIP_PLANS = {
  yearly: {
    name: '年度会员',
    price: 1500,
    duration: 365, // days
    features: [
      '无限制创建班级',
      '全部点名模式',
      '学生积分系统',
      '作业管理系统',
      '数据统计导出',
      '课堂工具全套',
      '优先客服支持'
    ]
  }
};

// Get membership plans
export const getPlans = async (req, res) => {
  try {
    res.json(MEMBERSHIP_PLANS);
  } catch (error) {
    res.status(500).json({ error: '获取会员方案失败' });
  }
};

// Get current user's membership status
export const getMembershipStatus = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, name, membership_type, membership_expires_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const user = result.rows[0];
    const now = new Date();
    const isActive = user.membership_type === 'premium' &&
                     user.membership_expires_at &&
                     new Date(user.membership_expires_at) > now;

    res.json({
      membership_type: isActive ? 'premium' : 'free',
      expires_at: user.membership_expires_at,
      is_active: isActive,
      days_remaining: isActive ? Math.ceil((new Date(user.membership_expires_at) - now) / (1000 * 60 * 60 * 24)) : 0
    });
  } catch (error) {
    res.status(500).json({ error: '获取会员状态失败' });
  }
};

// Purchase membership (simulated - no real payment)
export const purchaseMembership = async (req, res) => {
  try {
    const { plan } = req.body;

    if (!MEMBERSHIP_PLANS[plan]) {
      return res.status(400).json({ error: '无效的会员方案' });
    }

    const planDetails = MEMBERSHIP_PLANS[plan];

    // Get current membership
    const userResult = await query(
      'SELECT membership_type, membership_expires_at FROM users WHERE id = $1',
      [req.userId]
    );
    const user = userResult.rows[0];

    // Calculate new expiration date
    let expiresAt;
    const now = new Date();

    if (user.membership_type === 'premium' &&
        user.membership_expires_at &&
        new Date(user.membership_expires_at) > now) {
      // Extend existing membership
      expiresAt = new Date(user.membership_expires_at);
      expiresAt.setDate(expiresAt.getDate() + planDetails.duration);
    } else {
      // New membership
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + planDetails.duration);
    }

    // Update user membership
    await query(
      `UPDATE users SET membership_type = 'premium', membership_expires_at = $1 WHERE id = $2`,
      [expiresAt.toISOString(), req.userId]
    );

    res.json({
      message: '会员购买成功',
      membership_type: 'premium',
      expires_at: expiresAt.toISOString(),
      plan: planDetails.name,
      price: planDetails.price
    });
  } catch (error) {
    res.status(500).json({ error: '购买会员失败' });
  }
};

// Check if user has premium features access
export const checkPremiumAccess = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT membership_type, membership_expires_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: '用户不存在' });
    }

    const user = result.rows[0];
    const now = new Date();
    const isActive = user.membership_type === 'premium' &&
                     user.membership_expires_at &&
                     new Date(user.membership_expires_at) > now;

    // For MVP, we allow all features for all users
    // In production, you would check isActive here
    req.isPremium = isActive;
    next();
  } catch (error) {
    res.status(500).json({ error: '检查会员状态失败' });
  }
};

// Get user's usage statistics and limits
export const getUsageStats = async (req, res) => {
  try {
    const stats = await MembershipService.getUsageStats(req.userId);

    // 获取会员到期时间
    const userResult = await query(
      'SELECT membership_expires_at FROM users WHERE id = $1',
      [req.userId]
    );
    const user = userResult.rows[0];

    res.json({
      ...stats,
      expiresAt: user?.membership_expires_at,
      daysRemaining: stats.isPremium && user?.membership_expires_at
        ? Math.ceil((new Date(user.membership_expires_at) - new Date()) / (1000 * 60 * 60 * 24))
        : null
    });
  } catch (error) {
    res.status(500).json({ error: '获取使用统计失败' });
  }
};

// Get membership plans with pricing
export const getMembershipPlans = async (req, res) => {
  try {
    res.json({
      plans: PLANS_CONFIG,
      limits: {
        free: MEMBERSHIP_LIMITS.free,
        premium: MEMBERSHIP_LIMITS.premium
      }
    });
  } catch (error) {
    res.status(500).json({ error: '获取会员方案失败' });
  }
};
