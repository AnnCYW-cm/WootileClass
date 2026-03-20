import { useState, useEffect } from 'react';
import { classesApi, studentsApi, reportsApi } from '../services/api';
import { useLoadClasses } from '../hooks';
import { useToastContext } from '../store/ToastContext';

export const ParentReports = () => {
  const toast = useToastContext();
  const { classes, selectedClassId, selectClass } = useLoadClasses();
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [reportHistory, setReportHistory] = useState([]);
  const [presetComments, setPresetComments] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [reportSettings, setReportSettings] = useState({
    period: 'week',
    include_attendance: true,
    include_scores: true,
    include_assignments: true,
    include_exams: true,
    teacher_comment: ''
  });

  useEffect(() => {
    fetchPresetComments();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents();
    }
  }, [selectedClassId]);

  const fetchStudents = async () => {
    try {
      const data = await studentsApi.getByClass(selectedClassId);
      setStudents(data);
    } catch (error) {
      console.error('获取学生失败:', error);
    }
  };

  const fetchPresetComments = async () => {
    try {
      const data = await reportsApi.getComments();
      setPresetComments(data);
    } catch (error) {
      console.error('获取预设评语失败:', error);
    }
  };

  const fetchReportHistory = async () => {
    try {
      const data = await reportsApi.getHistory(selectedClassId);
      setReportHistory(data);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('获取历史报告失败:', error);
    }
  };

  const handlePreview = async (studentId) => {
    setLoading(true);
    try {
      const data = await reportsApi.preview({
        student_id: studentId,
        period: reportSettings.period,
        include_attendance: reportSettings.include_attendance,
        include_scores: reportSettings.include_scores,
        include_assignments: reportSettings.include_assignments,
        include_exams: reportSettings.include_exams
      });
      setPreview(data);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('预览失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (studentId) => {
    setGenerating(true);
    try {
      const data = await reportsApi.generate({
        student_id: studentId,
        period: reportSettings.period,
        include_attendance: reportSettings.include_attendance,
        include_scores: reportSettings.include_scores,
        include_assignments: reportSettings.include_assignments,
        include_exams: reportSettings.include_exams,
        teacher_comment: reportSettings.teacher_comment
      });
      const url = `${window.location.origin}/report/${data.share_code}`;
      navigator.clipboard.writeText(url);
      toast.success('报告已生成！分享链接已复制到剪贴板');
    } catch (error) {
      console.error('生成失败:', error);
      toast.error('生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleBatchGenerate = async () => {
    if (selectedStudents.length === 0) {
      toast.warning('请先选择学生');
      return;
    }
    setGenerating(true);
    try {
      const data = await reportsApi.generateBatch({
        student_ids: selectedStudents,
        period: reportSettings.period,
        include_attendance: reportSettings.include_attendance,
        include_scores: reportSettings.include_scores,
        include_assignments: reportSettings.include_assignments,
        include_exams: reportSettings.include_exams,
        teacher_comment: reportSettings.teacher_comment
      });
      toast.success(`成功生成 ${data.reports.length} 份报告！`);
      setSelectedStudents([]);
    } catch (error) {
      console.error('批量生成失败:', error);
      toast.error('批量生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm('确定要删除这份报告吗？')) return;
    try {
      await reportsApi.delete(reportId);
      setReportHistory(reportHistory.filter(r => r.id !== reportId));
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const toggleSelectStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">家长报告</h1>
          <p className="text-gray-500 mt-1">生成学生表现报告分享给家长</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedClassId || ''}
            onChange={(e) => {
              selectClass(e.target.value);
              setSelectedStudents([]);
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={fetchReportHistory}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            历史报告
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">报告设置</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">统计周期</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'week', label: '本周' },
                    { value: 'month', label: '本月' },
                    { value: 'semester', label: '本学期' }
                  ].map(p => (
                    <button
                      key={p.value}
                      onClick={() => setReportSettings({ ...reportSettings, period: p.value })}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        reportSettings.period === p.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">包含内容</label>
                <div className="space-y-2">
                  {[
                    { key: 'include_attendance', label: '出勤记录' },
                    { key: 'include_scores', label: '积分记录' },
                    { key: 'include_assignments', label: '作业情况' },
                    { key: 'include_exams', label: '考试成绩' }
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reportSettings[item.key]}
                        onChange={(e) => setReportSettings({
                          ...reportSettings,
                          [item.key]: e.target.checked
                        })}
                        className="rounded text-purple-600"
                      />
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">教师评语</label>
                <textarea
                  value={reportSettings.teacher_comment}
                  onChange={(e) => setReportSettings({ ...reportSettings, teacher_comment: e.target.value })}
                  placeholder="输入对学生的评语..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              {presetComments.length > 0 && (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">快捷评语</label>
                  <div className="flex flex-wrap gap-2">
                    {presetComments.slice(0, 6).map((comment, i) => (
                      <button
                        key={i}
                        onClick={() => setReportSettings({
                          ...reportSettings,
                          teacher_comment: reportSettings.teacher_comment + (reportSettings.teacher_comment ? ' ' : '') + comment
                        })}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                      >
                        {comment.slice(0, 10)}...
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedStudents.length > 0 && (
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-purple-700">
                  已选择 {selectedStudents.length} 名学生
                </span>
                <button
                  onClick={() => setSelectedStudents([])}
                  className="text-xs text-purple-600 hover:text-purple-800"
                >
                  清空
                </button>
              </div>
              <button
                onClick={handleBatchGenerate}
                disabled={generating}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {generating ? '生成中...' : `批量生成报告 (${selectedStudents.length}份)`}
              </button>
            </div>
          )}
        </div>

        {/* Student List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">学生列表</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStudents.length === students.length && students.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded text-purple-600"
                />
                <span className="text-sm text-gray-600">全选</span>
              </label>
            </div>

            <div className="space-y-2">
              {students.map(student => (
                <div
                  key={student.id}
                  className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                    selectedStudents.includes(student.id) ? 'bg-purple-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => toggleSelectStudent(student.id)}
                    className="rounded text-purple-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-700">{student.name}</div>
                    <div className="text-xs text-gray-500">{student.student_no || '无学号'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePreview(student.id)}
                      disabled={loading}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      预览
                    </button>
                    <button
                      onClick={() => handleGenerateReport(student.id)}
                      disabled={generating}
                      className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      生成
                    </button>
                  </div>
                </div>
              ))}
              {students.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  暂无学生
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && preview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">报告预览</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Student Info */}
              <div className="text-center pb-4 border-b">
                <h2 className="text-xl font-bold text-gray-800">{preview.student?.name}</h2>
                <p className="text-gray-500">{preview.student?.class_name} · {preview.period_label}</p>
              </div>

              {/* Attendance */}
              {preview.attendance && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">出勤情况</h4>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{preview.attendance.present || 0}</div>
                      <div className="text-xs text-gray-500">出勤</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{preview.attendance.absent || 0}</div>
                      <div className="text-xs text-gray-500">缺勤</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{preview.attendance.late || 0}</div>
                      <div className="text-xs text-gray-500">迟到</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">{preview.attendance.leave || 0}</div>
                      <div className="text-xs text-gray-500">请假</div>
                    </div>
                  </div>
                  <div className="mt-2 text-center text-sm text-gray-500">
                    出勤率: <span className="font-semibold text-purple-600">{preview.attendance.rate?.toFixed(1)}%</span>
                  </div>
                </div>
              )}

              {/* Scores */}
              {preview.scores && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">积分情况</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{preview.scores.total || 0}</div>
                      <div className="text-xs text-gray-500">当前积分</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">+{preview.scores.period_earned || 0}</div>
                      <div className="text-xs text-gray-500">本期获得</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{preview.scores.rank || '-'}</div>
                      <div className="text-xs text-gray-500">班级排名</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Assignments */}
              {preview.assignments && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">作业情况</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{preview.assignments.total || 0}</div>
                      <div className="text-xs text-gray-500">总作业数</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{preview.assignments.submitted || 0}</div>
                      <div className="text-xs text-gray-500">已提交</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{preview.assignments.avg_score?.toFixed(1) || '-'}</div>
                      <div className="text-xs text-gray-500">平均分</div>
                    </div>
                  </div>
                  <div className="mt-2 text-center text-sm text-gray-500">
                    提交率: <span className="font-semibold text-purple-600">{preview.assignments.submit_rate?.toFixed(1)}%</span>
                  </div>
                </div>
              )}

              {/* Exams */}
              {preview.exams && preview.exams.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">考试成绩</h4>
                  <div className="space-y-2">
                    {preview.exams.map((exam, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-700">{exam.name}</div>
                          <div className="text-xs text-gray-500">{new Date(exam.date).toLocaleDateString('zh-CN')}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-purple-600">{exam.score}/{exam.total}</div>
                          <div className="text-xs text-gray-500">排名 {exam.rank}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t flex gap-3">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  handleGenerateReport(preview.student?.id);
                  setShowPreviewModal(false);
                }}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                生成并分享
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">历史报告</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {reportHistory.map(report => (
                  <div key={report.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-700">{report.student_name}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(report.created_at).toLocaleDateString('zh-CN')} · {report.period}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/report/${report.share_code}`;
                          copyToClipboard(url);
                          toast.success('链接已复制');
                        }}
                        className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                      >
                        复制链接
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
                {reportHistory.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    暂无历史报告
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
