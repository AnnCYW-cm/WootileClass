import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { aiApi } from '../services/api';
import { useToastContext } from '../store/ToastContext';

export const StudentDashboard = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const toast = useToastContext();
  const [summary, setSummary] = useState(null);
  const [scoreTrend, setScoreTrend] = useState([]);
  const [attendanceCalendar, setAttendanceCalendar] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [aiComment, setAiComment] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  useEffect(() => {
    fetchAttendanceCalendar();
  }, [studentId, currentMonth]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [summaryRes, trendRes, assignmentsRes] = await Promise.all([
        fetch(`/api/dashboard/student/${studentId}/summary`, { headers }),
        fetch(`/api/dashboard/student/${studentId}/score-trend`, { headers }),
        fetch(`/api/dashboard/student/${studentId}/assignments`, { headers })
      ]);

      setSummary(await summaryRes.json());
      setScoreTrend(await trendRes.json());
      setAssignments(await assignmentsRes.json());
    } catch (error) {
      console.error('获取学生数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceCalendar = async () => {
    try {
      const res = await fetch(`/api/dashboard/student/${studentId}/attendance-calendar?month=${currentMonth}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAttendanceCalendar(await res.json());
    } catch (error) {
      console.error('获取出勤日历失败:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-500';
      case 'absent': return 'bg-red-500';
      case 'late': return 'bg-yellow-500';
      case 'leave': return 'bg-gray-400';
      default: return 'bg-gray-200';
    }
  };

  const getLabels = () => {
    if (!summary) return [];
    const labels = [];
    if (summary.attendance?.rate >= 95) labels.push({ text: '全勤之星', color: 'bg-green-100 text-green-700' });
    if (summary.score?.rank <= 3) labels.push({ text: '积分达人', color: 'bg-purple-100 text-purple-700' });
    if (summary.assignment?.submit_rate >= 100) labels.push({ text: '作业标兵', color: 'bg-blue-100 text-blue-700' });
    if (summary.attendance?.rate < 80) labels.push({ text: '出勤待关注', color: 'bg-red-100 text-red-700' });
    if (summary.assignment?.submit_rate < 60) labels.push({ text: '作业待提升', color: 'bg-orange-100 text-orange-700' });
    return labels;
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    const days = [];
    // Empty cells before first day
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    // Days of month
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentMonth}-${String(i).padStart(2, '0')}`;
      const record = attendanceCalendar.find(r => r.date?.startsWith(dateStr));
      days.push({ day: i, status: record?.status });
    }
    return days;
  };

  const handleGenerateComment = async () => {
    setAiLoading(true);
    try {
      const data = await aiApi.getStudentComment(studentId);
      setAiComment(data.comment);
      toast.success('评语已生成');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!summary) {
    return <div className="text-center text-gray-400 py-12">学生不存在</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{summary.student?.name}</h1>
          <p className="text-gray-500">{summary.student?.class_name} · {summary.student?.student_no || '无学号'}</p>
        </div>
        <button
          onClick={handleGenerateComment}
          disabled={aiLoading}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
        >
          {aiLoading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              生成中...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI 生成评语
            </>
          )}
        </button>
      </div>

      {/* Labels */}
      {getLabels().length > 0 && (
        <div className="flex flex-wrap gap-2">
          {getLabels().map((label, i) => (
            <span key={i} className={`px-3 py-1 rounded-full text-sm font-medium ${label.color}`}>
              {label.text}
            </span>
          ))}
        </div>
      )}

      {/* AI Comment */}
      {aiComment && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-purple-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI 生成评语
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(aiComment); toast.success('已复制'); }}
                className="px-3 py-1 text-xs text-purple-600 hover:bg-purple-100 rounded-lg transition"
              >
                复制
              </button>
              <button
                onClick={handleGenerateComment}
                disabled={aiLoading}
                className="px-3 py-1 text-xs text-purple-600 hover:bg-purple-100 rounded-lg transition"
              >
                重新生成
              </button>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{aiComment}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm mb-2">出勤率</div>
          <div className="text-3xl font-bold text-gray-800">{summary.attendance?.rate?.toFixed(1) || 0}%</div>
          <div className="text-sm text-gray-400 mt-1">班级: {summary.attendance?.class_rate?.toFixed(1) || 0}%</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm mb-2">当前积分</div>
          <div className="text-3xl font-bold text-purple-600">{summary.score?.total || 0}</div>
          <div className="text-sm text-gray-400 mt-1">
            班级排名: {summary.score?.rank}/{summary.score?.total_students}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm mb-2">作业提交率</div>
          <div className="text-3xl font-bold text-gray-800">{summary.assignment?.submit_rate?.toFixed(1) || 0}%</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm mb-2">作业平均分</div>
          <div className="text-3xl font-bold text-gray-800">{summary.assignment?.avg_score?.toFixed(1) || 0}</div>
          <div className="text-sm text-gray-400 mt-1">班级: {summary.assignment?.class_avg?.toFixed(1) || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Trend */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">积分变动曲线</h3>
          {scoreTrend.length > 0 ? (
            <div className="h-48 flex items-end gap-1">
              {scoreTrend.map((item, index) => {
                const maxScore = Math.max(...scoreTrend.map(t => t.cumulative || 0));
                const height = maxScore > 0 ? ((item.cumulative || 0) / maxScore * 160) : 0;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-purple-500 to-pink-400 rounded-t-sm"
                      style={{ height: `${height}px` }}
                      title={`${new Date(item.date).toLocaleDateString('zh-CN')}: ${item.cumulative}分`}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              暂无积分数据
            </div>
          )}
        </div>

        {/* Attendance Calendar */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">出勤日历</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const [y, m] = currentMonth.split('-').map(Number);
                  const newDate = new Date(y, m - 2, 1);
                  setCurrentMonth(newDate.toISOString().slice(0, 7));
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm text-gray-600">{currentMonth}</span>
              <button
                onClick={() => {
                  const [y, m] = currentMonth.split('-').map(Number);
                  const newDate = new Date(y, m, 1);
                  setCurrentMonth(newDate.toISOString().slice(0, 7));
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['日', '一', '二', '三', '四', '五', '六'].map(d => (
              <div key={d} className="text-gray-400 py-1">{d}</div>
            ))}
            {generateCalendarDays().map((day, i) => (
              <div key={i} className="aspect-square flex items-center justify-center">
                {day && (
                  <div className="relative">
                    <span className="text-gray-600">{day.day}</span>
                    {day.status && (
                      <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${getStatusColor(day.status)}`} />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>出勤</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>缺勤</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span>迟到</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400"></span>请假</span>
          </div>
        </div>
      </div>

      {/* Assignment Records */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">作业记录</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-3 px-2">作业名称</th>
                <th className="py-3 px-2">布置日期</th>
                <th className="py-3 px-2">状态</th>
                <th className="py-3 px-2">得分</th>
                <th className="py-3 px-2">评语</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-2 text-gray-700">{a.title}</td>
                  <td className="py-3 px-2 text-gray-500">
                    {new Date(a.created_at).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      a.status === 'submitted' ? 'bg-green-100 text-green-700' :
                      a.status === 'overdue' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {a.status === 'submitted' ? '已提交' : a.status === 'overdue' ? '已逾期' : '待提交'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-700">{a.score ?? '-'}</td>
                  <td className="py-3 px-2 text-gray-500 max-w-xs truncate" title={a.comment}>
                    {a.comment || '-'}
                  </td>
                </tr>
              ))}
              {assignments.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-8">暂无作业记录</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
