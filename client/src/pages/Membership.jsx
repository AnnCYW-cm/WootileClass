import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { membershipApi } from '../services/api';
import { useToastContext } from '../store/ToastContext';

export default function Membership() {
  const toast = useToastContext();
  const [plans, setPlans] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

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

  const openConfirm = (planKey) => {
    setSelectedPlan(planKey);
    setShowConfirm(true);
  };

  const handlePurchase = async () => {
    if (purchasing || !selectedPlan) return;

    try {
      setPurchasing(true);
      const result = await membershipApi.purchase({ plan: selectedPlan });
      setShowConfirm(false);
      // 更新状态数据后再显示成功弹窗
      const newStatus = await membershipApi.getStatus();
      setStatus(newStatus);
      setShowSuccess(true);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">会员中心</h1>

      {/* Current Status */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-medium mb-4">当前会员状态</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl ${
              status?.is_active ? 'bg-gradient-to-br from-purple-100 to-pink-100' : 'bg-gray-100'
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
                  <span className="text-purple-500 ml-2 font-medium">
                    (剩余 {status.days_remaining} 天)
                  </span>
                </p>
              )}
            </div>
          </div>
          {status?.is_active && (
            <span className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full font-medium">
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
            className="bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 rounded-2xl shadow-lg overflow-hidden border border-purple-100"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <span className="text-2xl">👑</span>
                    {plan.name}
                  </h3>
                  <div className="mt-2">
                    <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">¥{plan.price}</span>
                    <span className="text-gray-500">/年</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    约 ¥{(plan.price / 12).toFixed(0)}/月
                  </p>
                </div>
                <button
                  onClick={() => openConfirm(key)}
                  className="px-8 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 font-medium shadow-lg hover:shadow-xl transition-all text-base"
                >
                  {status?.is_active ? '续费会员' : '立即开通'}
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-purple-100">
                <p className="font-medium mb-3">会员权益</p>
                <div className="grid grid-cols-2 gap-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-purple-500">✓</span>
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-medium">如何付款？</h3>
            <p className="text-gray-600 mt-2">
              目前支持微信支付、支付宝等多种支付方式。点击购买后会跳转到支付页面。
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-medium">会员到期后怎么办？</h3>
            <p className="text-gray-600 mt-2">
              会员到期后，您仍可以使用基础功能。付费功能将被限制使用，您可以随时续费恢复。
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-medium">可以退款吗？</h3>
            <p className="text-gray-600 mt-2">
              购买后7天内，如未使用会员功能，可以申请全额退款。请联系客服处理。
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-medium">续费会延长有效期吗？</h3>
            <p className="text-gray-600 mt-2">
              是的，续费会在当前会员到期后延长相应时间，不会浪费任何一天。
            </p>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirm && selectedPlan && plans[selectedPlan] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !purchasing && setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 p-8 text-center text-white">
                <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">👑</span>
                </div>
                <h2 className="text-2xl font-bold mb-1">确认购买</h2>
                <p className="text-white/80">{plans[selectedPlan].name}</p>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
                    ¥{plans[selectedPlan].price}
                  </div>
                  <p className="text-gray-500">约 ¥{(plans[selectedPlan].price / 12).toFixed(0)}/月</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">会员权益包含：</p>
                  <div className="space-y-2">
                    {plans[selectedPlan].features.slice(0, 4).map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={purchasing}
                    className="flex-1 px-6 py-3.5 border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 font-medium shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {purchasing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        处理中...
                      </>
                    ) : (
                      '确认支付'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-md w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Success animation background */}
              <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 p-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2, duration: 0.6 }}
                  className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.4 }}
                  >
                    <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </motion.div>
                </motion.div>
              </div>

              <div className="p-8">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">购买成功！</h2>
                  <p className="text-gray-500 mb-8">恭喜您成为高级会员，尊享全部会员权益</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-5 mb-6 flex items-center gap-4"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">👑</span>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900">高级会员</p>
                    <p className="text-sm text-gray-500">有效期至 {status?.expires_at ? new Date(status.expires_at).toLocaleDateString('zh-CN') : '-'}</p>
                  </div>
                </motion.div>

                <button
                  onClick={() => setShowSuccess(false)}
                  className="w-full px-6 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 font-medium shadow-lg transition-all"
                >
                  开始使用
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
