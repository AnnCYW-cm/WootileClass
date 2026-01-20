import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { classesApi, scoresApi } from '../services/api';

export const Scores = () => {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 to-purple-900 z-50 p-8 overflow-auto">
        <button
          onClick={() => setFullscreenRanking(false)}
          className="absolute top-4 right-4 text-white hover:text-gray-300"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h1 className="text-4xl font-bold text-white text-center mb-8">积分排行榜</h1>
        <div className="max-w-2xl mx-auto space-y-4">
          {ranking.slice(0, 10).map((student, index) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center p-4 rounded-lg ${
                index === 0 ? 'bg-yellow-500' :
                index === 1 ? 'bg-gray-300' :
                index === 2 ? 'bg-amber-600' :
                'bg-white bg-opacity-10'
              }`}
            >
              <div className={`text-4xl w-16 text-center ${index < 3 ? 'text-white' : 'text-white'}`}>
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">学生积分</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedClass || ''}
            onChange={(e) => setSelectedClass(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleResetScores}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
          >
            重置积分
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'manage', label: '积分管理' },
            { key: 'ranking', label: '排行榜' },
            { key: 'settings', label: '积分规则' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Quick Score Presets */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">快捷加分</h3>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => selectedStudent && handleQuickScore(selectedStudent, preset)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                preset.score > 0
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {preset.icon} {preset.name} ({preset.score > 0 ? '+' : ''}{preset.score})
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">提示：先点击学生卡片选中，再点击快捷加分</p>
      </div>

      {/* Manage Tab */}
      {activeTab === 'manage' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <span className="text-gray-600">共 {students.length} 名学生</span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {students.map((student) => (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedStudent?.id === student.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-2xl font-bold text-indigo-600 mt-2">
                      {student.total_score}
                    </div>
                    <div className="text-xs text-gray-500">积分</div>
                  </div>
                  <div className="mt-3 flex justify-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickScore(student, { score: 1, name: '加分' });
                      }}
                      className="w-8 h-8 rounded-full bg-green-500 text-white hover:bg-green-600 flex items-center justify-center"
                    >
                      +
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openScoreModal(student);
                      }}
                      className="w-8 h-8 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 flex items-center justify-center text-xs"
                    >
                      ±
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickScore(student, { score: -1, name: '减分' });
                      }}
                      className="w-8 h-8 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center"
                    >
                      -
                    </button>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openHistory(student);
                    }}
                    className="absolute top-2 right-2 text-gray-400 hover:text-indigo-600"
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
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex space-x-2">
              {[
                { key: 'all', label: '总榜' },
                { key: 'month', label: '月榜' },
                { key: 'week', label: '周榜' },
                { key: 'day', label: '日榜' },
              ].map((period) => (
                <button
                  key={period.key}
                  onClick={() => setRankingPeriod(period.key)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    rankingPeriod === period.key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setFullscreenRanking(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              投屏模式
            </button>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {ranking.map((student) => (
                <div
                  key={student.id}
                  className={`flex items-center p-3 rounded-lg ${
                    student.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'bg-gray-50'
                  }`}
                >
                  <div className={`w-12 text-center text-2xl ${student.rank <= 3 ? '' : 'text-gray-500'}`}>
                    {getRankIcon(student.rank)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-500">{student.student_no}</div>
                  </div>
                  <div className="text-xl font-bold text-indigo-600">
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
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-medium text-gray-900">积分规则管理</h3>
            <button
              onClick={() => {
                setNewPreset({ name: '', score: 1, icon: '⭐' });
                setPresetError('');
                setShowPresetModal(true);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              添加规则
            </button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className={`p-4 rounded-lg border-2 ${
                    preset.score > 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{preset.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900">{preset.name}</div>
                        <div className={`text-sm font-bold ${preset.score > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {preset.score > 0 ? '+' : ''}{preset.score} 分
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePreset(preset.id)}
                      className="text-gray-400 hover:text-red-600"
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
              <div className="text-center py-12 text-gray-500">
                暂无积分规则，点击"添加规则"创建
              </div>
            )}
          </div>
        </div>
      )}

      {/* Score Modal */}
      {showScoreModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              为 {selectedStudent.name} 加减分
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">分值</label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setScoreValue(scoreValue - 1)}
                    className="w-10 h-10 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center text-xl"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={scoreValue}
                    onChange={(e) => setScoreValue(parseInt(e.target.value) || 0)}
                    className="w-20 text-center text-2xl font-bold border border-gray-300 rounded-md py-2"
                  />
                  <button
                    onClick={() => setScoreValue(scoreValue + 1)}
                    className="w-10 h-10 rounded-full bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center text-xl"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="例如：回答问题正确"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {presets.slice(0, 6).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setScoreValue(preset.score);
                      setScoreReason(preset.name);
                    }}
                    className="px-3 py-1 rounded-full text-sm bg-gray-100 hover:bg-gray-200"
                  >
                    {preset.icon} {preset.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowScoreModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleScoreSubmit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && historyStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {historyStudent.name} 的积分记录
              </h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              {historyRecords.length > 0 ? (
                historyRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="text-sm text-gray-500">
                        {new Date(record.created_at).toLocaleString()}
                      </div>
                      <div className="text-gray-700">{record.reason || '无备注'}</div>
                    </div>
                    <div className={`text-lg font-bold ${record.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {record.change > 0 ? '+' : ''}{record.change}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">暂无积分记录</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preset Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">添加积分规则</h2>
            <div className="space-y-4">
              {presetError && (
                <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                  {presetError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">规则名称 *</label>
                <input
                  type="text"
                  value={newPreset.name}
                  onChange={(e) => setNewPreset({ ...newPreset, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="例如：回答问题"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">分值 *</label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setNewPreset({ ...newPreset, score: newPreset.score - 1 })}
                    className="w-10 h-10 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center text-xl"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={newPreset.score}
                    onChange={(e) => setNewPreset({ ...newPreset, score: parseInt(e.target.value) || 0 })}
                    className="w-20 text-center text-2xl font-bold border border-gray-300 rounded-md py-2"
                  />
                  <button
                    onClick={() => setNewPreset({ ...newPreset, score: newPreset.score + 1 })}
                    className="w-10 h-10 rounded-full bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center text-xl"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">正数为加分，负数为减分</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">图标</label>
                <div className="flex flex-wrap gap-2">
                  {['⭐', '🌟', '💯', '👍', '🎉', '❤️', '🏆', '🎖️', '💪', '📚', '✏️', '🎯', '⚠️', '❌', '👎', '😢'].map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewPreset({ ...newPreset, icon })}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center ${
                        newPreset.icon === icon
                          ? 'bg-indigo-100 border-2 border-indigo-500'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPresetModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleCreatePreset}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
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
