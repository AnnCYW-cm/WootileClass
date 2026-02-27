import { query } from '../db/index.js';
import { MEMBERSHIP_LIMITS, LIMIT_MESSAGES, getLimits, checkLimit } from '../config/membershipLimits.js';

/**
 * 会员服务 - 处理会员权益检查
 */
export class MembershipService {
  /**
   * 获取用户会员状态
   */
  static async getUserMembershipType(userId) {
    const result = await query(
      'SELECT membership_type, membership_expires_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return 'free';
    }

    const user = result.rows[0];
    const now = new Date();
    const isActive = user.membership_type === 'premium' &&
                     user.membership_expires_at &&
                     new Date(user.membership_expires_at) > now;

    return isActive ? 'premium' : 'free';
  }

  /**
   * 获取用户的功能限制配置
   */
  static async getUserLimits(userId) {
    const membershipType = await this.getUserMembershipType(userId);
    return {
      membershipType,
      limits: getLimits(membershipType),
      isPremium: membershipType === 'premium'
    };
  }

  /**
   * 检查班级数量限制
   */
  static async checkClassLimit(userId) {
    const membershipType = await this.getUserMembershipType(userId);
    const limits = getLimits(membershipType);

    if (limits.maxClasses === -1) return { allowed: true };

    const result = await query(
      "SELECT COUNT(*) as count FROM classes WHERE user_id = $1 AND status = 'active'",
      [userId]
    );
    const currentCount = parseInt(result.rows[0].count);

    if (currentCount >= limits.maxClasses) {
      return {
        allowed: false,
        message: LIMIT_MESSAGES.maxClasses,
        current: currentCount,
        limit: limits.maxClasses
      };
    }

    return { allowed: true, current: currentCount, limit: limits.maxClasses };
  }

  /**
   * 检查班级学生数量限制
   */
  static async checkStudentLimit(userId, classId) {
    const membershipType = await this.getUserMembershipType(userId);
    const limits = getLimits(membershipType);

    if (limits.maxStudentsPerClass === -1) return { allowed: true };

    const result = await query(
      'SELECT COUNT(*) as count FROM students WHERE class_id = $1',
      [classId]
    );
    const currentCount = parseInt(result.rows[0].count);

    if (currentCount >= limits.maxStudentsPerClass) {
      return {
        allowed: false,
        message: LIMIT_MESSAGES.maxStudentsPerClass,
        current: currentCount,
        limit: limits.maxStudentsPerClass
      };
    }

    return { allowed: true, current: currentCount, limit: limits.maxStudentsPerClass };
  }

  /**
   * 检查课程数量限制
   */
  static async checkCourseLimit(userId) {
    const membershipType = await this.getUserMembershipType(userId);
    const limits = getLimits(membershipType);

    if (limits.maxCourses === -1) return { allowed: true };

    const result = await query(
      'SELECT COUNT(*) as count FROM courses WHERE user_id = $1',
      [userId]
    );
    const currentCount = parseInt(result.rows[0].count);

    if (currentCount >= limits.maxCourses) {
      return {
        allowed: false,
        message: LIMIT_MESSAGES.maxCourses,
        current: currentCount,
        limit: limits.maxCourses
      };
    }

    return { allowed: true, current: currentCount, limit: limits.maxCourses };
  }

  /**
   * 检查数据导出权限
   */
  static async checkExportAccess(userId) {
    const membershipType = await this.getUserMembershipType(userId);
    const limits = getLimits(membershipType);

    if (!limits.dataExport) {
      return {
        allowed: false,
        message: LIMIT_MESSAGES.dataExport
      };
    }

    return { allowed: true };
  }

