import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiApi } from '../services/api';
import { useToastContext } from '../store/ToastContext';

export const DataDashboard = () => {
  const navigate = useNavigate();
  const toast = useToastContext();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [summary, setSummary] = useState(null);
  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [scoreRanking, setScoreRanking] = useState([]);
  const [assignmentStats, setAssignmentStats] = useState([]);
  const [todos, setTodos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');
  const [aiSummary, setAiSummary] = useState('');
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchTodos();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchDashboardData();
    }
  }, [selectedClass, period]);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setClasses(data);
      if (data.length > 0) {
        setSelectedClass(data[0].id);
      }
    } catch (error) {
      console.error('获取班级失败:', error);
    }
  };

  const fetchTodos = async () => {
    try {
      const res = await fetch('/api/dashboard/todos', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setTodos(data);
    } catch (error) {
      console.error('获取待办失败:', error);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [summaryRes, trendRes, rankingRes, assignmentRes] = await Promise.all([
        fetch(`/api/dashboard/class/${selectedClass}/summary`, { headers }),
        fetch(`/api/dashboard/class/${selectedClass}/attendance-trend?days=${period === 'week' ? 7 : 30}`, { headers }),
        fetch(`/api/dashboard/class/${selectedClass}/score-ranking?period=${period}`, { headers }),
        fetch(`/api/dashboard/class/${selectedClass}/assignment-stats`, { headers })
      ]);

      setSummary(await summaryRes.json());
      setAttendanceTrend(await trendRes.json());
      setScoreRanking(await rankingRes.json());
      setAssignmentStats(await assignmentRes.json());
    } catch (error) {
      console.error('获取看板数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!selectedClass) {
      toast.warning('请先选择班级');
      return;
    }
    setAiSummaryLoading(true);
    try {
      const data = await aiApi.getClassSummary(selectedClass);
      setAiSummary(data.summary);
      toast.success('课堂小结已生成');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const StatCard = ({ title, value, unit = '', change, changeLabel }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="text-gray-500 text-sm mb-2">{title}</div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-gray-800">{value}</span>
        <span className="text-gray-500 text-sm mb-1">{unit}</span>
      </div>
      {change !== undefined && (
        <div className={`text-sm mt-2 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)} {changeLabel || ''}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">数据看板</h1>
          <p className="text-gray-500 mt-1">班级数据概览与分析</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['week', 'month'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
                  period === p ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600'
                }`}
              >
                {p === 'week' ? '本周' : '本月'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Todos */}
      {todos && (todos.ungraded_assignments > 0 || todos.classes_no_attendance.length > 0 || todos.pending_redemptions > 0) && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-2 text-amber-700 mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium">待处理事项</span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            {todos.ungraded_assignments > 0 && (
              <span className="bg-white px-3 py-1 rounded-full text-amber-700">
                {todos.ungraded_assignments} 份作业待批改
              </span>
            )}
            {todos.classes_no_attendance.length > 0 && (
              <span className="bg-white px-3 py-1 rounded-full text-amber-700">
                {todos.classes_no_attendance.length} 个班级今日未点名
              </span>
            )}
            {todos.pending_redemptions > 0 && (
              <span className="bg-white px-3 py-1 rounded-full text-amber-700">
                {todos.pending_redemptions} 个兑换申请待审核
              </span>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : summary ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="本周出勤率"
              value={summary.attendance?.rate?.toFixed(1) || 0}
              unit="%"
              change={summary.attendance?.change}
              changeLabel="较上周"
            />
            <StatCard
              title="本月人均积分"
              value={summary.score?.avg?.toFixed(0) || 0}
              unit="分"
              change={summary.score?.change}
              changeLabel="较上月"
            />
            <StatCard
              title="作业提交率"
              value={summary.assignment?.submit_rate?.toFixed(1) || 0}
              unit="%"
            />
            <StatCard
              title="作业平均分"
              value={summary.assignment?.avg_score?.toFixed(1) || 0}
              unit="分"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Trend */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">出勤趋势</h3>
              {attendanceTrend.length > 0 ? (
                <div className="h-48 flex items-end gap-1">
                  {attendanceTrend.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-sm transition-all hover:from-purple-600 hover:to-purple-500"
                        style={{ height: `${(item.rate || 0) * 1.8}px` }}
                        title={`${new Date(item.date).toLocaleDateString('zh-CN')}: ${(item.rate || 0).toFixed(1)}%`}
                      />
                      {index % Math.ceil(attendanceTrend.length / 7) === 0 && (
                        <span className="text-xs text-gray-400 mt-1">
                          {new Date(item.date).getDate()}日
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400">
                  暂无出勤数据
                </div>
              )}
            </div>

            {/* Score Ranking */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">积分排行榜</h3>
                <span className="text-sm text-gray-400">Top 10</span>
              </div>
              <div className="space-y-3">
                {scoreRanking.slice(0, 5).map((student, index) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/dashboard/student/${student.id}`)}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-600' :
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      index === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {student.rank}
                    </span>
                    <span className="flex-1 text-gray-700">{student.name}</span>
                    <span className="font-semibold text-purple-600">{student.total_score}</span>
                    {student.week_change !== 0 && (
                      <span className={`text-xs ${student.week_change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {student.week_change > 0 ? '+' : ''}{student.week_change}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Assignment Stats */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">最近作业完成情况</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {assignmentStats.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-gray-100 rounded-lg hover:border-purple-200 transition-colors cursor-pointer"
                  onClick={() => navigate(`/dashboard/assignments/${item.id}`)}
                >
                  <div className="text-sm text-gray-600 truncate mb-2" title={item.title}>
                    {item.title}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className={`text-2xl font-bold ${
                      item.submit_rate >= 90 ? 'text-green-500' :
                      item.submit_rate >= 70 ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      {item.submit_rate.toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-400">
                      {item.submitted_count}/{item.student_count}
                    </div>
                  </div>
                </div>
              ))}
              {assignmentStats.length === 0 && (
                <div className="col-span-5 text-center text-gray-400 py-8">
                  暂无作业数据
                </div>
              )}
            </div>
          </div>

          {/* AI Daily Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">AI 课堂小结</h2>
              <button
                onClick={handleGenerateSummary}
                disabled={aiSummaryLoading}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
              >
                {aiSummaryLoading ? (
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
                    生成今日小结
                  </>
                )}
              </button>
            </div>
            {aiSummary ? (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => { navigator.clipboard.writeText(aiSummary); toast.success('已复制'); }}
                    className="px-3 py-1.5 text-xs text-purple-600 hover:bg-purple-100 rounded-lg transition"
                  >
                    复制
                  </button>
                  <button
                    onClick={handleGenerateSummary}
                    disabled={aiSummaryLoading}
                    className="px-3 py-1.5 text-xs text-purple-600 hover:bg-purple-100 rounded-lg transition"
                  >
                    重新生成
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">点击"生成今日小结"，AI 将根据今日考勤、积分和作业数据生成课堂报告</p>
            )}
          </div>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          请选择班级查看数据
        </div>
      )}
    </div>
  );
};
