import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { coursesApi, membershipApi } from '../services/api';
import { useModal } from '../hooks';

export const Courses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, draft, published
  const [gradeFilter, setGradeFilter] = useState('all'); // all or specific grade
  const [subjectFilter, setSubjectFilter] = useState('all'); // all or specific subject
  const [usageStats, setUsageStats] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid, list

  const modal = useModal({ title: '', grade: '', subject: '', description: '' });

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

  // 获取使用量统计
  const loadUsageStats = () => {
    membershipApi.getUsage().then(setUsageStats).catch(console.error);
  };

  useEffect(() => {
    loadCourses();
    loadUsageStats();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    modal.setError('');

    try {
      const course = await coursesApi.create(modal.formData);
      modal.close();
      // 刷新使用量统计
      loadUsageStats();
      // Navigate to editor
      navigate(`/dashboard/courses/${course.id}/edit`);
    } catch (err) {
      if (err.code === 'LIMIT_EXCEEDED') {
        modal.setError(`${err.message}（当前：${err.current}/${err.limit}）`);
      } else {
        modal.setError(err.message);
      }
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个课程吗？删除后无法恢复。')) return;

    try {
      await coursesApi.delete(id);
      loadCourses();
    } catch (error) {
      alert(error.message);
    }
  };

  const handlePublish = async (course) => {
    const action = course.status === 'published' ? '取消发布' : '发布';
    if (!confirm(`确定要${action}课程"${course.title}"吗？`)) return;

    try {
      if (course.status === 'published') {
        await coursesApi.unpublish(course.id);
      } else {
        await coursesApi.publish(course.id);
      }
      loadCourses();
    } catch (error) {
      alert(error.message);
    }
  };

  const copyShareLink = (shareCode) => {
    const link = `${window.location.origin}/learn/${shareCode}`;
    navigator.clipboard.writeText(link);
    alert('分享链接已复制到剪贴板');
  };

  // Play course - navigate to player page
  const handlePlay = (course) => {
    navigate(`/dashboard/courses/${course.id}/play`);
  };

  const closePlayer = () => {
    setPlayingCourse(null);
    setCurrentAnimation(null);
    setAllAnimations([]);
    setAnimationIndex(0);
  };

  const playNext = () => {
    if (animationIndex < allAnimations.length - 1) {
      const nextIndex = animationIndex + 1;
      setAnimationIndex(nextIndex);
      setCurrentAnimation(allAnimations[nextIndex]);
    }
  };

  const playPrev = () => {
    if (animationIndex > 0) {
      const prevIndex = animationIndex - 1;
      setAnimationIndex(prevIndex);
      setCurrentAnimation(allAnimations[prevIndex]);
    }
  };

  const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三', '高一', '高二', '高三'];
  const subjects = ['数学', '物理', '化学', '生物', '语文', '英语', '历史', '地理', '通用'];

  const filteredCourses = courses.filter((course) => {
    // Filter by status
    if (filter !== 'all' && course.status !== filter) return false;
    // Filter by grade
    if (gradeFilter !== 'all' && course.grade !== gradeFilter) return false;
    // Filter by subject
    if (subjectFilter !== 'all' && course.subject !== subjectFilter) return false;
    return true;
  });

  const publishedCount = courses.filter((c) => c.status === 'published').length;
  const draftCount = courses.filter((c) => c.status === 'draft').length;

  // Get unique grades from courses
  const availableGrades = [...new Set(courses.map(c => c.grade).filter(Boolean))];

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-900">课程动画</h1>
        <div className="flex items-center flex-wrap gap-3">
          {/* Grade Filter */}
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
          >
            <option value="all">全部年级</option>
            {grades.map((grade) => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>

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

          {/* Status Filter */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              全部 ({courses.length})
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'published'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              已发布 ({publishedCount})
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'draft'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              草稿 ({draftCount})
            </button>
          </div>

          {/* 视图切换 */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="网格视图"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="列表视图"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => modal.open()}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25"
          >
            创建课程
          </button>
        </div>
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
                ? 'bg-amber-100'
                : 'bg-purple-100'
            }`}>
              <svg className={`w-5 h-5 ${
                usageStats.usage.courses.current >= usageStats.usage.courses.limit
                  ? 'text-amber-600'
                  : 'text-purple-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className={`text-sm font-medium ${
                usageStats.usage.courses.current >= usageStats.usage.courses.limit
                  ? 'text-amber-800'
                  : 'text-purple-800'
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
            <Link
              to="/dashboard/membership"
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              升级会员
            </Link>
          )}
        </div>
      )}

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
        viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className={`bg-white rounded-2xl shadow-sm border transition-all overflow-hidden ${
                course.canPlay !== false
                  ? 'border-gray-100 hover:shadow-lg hover:border-purple-200'
                  : 'border-purple-100 hover:shadow-md hover:border-purple-300'
              }`}
            >
              {/* Cover - Clickable to play */}
              <div
                className={`aspect-video relative group ${
                  course.canPlay !== false ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
                onClick={() => course.canPlay !== false ? handlePlay(course) : null}
              >
                {course.cover_image ? (
                  <img
                    src={course.cover_image}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  /* 无封面时显示简洁的默认背景 */
                  <div className="w-full h-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center relative overflow-hidden">
                    {/* 装饰性光效 */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    {/* 播放图标 */}
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                      <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Play overlay on hover - only for playable courses */}
                {course.canPlay !== false ? (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
                      <svg className="w-7 h-7 text-purple-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  /* Lock overlay for premium-only courses - elegant gradient design */
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-purple-800/70 to-pink-900/80 backdrop-blur-[2px] flex flex-col items-center justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-500/30">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-amber-900" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    </div>
                    <span className="text-white/90 text-sm font-medium mt-3">会员专享课程</span>
                    <span className="text-white/60 text-xs mt-1">升级解锁全部内容</span>
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  {course.status === 'published' ? (
                    <span className="px-3 py-1 bg-green-500 text-white text-xs rounded-full font-medium">
                      已发布
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-500 text-white text-xs rounded-full font-medium">
                      草稿
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">{course.title}</h3>
                </div>

                {course.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{course.description}</p>
                )}

                <div className="flex items-center flex-wrap gap-2 text-sm text-gray-400 mb-4">
                  {course.grade && (
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs">
                      {course.grade}
                    </span>
                  )}
                  {course.subject && (
                    <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded-md text-xs">
                      {course.subject}
                    </span>
                  )}
                  <span>{course.section_count || 0} 章节</span>
                  <span>{course.animation_count || 0} 动画</span>
                </div>

                {/* Stats */}
                {course.status === 'published' && (
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {course.view_count || 0} 次观看
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    {course.canPlay !== false ? (
                      <button
                        onClick={() => handlePlay(course)}
                        className="p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                        title="播放"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    ) : (
                      <span
                        className="p-2 rounded-lg text-gray-300 cursor-not-allowed"
                        title="需要升级会员"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </span>
                    )}

                    <Link
                      to={`/dashboard/courses/${course.id}/edit`}
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="编辑"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>

                    <button
                      onClick={() => handlePublish(course)}
                      className={`p-2 rounded-lg transition-colors ${
                        course.status === 'published'
                          ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                          : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                      }`}
                      title={course.status === 'published' ? '取消发布' : '发布'}
                    >
                      {course.status === 'published' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      )}
                    </button>

                    {course.status === 'published' && course.share_code && (
                      <button
                        onClick={() => copyShareLink(course.share_code)}
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="复制分享链接"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(course.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="删除"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {course.canPlay !== false ? (
                    <button
                      onClick={() => handlePlay(course)}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center group"
                    >
                      查看课程
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <Link
                      to="/dashboard/membership"
                      className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center group"
                    >
                      升级解锁
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        ) : (
        /* 列表视图 */
        <div className="space-y-4">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className={`bg-white rounded-xl shadow-sm border transition-all overflow-hidden ${
                course.canPlay !== false
                  ? 'border-gray-100 hover:shadow-md hover:border-purple-200'
                  : 'border-purple-100'
              }`}
            >
              <div className="flex items-center p-4 gap-4">
                {/* 缩略图 */}
                <div
                  className={`w-32 h-20 rounded-lg overflow-hidden flex-shrink-0 relative ${
                    course.canPlay !== false ? 'cursor-pointer' : 'cursor-not-allowed'
                  }`}
                  onClick={() => course.canPlay !== false ? handlePlay(course) : null}
                >
                  {course.cover_image ? (
                    <img src={course.cover_image} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  )}
                  {/* 锁定遮罩 */}
                  {course.canPlay === false && (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 to-pink-900/80 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* 课程信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-gray-900 truncate">{course.title}</h3>
                    {course.status === 'published' ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">已发布</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">草稿</span>
                    )}
                    {course.canPlay === false && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">会员</span>
                    )}
                  </div>
                  {course.description && (
                    <p className="text-sm text-gray-500 truncate mb-2">{course.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {course.grade && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded">{course.grade}</span>}
                    {course.subject && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded">{course.subject}</span>}
                    <span>{course.section_count || 0} 章节</span>
                    <span>{course.animation_count || 0} 动画</span>
                    {course.status === 'published' && <span>{course.view_count || 0} 次观看</span>}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {course.canPlay !== false ? (
                    <button
                      onClick={() => handlePlay(course)}
                      className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
                    >
                      播放
                    </button>
                  ) : (
                    <Link
                      to="/dashboard/membership"
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      解锁
                    </Link>
                  )}
                  <Link
                    to={`/dashboard/courses/${course.id}/edit`}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-14 text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mt-5 text-xl font-medium text-gray-900">
            {(filter !== 'all' || gradeFilter !== 'all' || subjectFilter !== 'all') ? '没有符合条件的课程' : '还没有课程'}
          </h3>
          <p className="mt-3 text-gray-500">
            {(filter !== 'all' || gradeFilter !== 'all' || subjectFilter !== 'all')
              ? '试试其他筛选条件，或创建一个新课程'
              : '创建您的第一个课程动画，用于课堂教学或学生自学'}
          </p>
          <div className="mt-8">
            <button
              onClick={() => modal.open()}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25"
            >
              创建课程
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-10 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">创建课程</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {modal.error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">
                  {modal.error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">课程标题 *</label>
                <input
                  type="text"
                  required
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
                  value={modal.formData.title}
                  onChange={(e) => modal.updateField('title', e.target.value)}
                  placeholder="例如：三角形基础知识"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">年级</label>
                <select
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow bg-white"
                  value={modal.formData.grade}
                  onChange={(e) => modal.updateField('grade', e.target.value)}
                >
                  <option value="">请选择年级</option>
                  {grades.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">学科</label>
                <select
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow bg-white"
                  value={modal.formData.subject}
                  onChange={(e) => modal.updateField('subject', e.target.value)}
                >
                  <option value="">请选择学科</option>
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">课程描述</label>
                <textarea
                  rows={3}
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow resize-none"
                  value={modal.formData.description}
                  onChange={(e) => modal.updateField('description', e.target.value)}
                  placeholder="简要描述课程内容..."
                />
              </div>
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => modal.close()}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  创建并编辑
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