  /**
   * 检查家长报告额度
   * 每月5份，不累计
   */
  static async checkParentReportLimit(userId) {
    const membershipType = await this.getUserMembershipType(userId);
    const limits = getLimits(membershipType);

    if (limits.parentReportsPerMonth === -1) return { allowed: true };

    // 获取本月已生成的报告数量
    const result = await query(
      `SELECT COUNT(*) as count FROM parent_reports
       WHERE student_id IN (
         SELECT s.id FROM students s
         JOIN classes c ON s.class_id = c.id
         WHERE c.user_id = $1
       )
       AND created_at >= date_trunc('month', CURRENT_DATE)
       AND created_at < date_trunc('month', CURRENT_DATE) + interval '1 month'`,
      [userId]
    );
    const currentCount = parseInt(result.rows[0].count);

    if (currentCount >= limits.parentReportsPerMonth) {
      return {
        allowed: false,
        message: LIMIT_MESSAGES.parentReportsPerMonth,
        current: currentCount,
        limit: limits.parentReportsPerMonth
      };
    }

    return {
      allowed: true,
      current: currentCount,
      limit: limits.parentReportsPerMonth,
      remaining: limits.parentReportsPerMonth - currentCount
    };
  }

  /**
   * 检查内置动画访问权限
   */
  static async checkBuiltinAnimationAccess(userId, animationCategory) {
    const membershipType = await this.getUserMembershipType(userId);
    const limits = getLimits(membershipType);

    // 'all' 表示可以访问全部动画
    if (limits.builtinAnimations === 'all') return { allowed: true };

    // 'basic' 表示只能访问基础动画（非 premium 标记的）
    // 这里假设有些动画标记为 premium
    // 实际实现时需要检查动画的 premium 标记
    return { allowed: true }; // 暂时允许所有
  }

  /**
   * 检查课程播放权限
   * 免费用户只能播放前 N 个课程（按创建时间倒序，最新的优先）
   */
  static async checkCoursePlayAccess(userId, courseId) {
    const membershipType = await this.getUserMembershipType(userId);
    const limits = getLimits(membershipType);

    // 会员无限制
    if (limits.maxCourses === -1) return { allowed: true };

    // 获取可以访问的课程ID列表（最新的 N 个课程）
    const result = await query(
      `SELECT id FROM courses ORDER BY created_at DESC LIMIT $1`,
      [limits.maxCourses]
    );

    const allowedCourseIds = result.rows.map(r => r.id);

    if (allowedCourseIds.includes(parseInt(courseId))) {
      return { allowed: true };
    }

    return {
      allowed: false,
      message: LIMIT_MESSAGES.maxCourses,
      limit: limits.maxCourses
    };
  }

  /**
   * 获取用户的使用情况统计
   */
  static async getUsageStats(userId) {
    const membershipType = await this.getUserMembershipType(userId);
    const limits = getLimits(membershipType);

    // 班级数量
    const classResult = await query(
      "SELECT COUNT(*) as count FROM classes WHERE user_id = $1 AND status = 'active'",
      [userId]
    );

    // 课程数量
    const courseResult = await query(
      'SELECT COUNT(*) as count FROM courses WHERE user_id = $1',
      [userId]
    );

    // 本月报告数量
    const reportResult = await query(
      `SELECT COUNT(*) as count FROM parent_reports
       WHERE student_id IN (
         SELECT s.id FROM students s
         JOIN classes c ON s.class_id = c.id
         WHERE c.user_id = $1
       )
       AND created_at >= date_trunc('month', CURRENT_DATE)
       AND created_at < date_trunc('month', CURRENT_DATE) + interval '1 month'`,
      [userId]
    );

    return {
      membershipType,
      isPremium: membershipType === 'premium',
      usage: {
        classes: {
          current: parseInt(classResult.rows[0].count),
          limit: limits.maxClasses,
          unlimited: limits.maxClasses === -1
        },
        courses: {
          current: parseInt(courseResult.rows[0].count),
          limit: limits.maxCourses,
          unlimited: limits.maxCourses === -1
        },
        parentReportsThisMonth: {
          current: parseInt(reportResult.rows[0].count),
          limit: limits.parentReportsPerMonth,
          unlimited: limits.parentReportsPerMonth === -1
        }
      },
      features: {
        dataExport: limits.dataExport,
        watermark: limits.watermark,
        prioritySupport: limits.prioritySupport
      }
    };
  }
}
