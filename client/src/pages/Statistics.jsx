import { useState, useEffect } from 'react';
import { classesApi, attendanceApi, scoresApi, assignmentsApi } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { useToastContext } from '../store/ToastContext';

export const Statistics = () => {
  const toast = useToastContext();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [activeTab, setActiveTab] = useState('attendance');
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Statistics data
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [scoreStats, setScoreStats] = useState(null);
  const [assignmentStats, setAssignmentStats] = useState([]);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStatistics();
    }
  }, [selectedClass, dateRange, activeTab]);

  const loadClasses = async () => {
    try {
      const data = await classesApi.getAll();
      const activeClasses = data.filter(c => c.status !== 'archived');
      setClasses(activeClasses);
      if (activeClasses.length > 0) {
        setSelectedClass(activeClasses[0].id);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    setLoading(true);
    try {
      if (activeTab === 'attendance') {
        const data = await attendanceApi.getStats(selectedClass, dateRange.start, dateRange.end);
        setAttendanceStats(data);
      } else if (activeTab === 'scores') {
        const [ranking, students] = await Promise.all([
          scoresApi.getRanking(selectedClass, 'all'),
          scoresApi.getByClass(selectedClass)
        ]);
        setScoreStats({ ranking, students });
      } else if (activeTab === 'assignments') {
        const data = await assignmentsApi.getAll(selectedClass);
        setAssignmentStats(data);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.warning('没有数据可导出');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const val = row[h];
        // Handle values that might contain commas or quotes
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val ?? '';
      }).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportAttendance = () => {
    if (!attendanceStats?.students) return;
    const data = attendanceStats.students.map(s => ({
      '姓名': s.name,
      '学号': s.student_no || '',
      '出勤次数': s.present_count || 0,
      '缺勤次数': s.absent_count || 0,
      '迟到次数': s.late_count || 0,
      '请假次数': s.leave_count || 0,
      '出勤率': `${((s.present_count || 0) / (s.total_count || 1) * 100).toFixed(1)}%`
    }));
    exportToCSV(data, '出勤统计');
  };

  const exportScores = () => {
    if (!scoreStats?.students) return;
    const data = scoreStats.students.map((s, idx) => ({
      '排名': idx + 1,
      '姓名': s.name,
      '学号': s.student_no || '',
      '总积分': s.total_score || 0
    }));
    exportToCSV(data, '积分统计');
  };

  const exportAssignments = () => {
    if (!assignmentStats || assignmentStats.length === 0) return;
    const data = assignmentStats.map(a => ({
      '作业标题': a.title,
      '类型': a.type === 'homework' ? '家庭作业' : '课堂作业',
      '创建时间': new Date(a.created_at).toLocaleDateString(),
      '截止时间': a.deadline ? new Date(a.deadline).toLocaleDateString() : '无',
      '已提交': a.submission_count || 0,
      '总人数': a.student_count || 0,
      '提交率': `${a.student_count > 0 ? Math.round((a.submission_count || 0) / a.student_count * 100) : 0}%`
    }));
    exportToCSV(data, '作业统计');
  };

  const getAttendanceRate = (stats) => {
    if (!stats?.summary) return 0;
    const { present, total } = stats.summary;
    return total > 0 ? (present / total * 100).toFixed(1) : 0;
  };

  if (loading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">请先创建班级</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">数据统计</h1>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-purple-500 focus:border-transparent"
        >
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'attendance', label: '出勤统计' },
            { key: 'scores', label: '积分统计' },
            { key: 'assignments', label: '作业统计' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Date Range Filter */}
          <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">时间范围:</span>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-3 py-1 border border-gray-300 rounded-xl text-sm"
              />
              <span className="text-gray-400">至</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-3 py-1 border border-gray-300 rounded-xl text-sm"
              />
            </div>
            <button
              onClick={exportAttendance}
              className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              导出 CSV
            </button>
          </div>

          {/* Summary Cards */}
          {attendanceStats?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">总点名次数</div>
                <div className="text-2xl font-bold text-gray-900">{attendanceStats.summary.total || 0}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">出勤</div>
                <div className="text-2xl font-bold text-green-600">{attendanceStats.summary.present || 0}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">缺勤</div>
                <div className="text-2xl font-bold text-red-600">{attendanceStats.summary.absent || 0}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">迟到</div>
                <div className="text-2xl font-bold text-yellow-600">{attendanceStats.summary.late || 0}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">出勤率</div>
                <div className="text-2xl font-bold text-purple-600">{getAttendanceRate(attendanceStats)}%</div>
              </div>
            </div>
          )}

          {/* Attendance Charts */}
          {attendanceStats?.summary && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Pie chart - attendance distribution */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">出勤分布</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: '出勤', value: attendanceStats.summary.present || 0 },
                          { name: '缺勤', value: attendanceStats.summary.absent || 0 },
                          { name: '迟到', value: attendanceStats.summary.late || 0 },
                          { name: '请假', value: attendanceStats.summary.leave || 0 },
                        ].filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#22c55e" />
                        <Cell fill="#ef4444" />
                        <Cell fill="#eab308" />
                        <Cell fill="#3b82f6" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Bar chart - per student attendance */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">学生出勤率</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={(attendanceStats.students || []).slice(0, 15).map(s => {
                      const total = (s.present_count || 0) + (s.absent_count || 0) + (s.late_count || 0) + (s.leave_count || 0);
                      return {
                        name: s.name,
                        出勤率: total > 0 ? Math.round((s.present_count || 0) / total * 100) : 0,
                      };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Bar dataKey="出勤率" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
          )}

          {/* Student List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">学生出勤明细</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">学号</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">出勤</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">缺勤</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">迟到</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">请假</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">出勤率</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceStats?.students?.map((student) => {
                    const total = (student.present_count || 0) + (student.absent_count || 0) + (student.late_count || 0) + (student.leave_count || 0);
                    const rate = total > 0 ? ((student.present_count || 0) / total * 100).toFixed(1) : '-';
                    return (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.student_no || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-600">{student.present_count || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-red-600">{student.absent_count || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-yellow-600">{student.late_count || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-600">{student.leave_count || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium">{rate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {(!attendanceStats?.students || attendanceStats.students.length === 0) && (
                <div className="p-8 text-center text-gray-500">暂无数据</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scores Tab */}
      {activeTab === 'scores' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={exportScores}
              className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              导出 CSV
            </button>
          </div>

          {/* Summary Cards */}
          {scoreStats?.students && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">总人数</div>
                <div className="text-2xl font-bold text-gray-900">{scoreStats.students.length}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">总积分</div>
                <div className="text-2xl font-bold text-purple-600">
                  {scoreStats.students.reduce((sum, s) => sum + (s.total_score || 0), 0)}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">平均积分</div>
                <div className="text-2xl font-bold text-green-600">
                  {scoreStats.students.length > 0
                    ? (scoreStats.students.reduce((sum, s) => sum + (s.total_score || 0), 0) / scoreStats.students.length).toFixed(1)
                    : 0}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">最高积分</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {Math.max(...scoreStats.students.map(s => s.total_score || 0), 0)}
                </div>
              </div>
            </div>
          )}

          {/* Score Chart */}
          {scoreStats?.ranking && scoreStats.ranking.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">积分排行 Top 15</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={scoreStats.ranking.slice(0, 15).map((s) => ({
                    name: s.name,
                    积分: s.total_score || 0,
                  }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="积分" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
          )}

          {/* Ranking List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">积分排行榜</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">排名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">学号</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">总积分</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scoreStats?.ranking?.map((student, idx) => (
                    <tr key={student.id} className={idx < 3 ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-lg ${idx < 3 ? 'font-bold' : ''}`}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.student_no || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-purple-600">{student.total_score || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!scoreStats?.ranking || scoreStats.ranking.length === 0) && (
                <div className="p-8 text-center text-gray-500">暂无数据</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={exportAssignments}
              className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              导出 CSV
            </button>
          </div>

          {/* Summary Cards */}
          {assignmentStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">作业总数</div>
                <div className="text-2xl font-bold text-gray-900">{assignmentStats.length}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">课堂作业</div>
                <div className="text-2xl font-bold text-blue-600">
                  {assignmentStats.filter(a => a.type === 'classroom').length}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">家庭作业</div>
                <div className="text-2xl font-bold text-purple-600">
                  {assignmentStats.filter(a => a.type === 'homework').length}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">平均提交率</div>
                <div className="text-2xl font-bold text-green-600">
                  {assignmentStats.length > 0
                    ? (assignmentStats.reduce((sum, a) => {
                        const rate = a.student_count > 0 ? (a.submission_count || 0) / a.student_count : 0;
                        return sum + rate;
                      }, 0) / assignmentStats.length * 100).toFixed(1)
                    : 0}%
                </div>
              </div>
            </div>
          )}

          {/* Assignment Chart */}
          {assignmentStats && assignmentStats.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">作业提交率</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={assignmentStats.map(a => ({
                    name: a.title.length > 8 ? a.title.slice(0, 8) + '...' : a.title,
                    提交率: a.student_count > 0 ? Math.round((a.submission_count || 0) / a.student_count * 100) : 0,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="提交率" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
          )}

          {/* Assignment List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">作业列表</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">标题</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">已提交</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">总人数</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">提交率</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignmentStats?.map((assignment) => {
                    const rate = assignment.student_count > 0
                      ? Math.round((assignment.submission_count || 0) / assignment.student_count * 100)
                      : 0;
                    return (
                      <tr key={assignment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{assignment.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded ${
                            assignment.type === 'homework' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {assignment.type === 'homework' ? '家庭作业' : '课堂作业'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(assignment.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-600">
                          {assignment.submission_count || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                          {assignment.student_count || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className={`font-medium ${rate >= 80 ? 'text-green-600' : rate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {rate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {(!assignmentStats || assignmentStats.length === 0) && (
                <div className="p-8 text-center text-gray-500">暂无作业数据</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
