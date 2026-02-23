import { useState, useEffect } from 'react';
import { examsApi, studentsApi } from '../services/api';
import { useLoadClasses, useModal } from '../hooks';

export const ExamManagement = () => {
  const { classes, selectedClassId, selectClass } = useLoadClasses();
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [scores, setScores] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [editingScores, setEditingScores] = useState({});

  const createModal = useModal({
    name: '',
    exam_type: 'unit',
    subject: '',
    total_score: 100,
    exam_date: new Date().toISOString().split('T')[0]
  });

  const examTypes = [
    { value: 'unit', label: '单元测验' },
    { value: 'midterm', label: '期中考试' },
    { value: 'final', label: '期末考试' },
    { value: 'monthly', label: '月考' },
    { value: 'quiz', label: '随堂测验' }
  ];

  useEffect(() => {
    if (selectedClassId) {
      fetchExams();
      fetchStudents();
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedExam) {
      fetchScores();
      fetchStats();
    }
  }, [selectedExam]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const data = await examsApi.getAll(selectedClassId);
      setExams(data);
      if (data.length > 0 && !selectedExam) {
        setSelectedExam(data[0].id);
      }
    } catch (error) {
      console.error('获取考试列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const data = await studentsApi.getByClass(selectedClassId);
      setStudents(data);
    } catch (error) {
      console.error('获取学生失败:', error);
    }
  };

  const fetchScores = async () => {
    try {
      const data = await examsApi.getScores(selectedExam);
      setScores(data);
      const scoreMap = {};
      data.forEach(s => { scoreMap[s.student_id] = s.score; });
      setEditingScores(scoreMap);
    } catch (error) {
      console.error('获取成绩失败:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await examsApi.getStats(selectedExam);
      setStats(data);
    } catch (error) {
      console.error('获取统计失败:', error);
    }
  };

  const handleCreateExam = async () => {
    try {
      await examsApi.create({ ...createModal.formData, class_id: selectedClassId });
      createModal.close();
      fetchExams();
    } catch (error) {
      console.error('创建考试失败:', error);
      createModal.setError(error.message);
    }
  };

  const handleSaveScores = async () => {
    try {
      const scoresArray = Object.entries(editingScores)
        .filter(([_, score]) => score !== '' && score !== null)
        .map(([student_id, score]) => ({
          student_id: parseInt(student_id),
          score: parseFloat(score)
        }));

      await examsApi.saveScores(selectedExam, scoresArray);
      setShowScoreModal(false);
      fetchScores();
      fetchStats();
      alert('成绩保存成功');
    } catch (error) {
      console.error('保存成绩失败:', error);
      alert('保存失败');
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!confirm('确定要删除这次考试吗？所有成绩将被清除。')) return;
    try {
      await examsApi.delete(examId);
      if (selectedExam === examId) setSelectedExam(null);
      fetchExams();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const getScoreColor = (score, total) => {
    const percent = (score / total) * 100;
    if (percent >= 90) return 'text-green-600';
    if (percent >= 80) return 'text-blue-600';
    if (percent >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const currentExam = exams.find(e => e.id === selectedExam);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">成绩管理</h1>
          <p className="text-gray-500 mt-1">管理考试成绩与分析</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedClassId || ''}
            onChange={(e) => {
              selectClass(e.target.value);
              setSelectedExam(null);
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={() => createModal.open()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            新建考试
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Exam List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3">考试列表</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {exams.map(exam => (
                <div
                  key={exam.id}
                  onClick={() => setSelectedExam(exam.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedExam === exam.id
                      ? 'bg-purple-50 border border-purple-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">{exam.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteExam(exam.id);
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {examTypes.find(t => t.value === exam.exam_type)?.label} · {new Date(exam.exam_date).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              ))}
              {exams.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  暂无考试记录
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {selectedExam && currentExam ? (
            <>
              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm">平均分</div>
                    <div className="text-2xl font-bold text-purple-600">{stats.avg?.toFixed(1) || '-'}</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm">最高分</div>
                    <div className="text-2xl font-bold text-green-600">{stats.max || '-'}</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm">最低分</div>
                    <div className="text-2xl font-bold text-red-600">{stats.min || '-'}</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm">及格率</div>
                    <div className="text-2xl font-bold text-blue-600">{stats.pass_rate?.toFixed(1) || 0}%</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm">已录入</div>
                    <div className="text-2xl font-bold text-gray-700">{stats.count || 0}/{students.length}</div>
                  </div>
                </div>
              )}

              {/* Score Distribution */}
              {stats?.distribution && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-4">分数分布</h3>
                  <div className="flex items-end gap-2 h-32">
                    {['90-100', '80-89', '70-79', '60-69', '0-59'].map((range, i) => {
                      const count = stats.distribution[range] || 0;
                      const maxCount = Math.max(...Object.values(stats.distribution), 1);
                      const height = (count / maxCount) * 100;
                      const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];
                      return (
                        <div key={range} className="flex-1 flex flex-col items-center">
                          <div className="w-full flex flex-col items-center">
                            <span className="text-xs text-gray-600 mb-1">{count}</span>
                            <div
                              className={`w-full ${colors[i]} rounded-t transition-all`}
                              style={{ height: `${height}px` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 mt-2">{range}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Score Table */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">成绩明细</h3>
                  <button
                    onClick={() => setShowScoreModal(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    录入成绩
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-3 px-2">排名</th>
                        <th className="py-3 px-2">姓名</th>
                        <th className="py-3 px-2">学号</th>
                        <th className="py-3 px-2">分数</th>
                        <th className="py-3 px-2">等级</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scores
                        .sort((a, b) => (b.score || 0) - (a.score || 0))
                        .map((score, index) => {
                          const student = students.find(s => s.id === score.student_id);
                          const percent = (score.score / currentExam.total_score) * 100;
                          let grade = 'D';
                          if (percent >= 90) grade = 'A';
                          else if (percent >= 80) grade = 'B';
                          else if (percent >= 60) grade = 'C';

                          return (
                            <tr key={score.id} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="py-3 px-2">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  index === 0 ? 'bg-yellow-100 text-yellow-600' :
                                  index === 1 ? 'bg-gray-100 text-gray-600' :
                                  index === 2 ? 'bg-orange-100 text-orange-600' :
                                  'text-gray-500'
                                }`}>
                                  {index + 1}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-gray-700">{student?.name || '-'}</td>
                              <td className="py-3 px-2 text-gray-500">{student?.student_no || '-'}</td>
                              <td className={`py-3 px-2 font-semibold ${getScoreColor(score.score, currentExam.total_score)}`}>
                                {score.score}
                              </td>
                              <td className="py-3 px-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  grade === 'A' ? 'bg-green-100 text-green-700' :
                                  grade === 'B' ? 'bg-blue-100 text-blue-700' :
                                  grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {grade}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      {scores.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center text-gray-400 py-8">
                            暂无成绩数据，点击"录入成绩"开始
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-700 mb-2">选择或创建考试</h3>
              <p className="text-gray-500">从左侧选择考试查看成绩，或点击"新建考试"创建</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Exam Modal */}
      {createModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">新建考试</h3>
            <div className="space-y-4">
              {createModal.error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {createModal.error}
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-600 mb-1">考试名称</label>
                <input
                  type="text"
                  value={createModal.formData.name}
                  onChange={(e) => createModal.updateField('name', e.target.value)}
                  placeholder="如：第一单元测试"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">考试类型</label>
                <select
                  value={createModal.formData.exam_type}
                  onChange={(e) => createModal.updateField('exam_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {examTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">科目</label>
                <input
                  type="text"
                  value={createModal.formData.subject}
                  onChange={(e) => createModal.updateField('subject', e.target.value)}
                  placeholder="如：数学"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">满分</label>
                  <input
                    type="number"
                    value={createModal.formData.total_score}
                    onChange={(e) => createModal.updateField('total_score', parseInt(e.target.value) || 100)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">考试日期</label>
                  <input
                    type="date"
                    value={createModal.formData.exam_date}
                    onChange={(e) => createModal.updateField('exam_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => createModal.close()}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateExam}
                disabled={!createModal.formData.name}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Score Entry Modal */}
      {showScoreModal && currentExam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              录入成绩 - {currentExam.name} (满分{currentExam.total_score}分)
            </h3>
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {students.map(student => (
                  <div key={student.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <span className="flex-1 text-sm text-gray-700">{student.name}</span>
                    <input
                      type="number"
                      min="0"
                      max={currentExam.total_score}
                      value={editingScores[student.id] ?? ''}
                      onChange={(e) => setEditingScores({
                        ...editingScores,
                        [student.id]: e.target.value
                      })}
                      placeholder="分数"
                      className="w-20 px-2 py-1 border border-gray-200 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowScoreModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveScores}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                保存成绩
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
