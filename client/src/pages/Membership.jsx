import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { membershipApi } from '../services/api';

export default function Membership() {
  const [plans, setPlans] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, statusData] = await Promise.all([
        membershipApi.getPlans(),
        membershipApi.getStatus()
      ]);
      setPlans(plansData);
      setStatus(statusData);
    } catch (error) {
      console.error('Failed to load membership data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (plan) => {
    if (purchasing) return;

    if (!confirm(`确认购买${plans[plan].name}？价格：¥${plans[plan].price}`)) {
      return;
    }

    try {
      setPurchasing(true);
      await membershipApi.purchase({ plan });
      setShowSuccess(true);
      loadData();
    } catch (error) {
      alert(error.message);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">会员中心</h1>

      {/* Current Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-medium mb-4">当前会员状态</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
              status?.is_active ? 'bg-yellow-100' : 'bg-gray-100'
            }`}>
              {status?.is_active ? '👑' : '👤'}
            </div>
            <div>
              <p className="font-medium text-lg">
                {status?.is_active ? '高级会员' : '免费用户'}
              </p>
              {status?.is_active && status?.expires_at && (
                <p className="text-gray-500">
                  到期时间：{new Date(status.expires_at).toLocaleDateString('zh-CN')}
                  <span className="text-orange-500 ml-2">
                    (剩余 {status.days_remaining} 天)
                  </span>
                </p>
              )}
            </div>
          </div>
          {status?.is_active && (
            <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-medium">
              会员有效
            </span>
          )}
        </div>
      </div>

      {/* Plans */}
      <h2 className="text-lg font-medium mb-4">会员方案</h2>
      <div className="grid gap-6">
        {Object.entries(plans).map(([key, plan]) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-lg overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <span className="text-2xl">👑</span>
                    {plan.name}
                  </h3>
                  <div className="mt-2">
                    <span className="text-4xl font-bold text-orange-500">¥{plan.price}</span>
                    <span className="text-gray-500">/年</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    约 ¥{(plan.price / 12).toFixed(0)}/月
                  </p>
                </div>
                <button
                  onClick={() => handlePurchase(key)}
                  disabled={purchasing}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  {purchasing ? '处理中...' : status?.is_active ? '续费' : '立即开通'}
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-orange-100">
                <p className="font-medium mb-3">会员权益</p>
                <div className="grid grid-cols-2 gap-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <h2 className="text-lg font-medium mb-4">常见问题</h2>
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium">如何付款？</h3>
            <p className="text-gray-600 mt-2">
              目前支持微信支付、支付宝等多种支付方式。点击购买后会跳转到支付页面。
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium">会员到期后怎么办？</h3>
            <p className="text-gray-600 mt-2">
              会员到期后，您仍可以使用基础功能。付费功能将被限制使用，您可以随时续费恢复。
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium">可以退款吗？</h3>
            <p className="text-gray-600 mt-2">
              购买后7天内，如未使用会员功能，可以申请全额退款。请联系客服处理。
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium">续费会延长有效期吗？</h3>
            <p className="text-gray-600 mt-2">
              是的，续费会在当前会员到期后延长相应时间，不会浪费任何一天。
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowSuccess(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">购买成功！</h2>
            <p className="text-gray-600 mb-6">感谢您的支持，您已成为高级会员</p>
            <button
              onClick={() => setShowSuccess(false)}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              知道了
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
