import { useState, createContext, useContext } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

// Theme Context
const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

export const PublicLayout = () => {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(false);

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark }}>
      <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
        <nav className={`sticky top-0 z-50 transition-colors duration-300 ${isDark ? 'bg-gradient-to-b from-[#0a0a0a] to-transparent' : 'bg-white/80 backdrop-blur-xl border-b border-gray-100'}`}>
          <div className="max-w-7xl mx-auto px-10">
            <div className="flex justify-between h-24">
              <div className="flex items-center">
                <Link to="/" className="group flex items-center gap-4">
                  {/* Logo icon */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <span className="text-3xl">🎓</span>
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-2xl font-bold tracking-tight group-hover:text-purple-500 transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>木瓦课堂</span>
                    <span className="text-xs font-medium text-gray-400 tracking-widest uppercase">WootileClass</span>
                  </div>
                </Link>
              </div>
              <div className="flex items-center space-x-6">
                {/* Theme Toggle */}
                <button
                  onClick={() => setIsDark(!isDark)}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                >
                  {isDark ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
                {user ? (
                  <Link
                    to="/dashboard"
                    className="px-8 py-3 text-base font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25"
                  >
                    进入工作台
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className={`px-5 py-2.5 text-base font-medium transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      登录
                    </Link>
                    <Link
                      to="/register"
                      className="px-8 py-3 text-base font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25"
                    >
                      免费注册
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
    </ThemeContext.Provider>
  );
};

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showTeachingMenu, setShowTeachingMenu] = useState(false);
  const [showResourceMenu, setShowResourceMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-sm">🎓</span>
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  木瓦课堂
                </span>
              </Link>
              {/* Mobile hamburger button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
              <div className="hidden md:flex space-x-1">
                <Link
                  to="/dashboard"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                >
                  工作台
                </Link>
                <Link
                  to="/dashboard/classes"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                >
                  班级管理
                </Link>
                {/* 教学管理 Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowTeachingMenu(!showTeachingMenu)}
                    onBlur={() => setTimeout(() => setShowTeachingMenu(false), 200)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors flex items-center"
                  >
                    教学管理
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showTeachingMenu && (
                    <div className="absolute left-0 mt-2 w-40 bg-white rounded-xl shadow-lg py-2 z-50 border border-gray-100">
                      <Link to="/dashboard/rollcall" className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors">点名系统</Link>
                      <Link to="/dashboard/scores" className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors">学生积分</Link>
                      <Link to="/dashboard/assignments" className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors">作业管理</Link>
                      <Link to="/dashboard/exams" className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors">成绩管理</Link>
                    </div>
                  )}
                </div>
                {/* 教学资源 Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowResourceMenu(!showResourceMenu)}
                    onBlur={() => setTimeout(() => setShowResourceMenu(false), 200)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors flex items-center"
                  >
                    教学资源
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showResourceMenu && (
                    <div className="absolute left-0 mt-2 w-40 bg-white rounded-xl shadow-lg py-2 z-50 border border-gray-100">
                      <Link to="/dashboard/courses" className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors">课程动画</Link>
                      <Link to="/dashboard/videos" className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors">视频课程</Link>
                      <Link to="/dashboard/ai-prep" className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors">AI 备课助手</Link>
                    </div>
                  )}
                </div>
                {/* 课堂工具 Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowToolsMenu(!showToolsMenu)}
                    onBlur={() => setTimeout(() => setShowToolsMenu(false), 200)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors flex items-center"
                  >
                    课堂工具
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showToolsMenu && (
                    <div className="absolute left-0 mt-2 w-44 bg-white rounded-xl shadow-lg py-2 z-50 border border-gray-100">
                      <Link to="/dashboard/tools" className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors">计时器/噪音监测</Link>
                      <Link to="/dashboard/groups" className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors">分组工具</Link>
                      <Link to="/dashboard/seating" className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors">座位表</Link>
                    </div>
                  )}
                </div>
                {/* 数据报表 Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowDataMenu(!showDataMenu)}
                    onBlur={() => setTimeout(() => setShowDataMenu(false), 200)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors flex items-center"
                  >
                    数据报表
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showDataMenu && (
                    <div className="absolute left-0 mt-2 w-40 bg-white rounded-xl shadow-lg py-2 z-50 border border-gray-100">
                      <Link to="/dashboard/data" className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors">数据看板</Link>
                      <Link to="/dashboard/export" className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors">数据导出</Link>
                      <Link to="/dashboard/reports" className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors">家长报告</Link>
                      <Link to="/dashboard/statistics" className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors">数据统计</Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/dashboard/membership"
                className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full text-base font-medium hover:opacity-90 transition-opacity flex items-center gap-2.5 shadow-sm"
              >
                <span>👑</span>
                会员
              </Link>
              <span className="text-gray-600 text-base font-medium">{user?.name || user?.email}</span>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-500 text-base font-medium transition-colors"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </nav>
      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 shadow-lg sticky top-20 z-40">
          <div className="px-4 py-4 space-y-4">
            {/* 工作台 */}
            <div>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-colors"
              >
                工作台
              </Link>
            </div>
            {/* 班级管理 */}
            <div>
              <Link
                to="/dashboard/classes"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-colors"
              >
                班级管理
              </Link>
            </div>
            {/* 教学管理 */}
            <div>
              <div className="px-4 py-1.5 text-xs font-semibold text-purple-500 uppercase tracking-wider">教学管理</div>
              <Link to="/dashboard/rollcall" onClick={() => setMobileMenuOpen(false)} className="block px-8 py-2 rounded-lg text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors">点名系统</Link>
              <Link to="/dashboard/scores" onClick={() => setMobileMenuOpen(false)} className="block px-8 py-2 rounded-lg text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors">学生积分</Link>
              <Link to="/dashboard/assignments" onClick={() => setMobileMenuOpen(false)} className="block px-8 py-2 rounded-lg text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors">作业管理</Link>
              <Link to="/dashboard/exams" onClick={() => setMobileMenuOpen(false)} className="block px-8 py-2 rounded-lg text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors">成绩管理</Link>
            </div>
            {/* 教学资源 */}
            <div>
              <div className="px-4 py-1.5 text-xs font-semibold text-purple-500 uppercase tracking-wider">教学资源</div>
              <Link to="/dashboard/courses" onClick={() => setMobileMenuOpen(false)} className="block px-8 py-2 rounded-lg text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors">课程动画</Link>
              <Link to="/dashboard/videos" onClick={() => setMobileMenuOpen(false)} className="block px-8 py-2 rounded-lg text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors">视频课程</Link>
              <Link to="/dashboard/ai-prep" onClick={() => setMobileMenuOpen(false)} className="block px-8 py-2 rounded-lg text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors">AI 备课助手</Link>
            </div>
            {/* 课堂工具 */}
            <div>
              <div className="px-4 py-1.5 text-xs font-semibold text-purple-500 uppercase tracking-wider">课堂工具</div>
              <Link to="/dashboard/tools" onClick={() => setMobileMenuOpen(false)} className="block px-8 py-2 rounded-lg text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors">计时器/噪音监测</Link>
              <Link to="/dashboard/groups" onClick={() => setMobileMenuOpen(false)} className="block px-8 py-2 rounded-lg text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors">分组工具</Link>
              <Link to="/dashboard/seating" onClick={() => setMobileMenuOpen(false)} className="block px-8 py-2 rounded-lg text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors">座位表</Link>
            </div>
            {/* 数据报表 */}
            <div>
              <div className="px-4 py-1.5 text-xs font-semibold text-purple-500 uppercase tracking-wider">数据报表</div>
              <Link to="/dashboard/data" onClick={() => setMobileMenuOpen(false)} className="block px-8 py-2 rounded-lg text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors">数据看板</Link>
              <Link to="/dashboard/export" onClick={() => setMobileMenuOpen(false)} className="block px-8 py-2 rounded-lg text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors">数据导出</Link>
              <Link to="/dashboard/reports" onClick={() => setMobileMenuOpen(false)} className="block px-8 py-2 rounded-lg text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors">家长报告</Link>
              <Link to="/dashboard/statistics" onClick={() => setMobileMenuOpen(false)} className="block px-8 py-2 rounded-lg text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors">数据统计</Link>
            </div>
            {/* User info section */}
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <Link
                to="/dashboard/membership"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors"
              >
                <span>👑</span> 会员
              </Link>
              <div className="px-4 py-2 text-sm text-gray-600 font-medium">{user?.name || user?.email}</div>
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      )}
      <main className="max-w-7xl mx-auto py-10 px-8">
        <Outlet />
      </main>
    </div>
  );
};
