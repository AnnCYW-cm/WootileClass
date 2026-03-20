import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { coursesApi, membershipApi } from '../services/api';

export const Courses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [usageStats, setUsageStats] = useState(null);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await coursesApi.getAll();
      setCourses(data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsageStats = () => {
    membershipApi.getUsage().then(setUsageStats).catch(console.error);
  };

  useEffect(() => {
    loadCourses();
    loadUsageStats();
  }, []);

  const handlePlay = (course) => {
    navigate(`/dashboard/courses/${course.id}/play`);
  };

  const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三', '高一', '高二', '高三'];

  const subjectsByGrade = {
    '一年级': ['语文', '数学', '英语', '科学'],
    '二年级': ['语文', '数学', '英语', '科学'],
    '三年级': ['语文', '数学', '英语', '科学'],
    '四年级': ['语文', '数学', '英语', '科学'],
    '五年级': ['语文', '数学', '英语', '科学'],
    '六年级': ['语文', '数学', '英语', '科学'],
    '初一': ['语文', '数学', '英语', '生物', '历史', '地理'],
    '初二': ['语文', '数学', '英语', '物理', '生物', '历史', '地理'],
    '初三': ['语文', '数学', '英语', '物理', '化学', '历史'],
    '高一': ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理'],
    '高二': ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理'],
    '高三': ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理'],
  };

  const subjects = selectedGrade ? (subjectsByGrade[selectedGrade] || []) : [];

  const gradeCourses = selectedGrade
    ? courses.filter((c) => c.grade === selectedGrade)
    : courses;

  const filteredCourses = gradeCourses.filter((course) => {
    if (subjectFilter !== 'all' && course.subject !== subjectFilter) return false;
    return true;
  });

  const courseCountByGrade = {};
  courses.forEach((c) => {
    if (c.grade) {
      courseCountByGrade[c.grade] = (courseCountByGrade[c.grade] || 0) + 1;
    }
  });

  const gradeGroups = [
    { label: '小学', grades: ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'], color: 'blue' },
    { label: '初中', grades: ['初一', '初二', '初三'], color: 'purple' },
    { label: '高中', grades: ['高一', '高二', '高三'], color: 'pink' },
  ];

  const colorMap = {
    blue: { card: 'from-blue-500 to-cyan-400', hover: 'hover:shadow-blue-200' },
    purple: { card: 'from-purple-500 to-violet-400', hover: 'hover:shadow-purple-200' },
    pink: { card: 'from-pink-500 to-rose-400', hover: 'hover:shadow-pink-200' },
  };

  // ========== Grade Picker View ==========
  if (!selectedGrade) {
    return (
      <div className="space-y-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">课程动画</h1>
          <p className="text-gray-500 mt-2">选择年级，浏览精选课程动画</p>
        </div>

        {/* 使用量提示 */}
        {usageStats && !usageStats.usage?.courses?.unlimited && (
          <div className={`p-4 rounded-xl flex items-center justify-between ${
            usageStats.usage.courses.current >= usageStats.usage.courses.limit
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-purple-50 border border-purple-100'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                usageStats.usage.courses.current >= usageStats.usage.courses.limit
                  ? 'bg-amber-100' : 'bg-purple-100'
              }`}>
                <svg className={`w-5 h-5 ${
                  usageStats.usage.courses.current >= usageStats.usage.courses.limit
                    ? 'text-amber-600' : 'text-purple-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className={`text-sm font-medium ${
                  usageStats.usage.courses.current >= usageStats.usage.courses.limit
                    ? 'text-amber-800' : 'text-purple-800'
                }`}>
                  {usageStats.usage.courses.current >= usageStats.usage.courses.limit
                    ? `免费版可播放 ${usageStats.usage.courses.limit} 个课程，已达上限`
                    : `免费版可播放 ${usageStats.usage.courses.limit} 个课程，还可播放 ${usageStats.usage.courses.limit - usageStats.usage.courses.current} 个`
                  }
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {usageStats.isPremium ? '会员版 · 无限播放' : '升级会员解锁全部课程动画'}
                </p>
              </div>
            </div>
            {!usageStats.isPremium && (
              <Link to="/dashboard/membership" className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
                升级会员
              </Link>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-32 bg-gray-100 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {gradeGroups.map((group) => {
              const colors = colorMap[group.color];
              return (
                <div key={group.label}>
                  <h2 className="text-lg font-semibold text-gray-700 mb-4">{group.label}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {group.grades.map((grade) => {
                      const count = courseCountByGrade[grade] || 0;
                      return (
                        <button
                          key={grade}
                          onClick={() => {
                            setSelectedGrade(grade);
                            setSubjectFilter('all');
                          }}
                          className={`relative p-6 rounded-2xl bg-gradient-to-br ${colors.card} text-white shadow-lg ${colors.hover} hover:shadow-xl hover:scale-[1.03] transition-all duration-200 text-left`}
                        >
                          <div className="text-lg font-bold">{grade}</div>
                          <div className="text-white/80 text-sm mt-1">
                            {count > 0 ? `${count} 个课程` : '即将上线'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ========== Course List View (grade selected) ==========
  return (
    <div className="space-y-10">
      {/* Header with breadcrumb */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedGrade(null)}
            className="p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
            title="返回年级选择"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <button onClick={() => setSelectedGrade(null)} className="hover:text-purple-600 transition-colors">课程动画</button>
              <span>/</span>
              <span className="text-gray-700 font-medium">{selectedGrade}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedGrade} · 课程动画</h1>
          </div>
        </div>
        <div className="flex items-center flex-wrap gap-3">
          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
          >
            <option value="all">全部科目</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>

          <span className="text-sm text-gray-400">{filteredCourses.length} 个课程</span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-pulse">
              <div className="h-40 bg-gray-100 rounded-xl mb-4"></div>
              <div className="h-5 bg-gray-100 rounded-full w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-100 rounded-full w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className={`bg-white rounded-2xl shadow-sm border transition-all overflow-hidden ${
                course.canPlay !== false
                  ? 'border-gray-100 hover:shadow-lg hover:border-purple-200 cursor-pointer'
                  : 'border-purple-100 hover:shadow-md hover:border-purple-300'
              }`}
              onClick={() => course.canPlay !== false ? handlePlay(course) : null}
            >
              {/* Cover */}
              <div className="aspect-video relative group">
                {course.cover_image ? (
                  <img src={course.cover_image} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                      <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Play overlay */}
                {course.canPlay !== false ? (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
                      <svg className="w-7 h-7 text-purple-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-purple-800/70 to-pink-900/80 backdrop-blur-[2px] flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-xl">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <span className="text-white/90 text-sm font-medium mt-3">会员专享</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 truncate mb-2">{course.title}</h3>
                {course.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{course.description}</p>
                )}
                <div className="flex items-center flex-wrap gap-2 text-sm text-gray-400">
                  {course.subject && (
                    <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded-xl text-xs">{course.subject}</span>
                  )}
                  <span>{course.section_count || 0} 章节</span>
                  <span>{course.animation_count || 0} 动画</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-14 text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mt-5 text-xl font-medium text-gray-900">
            {subjectFilter !== 'all' ? '没有符合条件的课程' : `${selectedGrade}的课程即将上线`}
          </h3>
          <p className="mt-3 text-gray-500">
            {subjectFilter !== 'all' ? '试试其他科目筛选' : '我们正在为该年级准备精选课程动画，敬请期待'}
          </p>
        </div>
      )}
    </div>
  );
};
