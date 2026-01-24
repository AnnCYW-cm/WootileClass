import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { classesApi, scoresApi } from '../services/api';

export const Scores = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('manage'); // manage, ranking, history

  // Score modal state
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [scoreValue, setScoreValue] = useState(1);
  const [scoreReason, setScoreReason] = useState('');

  // History modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyStudent, setHistoryStudent] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);

  // Ranking state
  const [rankingPeriod, setRankingPeriod] = useState('all');
  const [ranking, setRanking] = useState([]);
  const [fullscreenRanking, setFullscreenRanking] = useState(false);

  // Preset management state
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [newPreset, setNewPreset] = useState({ name: '', score: 1, icon: '⭐' });
  const [presetError, setPresetError] = useState('');

  useEffect(() => {
    loadClasses();
    loadPresets();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && activeTab === 'ranking') {
      loadRanking();
    }
  }, [selectedClass, activeTab, rankingPeriod]);

  const loadClasses = async () => {
    try {
      const data = await classesApi.getAll();
      setClasses(data);
      if (data.length > 0) {
        setSelectedClass(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPresets = async () => {
    try {
      const data = await scoresApi.getPresets();
      setPresets(data);
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const data = await scoresApi.getByClass(selectedClass);
      setStudents(data);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  const loadRanking = async () => {
    try {
      const data = await scoresApi.getRanking(selectedClass, rankingPeriod);
      setRanking(data);
    } catch (error) {
      console.error('Failed to load ranking:', error);
    }
  };

  const openScoreModal = (student) => {
    setSelectedStudent(student);
    setScoreValue(1);
    setScoreReason('');
    setShowScoreModal(true);
  };

  const handleQuickScore = async (student, preset) => {
    try {
      await scoresApi.add(selectedClass, {
        student_id: student.id,
        change: preset.score,
        reason: preset.name,
      });
      loadStudents();
      if (activeTab === 'ranking') {
        loadRanking();
      }
    } catch (error) {
      console.error('Failed to add score:', error);
    }
  };

  const handleScoreSubmit = async () => {
    if (!selectedStudent) return;

    try {
      await scoresApi.add(selectedClass, {
        student_id: selectedStudent.id,
        change: scoreValue,
        reason: scoreReason,
      });
      setShowScoreModal(false);
      loadStudents();
      if (activeTab === 'ranking') {
        loadRanking();
      }
    } catch (error) {
      console.error('Failed to add score:', error);
    }
  };

  const openHistory = async (student) => {
    setHistoryStudent(student);
    try {
      const data = await scoresApi.getStudentHistory(student.id);
      setHistoryRecords(data);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleResetScores = async () => {
    if (!confirm('确定要重置该班级所有学生的积分吗？此操作不可恢复。')) return;

    try {
      await scoresApi.reset(selectedClass);
      loadStudents();
      if (activeTab === 'ranking') {
        loadRanking();
      }
    } catch (error) {
      console.error('Failed to reset scores:', error);
    }
  };

  const handleCreatePreset = async () => {
    if (!newPreset.name.trim()) {
      setPresetError('请输入规则名称');
      return;
    }
    if (newPreset.score === 0) {
      setPresetError('分值不能为0');
      return;
    }

    try {
      await scoresApi.createPreset(newPreset);
      setShowPresetModal(false);
      setNewPreset({ name: '', score: 1, icon: '⭐' });
      setPresetError('');
      loadPresets();
    } catch (error) {
      setPresetError(error.message || '创建失败');
    }
  };

  const handleDeletePreset = async (id) => {
    if (!confirm('确定要删除这个积分规则吗？')) return;

    try {
      await scoresApi.deletePreset(id);
      loadPresets();
    } catch (error) {
      console.error('Failed to delete preset:', error);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">请先创建班级并添加学生</p>
      </div>
    );
  }

  // Fullscreen ranking mode
  if (fullscreenRanking) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 z-50 p-8 overflow-auto">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-500/20 via-transparent to-transparent"></div>
        <button
          onClick={() => setFullscreenRanking(false)}
          className="absolute top-6 right-6 p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h1 className="text-5xl font-bold text-white text-center mb-12 relative">积分排行榜</h1>
        <div className="max-w-3xl mx-auto space-y-4 relative">
          {ranking.slice(0, 10).map((student, index) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center p-5 rounded-2xl backdrop-blur-sm ${
                index === 0 ? 'bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/30' :
                index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 shadow-lg' :
                index === 2 ? 'bg-gradient-to-r from-amber-600 to-orange-600 shadow-lg shadow-amber-600/30' :
                'bg-white/10 border border-white/10'
              }`}
            >
              <div className={`text-4xl w-20 text-center ${index < 3 ? '' : ''}`}>
                {getRankIcon(student.rank)}
              </div>
              <div className={`flex-1 text-2xl font-bold ${index < 3 ? 'text-white' : 'text-white'}`}>
                {student.name}
              </div>
              <div className={`text-3xl font-bold ${index < 3 ? 'text-white' : 'text-yellow-400'}`}>
                {student.total_score} 分
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">学生积分</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedClass || ''}
            onChange={(e) => setSelectedClass(Number(e.target.value))}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => selectedClass && navigate(`/dashboard/redemption/${selectedClass}`)}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/25"
          >
            🎁 积分兑换
          </button>
          <button
            onClick={handleResetScores}
            className="px-4 py-2.5 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors"
          >
            重置积分
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-100 rounded-xl p-1 inline-flex">
        {[
          { key: 'manage', label: '积分管理' },
          { key: 'ranking', label: '排行榜' },
          { key: 'settings', label: '积分规则' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === tab.key
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Quick Score Presets */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-5">快捷加分</h3>
        <div className="flex flex-wrap gap-3">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => selectedStudent && handleQuickScore(selectedStudent, preset)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                preset.score > 0
                  ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
              }`}
            >
              {preset.icon} {preset.name} ({preset.score > 0 ? '+' : ''}{preset.score})
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">提示：先点击学生卡片选中，再点击快捷加分</p>
      </div>

      {/* Manage Tab */}
      {activeTab === 'manage' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <span className="text-gray-500">共 {students.length} 名学生</span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {students.map((student) => (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedStudent?.id === student.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-100 hover:border-purple-300 hover:shadow-md'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">{student.name}</div>
                    <div className="text-2xl font-bold text-purple-600 mt-3">
                      {student.total_score}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">积分</div>
                  </div>
                  <div className="mt-5 flex justify-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickScore(student, { score: 1, name: '加分' });
                      }}
                      className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white hover:opacity-90 flex items-center justify-center shadow-sm text-lg"
                    >
                      +
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openScoreModal(student);
                      }}
                      className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:opacity-90 flex items-center justify-center text-sm shadow-sm"
                    >
                      ±
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickScore(student, { score: -1, name: '减分' });
                      }}
                      className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 text-white hover:opacity-90 flex items-center justify-center shadow-sm text-lg"
                    >
                      -
                    </button>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openHistory(student);
                    }}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-purple-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ranking Tab */}
      {activeTab === 'ranking' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <div className="flex bg-gray-100 rounded-xl p-1">
              {[
                { key: 'all', label: '总榜' },
                { key: 'month', label: '月榜' },
                { key: 'week', label: '周榜' },
                { key: 'day', label: '日榜' },
              ].map((period) => (
                <button
                  key={period.key}
                  onClick={() => setRankingPeriod(period.key)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    rankingPeriod === period.key
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setFullscreenRanking(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              投屏模式
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {ranking.map((student) => (
                <div
                  key={student.id}
                  className={`flex items-center p-5 rounded-xl transition-all ${
                    student.rank <= 3 ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100' : 'bg-gray-50 border border-transparent hover:border-gray-200'
                  }`}
                >
                  <div className={`w-16 text-center text-2xl ${student.rank <= 3 ? '' : 'text-gray-400'}`}>
                    {getRankIcon(student.rank)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-400 mt-1">{student.student_no}</div>
                  </div>
                  <div className="text-xl font-bold text-purple-600">
                    {student.total_score} 分
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">积分规则管理</h3>
            <button
              onClick={() => {
                setNewPreset({ name: '', score: 1, icon: '⭐' });
                setPresetError('');
                setShowPresetModal(true);
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25"
            >
              添加规则
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className={`p-6 rounded-xl border ${
                    preset.score > 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-4xl">{preset.icon}</span>
                      <div>
                        <div className="font-semibold text-gray-900">{preset.name}</div>
                        <div className={`text-sm font-bold mt-1 ${preset.score > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {preset.score > 0 ? '+' : ''}{preset.score} 分
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePreset(preset.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="删除"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {presets.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                暂无积分规则，点击"添加规则"创建
              </div>
            )}
          </div>
        </div>
      )}

      {/* Score Modal */}
      {showScoreModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-10 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              为 {selectedStudent.name} 加减分
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">分值</label>
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => setScoreValue(scoreValue - 1)}
                    className="w-12 h-12 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center text-2xl font-medium transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={scoreValue}
                    onChange={(e) => setScoreValue(parseInt(e.target.value) || 0)}
                    className="w-24 text-center text-3xl font-bold border border-gray-200 rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={() => setScoreValue(scoreValue + 1)}
                    className="w-12 h-12 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center text-2xl font-medium transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">原因（选填）</label>
                <input
                  type="text"
                  value={scoreReason}
                  onChange={(e) => setScoreReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="例如：回答问题正确"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                {presets.slice(0, 6).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setScoreValue(preset.score);
                      setScoreReason(preset.name);
                    }}
                    className="px-4 py-2.5 rounded-xl text-sm bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    {preset.icon} {preset.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-10">
              <button
                onClick={() => setShowScoreModal(false)}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleScoreSubmit}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && historyStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-10 w-full max-w-lg max-h-[80vh] overflow-auto shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                {historyStudent.name} 的积分记录
              </h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {historyRecords.length > 0 ? (
                historyRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-5 bg-gray-50 rounded-xl"
                  >
                    <div>
                      <div className="text-sm text-gray-400">
                        {new Date(record.created_at).toLocaleString()}
                      </div>
                      <div className="text-gray-700 mt-2">{record.reason || '无备注'}</div>
                    </div>
                    <div className={`text-xl font-bold ${record.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {record.change > 0 ? '+' : ''}{record.change}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 py-12">暂无积分记录</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preset Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-10 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">添加积分规则</h2>
            <div className="space-y-6">
              {presetError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">
                  {presetError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">规则名称 *</label>
                <input
                  type="text"
                  value={newPreset.name}
                  onChange={(e) => setNewPreset({ ...newPreset, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="例如：回答问题"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">分值 *</label>
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => setNewPreset({ ...newPreset, score: newPreset.score - 1 })}
                    className="w-12 h-12 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center text-2xl font-medium transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={newPreset.score}
                    onChange={(e) => setNewPreset({ ...newPreset, score: parseInt(e.target.value) || 0 })}
                    className="w-24 text-center text-3xl font-bold border border-gray-200 rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={() => setNewPreset({ ...newPreset, score: newPreset.score + 1 })}
                    className="w-12 h-12 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center text-2xl font-medium transition-colors"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">正数为加分，负数为减分</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">图标</label>
                <div className="flex flex-wrap gap-3">
                  {['⭐', '🌟', '💯', '👍', '🎉', '❤️', '🏆', '🎖️', '💪', '📚', '✏️', '🎯', '⚠️', '❌', '👎', '😢'].map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewPreset({ ...newPreset, icon })}
                      className={`w-12 h-12 rounded-xl text-xl flex items-center justify-center transition-all ${
                        newPreset.icon === icon
                          ? 'bg-purple-100 border-2 border-purple-500'
                          : 'bg-gray-100 hover:bg-gray-200 border-2 border-transparent'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-10">
              <button
                onClick={() => setShowPresetModal(false)}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreatePreset}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
