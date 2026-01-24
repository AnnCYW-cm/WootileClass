import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { classesApi, studentsApi, scoresApi, redemptionApi } from '../services/api';

const REWARD_ICONS = ['🎁', '🏆', '⭐', '🎮', '📚', '🍬', '🎯', '🎪', '🎨', '🎵', '🎫', '🍕'];

export default function Redemption() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [currentClass, setCurrentClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [history, setHistory] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rewards');
  const [showModal, setShowModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedReward, setSelectedReward] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    points_required: 10,
    icon: '🎁',
    stock: -1
  });

  useEffect(() => {
    if (classId) {
      loadData();
    }
  }, [classId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classData, studentsData, rewardsData, historyData, rankingsData] = await Promise.all([
        classesApi.get(classId),
        studentsApi.getByClass(classId),
        redemptionApi.getRewards(classId),
        redemptionApi.getHistory(classId),
        scoresApi.getRanking(classId, 'all')
      ]);
      setCurrentClass(classData);
      setStudents(studentsData);
      setRewards(rewardsData);
      setHistory(historyData);
      setRankings(rankingsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingReward) {
        await redemptionApi.updateReward(editingReward.id, formData);
      } else {
        await redemptionApi.createReward(classId, formData);
      }
      setShowModal(false);
      setEditingReward(null);
      setFormData({ name: '', description: '', points_required: 10, icon: '🎁', stock: -1 });
      loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = (reward) => {
    setEditingReward(reward);
    setFormData({
      name: reward.name,
      description: reward.description || '',
      points_required: reward.points_required,
      icon: reward.icon || '🎁',
      stock: reward.stock
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个奖品吗？')) return;
    try {
      await redemptionApi.deleteReward(id);
      loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleRedeemClick = (reward) => {
    setSelectedReward(reward);
    setShowRedeemModal(true);
  };

  const handleRedeem = async () => {
    if (!selectedStudent || !selectedReward) return;
    try {
      await redemptionApi.redeem(classId, {
        student_id: selectedStudent.id,
        reward_id: selectedReward.id
      });
      alert('兑换成功！');
      setShowRedeemModal(false);
      setSelectedStudent(null);
      setSelectedReward(null);
      loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  const getStudentScore = (studentId) => {
    const ranking = rankings.find(r => r.id === studentId);
    return ranking ? ranking.total_score : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">积分兑换</h1>
          <p className="text-gray-600">{currentClass?.name}</p>
        </div>
        <button
          onClick={() => navigate('/scores')}
          className="text-gray-600 hover:text-gray-900"
        >
          返回积分管理
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('rewards')}
          className={`px-6 py-3 font-medium ${
            activeTab === 'rewards'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          奖品管理
        </button>
        <button
          onClick={() => setActiveTab('redeem')}
          className={`px-6 py-3 font-medium ${
            activeTab === 'redeem'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          快速兑换
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 font-medium ${
            activeTab === 'history'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          兑换记录
        </button>
      </div>

      {/* Rewards Management Tab */}
      {activeTab === 'rewards' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                setEditingReward(null);
                setFormData({ name: '', description: '', points_required: 10, icon: '🎁', stock: -1 });
                setShowModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              添加奖品
            </button>
          </div>

          {rewards.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-4">🎁</p>
              <p>还没有设置奖品</p>
              <p className="text-sm">点击"添加奖品"创建第一个兑换奖品</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((reward) => (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-lg shadow p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{reward.icon || '🎁'}</span>
                      <div>
                        <h3 className="font-medium">{reward.name}</h3>
                        <p className="text-sm text-gray-500">{reward.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(reward)}
                        className="text-gray-500 hover:text-blue-600"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(reward.id)}
                        className="text-gray-500 hover:text-red-600"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-orange-500 font-bold">{reward.points_required} 积分</span>
                    <span className="text-sm text-gray-500">
                      {reward.stock === -1 ? '不限量' : `剩余 ${reward.stock} 件`}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRedeemClick(reward)}
                    className="mt-3 w-full py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    兑换
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Redeem Tab */}
      {activeTab === 'redeem' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student List with Scores */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium mb-4">选择学生</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {rankings.map((student) => (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                    selectedStudent?.id === student.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <span>{student.name}</span>
                  <span className="text-orange-500 font-bold">{student.total_score} 分</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rewards List */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium mb-4">选择奖品</h3>
            {rewards.length === 0 ? (
              <p className="text-center py-8 text-gray-500">暂无奖品</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {rewards.map((reward) => (
                  <div
                    key={reward.id}
                    onClick={() => {
                      if (selectedStudent && getStudentScore(selectedStudent.id) >= reward.points_required) {
                        setSelectedReward(reward);
                      }
                    }}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                      selectedReward?.id === reward.id
                        ? 'bg-orange-50 border-2 border-orange-500'
                        : selectedStudent && getStudentScore(selectedStudent.id) < reward.points_required
                        ? 'bg-gray-100 opacity-50 cursor-not-allowed'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{reward.icon || '🎁'}</span>
                      <span>{reward.name}</span>
                    </div>
                    <span className="text-orange-500 font-bold">{reward.points_required} 分</span>
                  </div>
                ))}
              </div>
            )}

            {selectedStudent && selectedReward && (
              <button
                onClick={handleRedeem}
                className="mt-4 w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
              >
                确认兑换：{selectedStudent.name} 兑换 {selectedReward.name}
              </button>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow">
          {history.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-4">📋</p>
              <p>暂无兑换记录</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">学生</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">奖品</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">消耗积分</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">兑换时间</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {history.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-3">
                      {record.student_name}
                      <span className="text-gray-400 text-sm ml-2">{record.student_no}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="mr-2">{record.icon}</span>
                      {record.reward_name}
                    </td>
                    <td className="px-4 py-3 text-orange-500">-{record.points_spent}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(record.redeemed_at).toLocaleString('zh-CN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add/Edit Reward Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">
                {editingReward ? '编辑奖品' : '添加奖品'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">奖品名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="如：免作业一次"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">描述（选填）</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="奖品描述"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">所需积分</label>
                  <input
                    type="number"
                    value={formData.points_required}
                    onChange={(e) => setFormData({ ...formData, points_required: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">图标</label>
                  <div className="flex flex-wrap gap-2">
                    {REWARD_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`text-2xl p-2 rounded-lg ${
                          formData.icon === icon
                            ? 'bg-blue-100 border-2 border-blue-500'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">库存</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={formData.stock === -1}
                        onChange={() => setFormData({ ...formData, stock: -1 })}
                      />
                      不限量
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={formData.stock !== -1}
                        onChange={() => setFormData({ ...formData, stock: 10 })}
                      />
                      限量
                      {formData.stock !== -1 && (
                        <input
                          type="number"
                          value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                          className="w-20 px-2 py-1 border rounded"
                          min="0"
                        />
                      )}
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    保存
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Redeem Modal */}
      <AnimatePresence>
        {showRedeemModal && selectedReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowRedeemModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">选择兑换学生</h2>
              <div className="mb-4 p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedReward.icon}</span>
                  <div>
                    <p className="font-medium">{selectedReward.name}</p>
                    <p className="text-orange-500">需要 {selectedReward.points_required} 积分</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {rankings.map((student) => {
                  const canRedeem = student.total_score >= selectedReward.points_required;
                  return (
                    <div
                      key={student.id}
                      onClick={() => canRedeem && setSelectedStudent(student)}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        !canRedeem
                          ? 'bg-gray-100 opacity-50 cursor-not-allowed'
                          : selectedStudent?.id === student.id
                          ? 'bg-blue-50 border-2 border-blue-500 cursor-pointer'
                          : 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
                      }`}
                    >
                      <span>{student.name}</span>
                      <span className={canRedeem ? 'text-orange-500 font-bold' : 'text-gray-400'}>
                        {student.total_score} 分
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3 pt-4 mt-4 border-t">
                <button
                  onClick={() => {
                    setShowRedeemModal(false);
                    setSelectedStudent(null);
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleRedeem}
                  disabled={!selectedStudent}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认兑换
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
