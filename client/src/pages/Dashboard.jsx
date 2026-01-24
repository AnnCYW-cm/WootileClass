import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { classesApi } from '../services/api';
import { useAuth } from '../store/AuthContext';

export const Dashboard = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const data = await classesApi.getAll();
      setClasses(data);
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = classes.reduce((sum, c) => sum + parseInt(c.student_count || 0), 0);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          欢迎回来，{user?.name || '老师'}！
        </h1>
        <p className="text-gray-500 mt-3">这是您的教学工作台</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ml-6">
              <p className="text-sm font-medium text-gray-400">班级数量</p>
              <p className="text-4xl font-bold text-gray-900 mt-1">{classes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-green-500/25">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="ml-6">
              <p className="text-sm font-medium text-gray-400">学生总数</p>
              <p className="text-4xl font-bold text-gray-900 mt-1">{totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/25">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div className="ml-6">
              <p className="text-sm font-medium text-gray-400">今日点名</p>
              <p className="text-4xl font-bold text-gray-900 mt-1">-</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">快捷操作</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Link
            to="/dashboard/classes"
            className="flex flex-col items-center p-6 rounded-2xl border-2 border-gray-100 hover:border-purple-300 hover:bg-purple-50 transition-all group"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/20">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="mt-4 text-sm font-medium text-gray-700">创建班级</span>
          </Link>
          <Link
            to="/dashboard/rollcall"
            className="flex flex-col items-center p-6 rounded-2xl border-2 border-gray-100 hover:border-purple-300 hover:bg-purple-50 transition-all group"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <span className="mt-4 text-sm font-medium text-gray-700">随机点名</span>
          </Link>
          <Link
            to="/dashboard/rollcall?mode=quick"
            className="flex flex-col items-center p-6 rounded-2xl border-2 border-gray-100 hover:border-purple-300 hover:bg-purple-50 transition-all group"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg shadow-green-500/20">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="mt-4 text-sm font-medium text-gray-700">快速点名</span>
          </Link>
          <Link
            to="/dashboard/classes"
            className="flex flex-col items-center p-6 rounded-2xl border-2 border-gray-100 hover:border-purple-300 hover:bg-purple-50 transition-all group"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/20">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <span className="mt-4 text-sm font-medium text-gray-700">导入学生</span>
          </Link>
        </div>
      </div>

      {/* Recent Classes */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="animate-pulse space-y-5">
            <div className="h-5 bg-gray-100 rounded-full w-1/4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-100 rounded-full"></div>
              <div className="h-4 bg-gray-100 rounded-full"></div>
            </div>
          </div>
        </div>
      ) : classes.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">我的班级</h2>
            <Link to="/dashboard/classes" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
              查看全部 →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {classes.slice(0, 3).map((cls) => (
              <Link
                key={cls.id}
                to={`/dashboard/classes/${cls.id}`}
                className="border-2 border-gray-100 rounded-xl p-6 hover:border-purple-300 hover:shadow-md transition-all group"
              >
                <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">{cls.name}</h3>
                <p className="text-sm text-gray-400 mt-2">
                  {cls.grade && `${cls.grade} · `}
                  {cls.subject && `${cls.subject} · `}
                  {cls.student_count || 0} 名学生
                </p>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-14 text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="mt-5 text-xl font-medium text-gray-900">还没有班级</h3>
          <p className="mt-3 text-gray-500">创建您的第一个班级开始使用</p>
          <div className="mt-8">
            <Link
              to="/dashboard/classes"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25"
            >
              创建班级
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
