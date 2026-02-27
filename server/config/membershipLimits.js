/**
 * 会员权益配置
 * 定义免费版和会员版的功能限制
 */

export const MEMBERSHIP_LIMITS = {
  free: {
    name: '免费版',
    limits: {
      maxClasses: 2,              // 最多创建2个班级
      maxStudentsPerClass: 50,    // 每班最多50人
      maxCourses: 3,              // 最多创建3个课程动画
      builtinAnimations: 'basic', // 只能使用基础动画库
      dataExport: false,          // 不支持数据导出
      parentReportsPerMonth: 5,   // 每月5份家长报告（不累计）
      dataRetention: 180,         // 数据保留180天（约1学期）
      watermark: true,            // 有水印
      prioritySupport: false,     // 普通客服
      maxVideoStorage: 500,       // 视频存储空间 500MB
      maxVideoCount: 5            // 最多上传5个视频
    }
  },
  premium: {
    name: '会员版',
    limits: {
      maxClasses: -1,             // 不限
      maxStudentsPerClass: -1,    // 不限
      maxCourses: -1,             // 不限
      builtinAnimations: 'all',   // 全部动画库
      dataExport: true,           // 支持数据导出
      parentReportsPerMonth: -1,  // 不限
      dataRetention: -1,          // 永久保留
      watermark: false,           // 无水印
      prioritySupport: true,      // 优先客服
      maxVideoStorage: -1,        // 视频存储空间不限
      maxVideoCount: -1           // 视频数量不限
    }
  }
};

// 会员方案定价
export const MEMBERSHIP_PLANS = {
  monthly: {
    id: 'monthly',
    name: '月度会员',
    price: 19.9,
    originalPrice: 29.9,
    duration: 30,
    features: ['全部功能解锁', '无限制使用']
  },
  quarterly: {
    id: 'quarterly',
    name: '季度会员',
    price: 49.9,
    originalPrice: 89.7,
    duration: 90,
    features: ['全部功能解锁', '无限制使用', '节省44%']
  },
  yearly: {
    id: 'yearly',
    name: '年度会员',
    price: 149.9,
    originalPrice: 358.8,
    duration: 365,
    features: ['全部功能解锁', '无限制使用', '节省58%', '最划算']
  }
};

// 功能限制错误信息
export const LIMIT_MESSAGES = {
  maxClasses: '免费版最多创建2个班级，升级会员解锁无限班级',
  maxStudentsPerClass: '免费版每班最多50人，升级会员解锁无限人数',
  maxCourses: '免费版最多创建3个课程，升级会员解锁无限课程',
  builtinAnimations: '此动画为会员专属，升级会员解锁全部动画库',
  dataExport: '数据导出为会员功能，升级会员解锁',
  parentReportsPerMonth: '本月家长报告额度已用完（免费版每月5份，不累计），升级会员解锁无限报告',
  watermark: '升级会员去除水印',
  maxVideoStorage: '免费版视频存储空间已满（500MB），升级会员解锁无限空间',
  maxVideoCount: '免费版最多上传5个视频，升级会员解锁无限上传'
};

/**
 * 获取用户的功能限制
 * @param {string} membershipType - 'free' 或 'premium'
 * @returns {object} 限制配置
 */
export const getLimits = (membershipType) => {
  return MEMBERSHIP_LIMITS[membershipType]?.limits || MEMBERSHIP_LIMITS.free.limits;
};

/**
 * 检查是否超出限制
 * @param {string} membershipType - 用户会员类型
 * @param {string} limitKey - 限制项
 * @param {number} currentCount - 当前数量
 * @returns {boolean} true 表示未超限，false 表示已超限
 */
export const checkLimit = (membershipType, limitKey, currentCount) => {
  const limits = getLimits(membershipType);
  const limit = limits[limitKey];

  // -1 表示不限
  if (limit === -1) return true;

  return currentCount < limit;
};
