import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { coursesApi } from '../services/api';
import { useToastContext } from '../store/ToastContext';

export const CoursePlayer = () => {
  const { id } = useParams();
  const toast = useToastContext();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentAnimation, setCurrentAnimation] = useState(null);
  const [allAnimations, setAllAnimations] = useState([]);
  const [animationIndex, setAnimationIndex] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    loadCourse();
    loadComments();
  }, [id]);

  const loadCourse = async () => {
    try {
      const data = await coursesApi.getById(id);
      setCourse(data);

      const animations = [];
      data.sections?.forEach(section => {
        section.animations?.forEach(anim => {
          animations.push({ ...anim, sectionTitle: section.title });
        });
      });

      setAllAnimations(animations);
      if (animations.length > 0) {
        setCurrentAnimation(animations[0]);
        setAnimationIndex(0);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectAnimation = (index) => {
    setAnimationIndex(index);
    setCurrentAnimation(allAnimations[index]);
  };

  const loadComments = async () => {
    try {
      const data = await coursesApi.getComments(id);
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const comment = await coursesApi.createComment(id, newComment.trim());
      setComments([comment, ...comments]);
      setNewComment('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('确定要删除这条评论吗？')) return;

    try {
      await coursesApi.deleteComment(id, commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || '课程不存在'}</p>
          <Link to="/dashboard/courses" className="text-blue-600 hover:underline">
            返回课程列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              to="/dashboard/courses"
              className="p-3 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>

            <Link to="/dashboard" className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                <span className="text-white text-xl">🎓</span>
              </div>
              <span className="font-bold text-2xl text-gray-900">木瓦课堂</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {course.status === 'published' && course.share_code && (
              <button
                onClick={() => {
                  const link = `${window.location.origin}/learn/${course.share_code}`;
                  navigator.clipboard.writeText(link);
                  toast.success('分享链接已复制');
                }}
                className="flex items-center gap-2 px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-full transition-colors text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="font-medium">分享</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <div className="flex gap-8">
        {/* Left - Video Section */}
        <div className="flex-1 min-w-0">
          {/* Video Player */}
          <div className="bg-black rounded-xl overflow-hidden shadow-lg">
            {currentAnimation ? (
              <div className="aspect-video">
                {(currentAnimation.type === 'html' || currentAnimation.source_url?.endsWith('.html')) ? (
                  <iframe
                    src={currentAnimation.source_url}
                    title={currentAnimation.title}
                    className="w-full h-full border-0"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-gray-400">暂不支持此动画类型</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video flex items-center justify-center bg-gray-900">
                <div className="text-center text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>暂无动画内容</p>
                </div>
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="mt-5">
            <h1 className="text-2xl font-semibold text-gray-900 leading-tight">
              {currentAnimation?.title || course.title}
            </h1>

            <div className="flex items-center gap-3 mt-3 text-base text-gray-500">
              <span>{animationIndex + 1} / {allAnimations.length} 个动画</span>
              <span>•</span>
              <span>{currentAnimation?.sectionTitle}</span>
            </div>

            {/* Course Info Card */}
            <div className="flex items-start gap-5 py-5 mt-2 border-t">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-white text-xl">📚</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-900 text-lg">{course.title}</h3>
                  {course.subject && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {course.subject}
                    </span>
                  )}
                  {course.grade && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      {course.grade}
                    </span>
                  )}
                </div>
                <p className="text-base text-gray-600 mt-2 line-clamp-2">
                  {course.description || '暂无简介'}
                </p>
              </div>
            </div>

            {/* Description if animation has one */}
            {currentAnimation?.description && (
              <div className="bg-gray-100 rounded-2xl p-4 mt-3">
                <p className="text-base text-gray-700">{currentAnimation.description}</p>
              </div>
            )}

            {/* Comments Section */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                评论 ({comments.length})
              </h3>

              {/* Comment Input */}
              <form onSubmit={handleSubmitComment} className="flex gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">我</span>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="添加评论..."
                    className="w-full px-4 py-2.5 bg-gray-100 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newComment.trim() || submittingComment}
                  className="px-5 py-2.5 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingComment ? '发送中...' : '发送'}
                </button>
              </form>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-medium">
                        {comment.user_name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm">
                          {comment.user_name || '未知用户'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatTime(comment.created_at)}
                        </span>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="ml-auto opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                          title="删除"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-gray-700 mt-1 text-sm leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}

                {comments.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p>暂无评论，来说点什么吧</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right - Playlist Sidebar */}
        <div className="w-[420px] flex-shrink-0">
          <div className="bg-gray-50 rounded-2xl overflow-hidden sticky top-24 border border-gray-200">
            {/* Playlist Header */}
            <div className="px-5 py-4 border-b bg-white">
              <h3 className="font-semibold text-gray-900 text-lg">{course.title}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {animationIndex + 1} / {allAnimations.length}
              </p>
            </div>

            {/* Playlist Items */}
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
              {allAnimations.map((anim, index) => {
                const isActive = index === animationIndex;
                return (
                  <button
                    key={anim.id}
                    onClick={() => selectAnimation(index)}
                    className={`w-full flex gap-2 p-2 text-left transition-colors ${
                      isActive ? 'bg-gray-200' : 'hover:bg-gray-100'
                    }`}
                  >
                    {/* Index */}
                    <div className="w-6 flex-shrink-0 text-center pt-1">
                      {isActive ? (
                        <svg className="w-4 h-4 mx-auto text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      ) : (
                        <span className="text-xs text-gray-500">{index + 1}</span>
                      )}
                    </div>

                    {/* Thumbnail */}
                    <div className="w-40 h-[90px] bg-gray-300 rounded-lg overflow-hidden flex-shrink-0 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                        <span className="text-white text-2xl">🎬</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 py-1">
                      <h4 className={`text-sm font-medium leading-tight line-clamp-2 ${
                        isActive ? 'text-gray-900' : 'text-gray-800'
                      }`}>
                        {anim.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {anim.sectionTitle}
                      </p>
                    </div>
                  </button>
                );
              })}

              {allAnimations.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-sm">
                  <p>暂无动画内容</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
