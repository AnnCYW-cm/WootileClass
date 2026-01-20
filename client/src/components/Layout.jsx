import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

export const PublicLayout = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-indigo-600">
                教师教学平台
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  进入工作台
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-indigo-600"
                  >
                    登录
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    注册
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showToolsMenu, setShowToolsMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className="text-xl font-bold text-indigo-600">
                教师教学平台
              </Link>
              <div className="hidden md:flex space-x-1">
                <Link
                  to="/dashboard"
                  className="px-3 py-2 rounded-md text-sm text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                >
                  工作台
                </Link>
                <Link
                  to="/dashboard/classes"
                  className="px-3 py-2 rounded-md text-sm text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                >
                  班级管理
                </Link>
                <Link
                  to="/dashboard/rollcall"
                  className="px-3 py-2 rounded-md text-sm text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                >
                  点名系统
                </Link>
                <Link
                  to="/dashboard/scores"
                  className="px-3 py-2 rounded-md text-sm text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                >
                  学生积分
                </Link>
                <Link
                  to="/dashboard/assignments"
                  className="px-3 py-2 rounded-md text-sm text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                >
                  作业管理
                </Link>
                {/* Classroom Tools Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowToolsMenu(!showToolsMenu)}
                    onBlur={() => setTimeout(() => setShowToolsMenu(false), 200)}
                    className="px-3 py-2 rounded-md text-sm text-gray-700 hover:text-indigo-600 hover:bg-gray-50 flex items-center"
                  >
                    课堂工具
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showToolsMenu && (
                    <div className="absolute left-0 mt-1 w-40 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        to="/dashboard/tools"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        计时器/噪音监测
                      </Link>
                      <Link
                        to="/dashboard/groups"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        分组工具
                      </Link>
                      <Link
                        to="/dashboard/seating"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        座位表
                      </Link>
                    </div>
                  )}
                </div>
                <Link
                  to="/dashboard/statistics"
                  className="px-3 py-2 rounded-md text-sm text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                >
                  数据统计
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 text-sm">{user?.name || user?.email}</span>
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-red-600 text-sm"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};
