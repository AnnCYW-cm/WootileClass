import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { videosApi } from '../services/api';

export const VideoPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [comments, setComments] = useState([]);
  const [danmakuList, setDanmakuList] = useState([]);
  const [activeDanmaku, setActiveDanmaku] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newDanmaku, setNewDanmaku] = useState('');
  const [danmakuColor, setDanmakuColor] = useState('#FFFFFF');
  const [showDanmaku, setShowDanmaku] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const videoRef = useRef(null);
  const danmakuContainerRef = useRef(null);
  const commentInputRef = useRef(null);
  const danmakuIdCounter = useRef(0);
  const shownDanmakuIds = useRef(new Set());

  const colors = ['#FFFFFF', '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setActiveDanmaku([]);
      shownDanmakuIds.current.clear();

      try {
        const [videoData, related, commentsData, danmaku] = await Promise.all([
          videosApi.get(id),
          videosApi.getRelated(id).catch(() => []),
          videosApi.getComments(id).catch(() => []),
          videosApi.getDanmaku(id).catch(() => [])
        ]);
        setVideo(videoData);
        setRelatedVideos(related);
        setComments(commentsData);
        setDanmakuList(danmaku);
      } catch (err) {
        setError(err.message || '视频不存在');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || !showDanmaku) return;
    const currentTime = videoRef.current.currentTime;
    const containerHeight = danmakuContainerRef.current?.offsetHeight || 300;

    const newDanmakuItems = danmakuList.filter(d => {
      const timeDiff = currentTime - d.time_seconds;
      return timeDiff >= 0 && timeDiff < 0.5 && !shownDanmakuIds.current.has(d.id);
    });

    if (newDanmakuItems.length > 0) {
      const toAdd = newDanmakuItems.map(d => {
        shownDanmakuIds.current.add(d.id);
        return {
          ...d,
          uniqueId: `${d.id}-${danmakuIdCounter.current++}`,
          top: Math.random() * (containerHeight - 24),
          startTime: Date.now()
        };
      });
      setActiveDanmaku(prev => [...prev, ...toAdd]);
    }
    setActiveDanmaku(prev => prev.filter(d => Date.now() - d.startTime < 8000));
  }, [danmakuList, showDanmaku]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const handleSeeked = () => {
      shownDanmakuIds.current.clear();
      setActiveDanmaku([]);
    };
    v.addEventListener('timeupdate', handleTimeUpdate);
    v.addEventListener('seeked', handleSeeked);
    return () => {
      v.removeEventListener('timeupdate', handleTimeUpdate);
      v.removeEventListener('seeked', handleSeeked);
    };
  }, [handleTimeUpdate]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      await videosApi.addComment(id, newComment, replyTo?.id);
      setNewComment('');
      setReplyTo(null);
      const data = await videosApi.getComments(id);
      setComments(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDanmaku = async (e) => {
    e.preventDefault();
    if (!newDanmaku.trim() || !videoRef.current) return;
    try {
      const danmaku = await videosApi.addDanmaku(id, newDanmaku, videoRef.current.currentTime, danmakuColor);
      setDanmakuList(prev => [...prev, danmaku]);
      shownDanmakuIds.current.add(danmaku.id);
      const containerHeight = danmakuContainerRef.current?.offsetHeight || 300;
      setActiveDanmaku(prev => [...prev, {
        ...danmaku,
        uniqueId: `${danmaku.id}-${danmakuIdCounter.current++}`,
        top: Math.random() * (containerHeight - 24),
        startTime: Date.now()
      }]);
      setNewDanmaku('');
    } catch (err) {
      alert(err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await videosApi.deleteComment(deleteConfirm);
      const data = await videosApi.getComments(id);
      setComments(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins}分钟前`;
    if (hrs < 24) return `${hrs}小时前`;
    if (days < 7) return `${days}天前`;
    return d.toLocaleDateString();
  };

  const formatDuration = (s) => {
    if (!s) return '0:00';
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500">
        <p className="mb-4">{error || '视频不存在'}</p>
        <button onClick={() => navigate('/dashboard/videos')} className="text-blue-600 hover:underline">
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-20 bg-gray-50 z-40 overflow-auto">
      <div className="flex px-8 py-5 gap-6">
        {/* 左侧主内容 */}
        <div className="flex-1 min-w-0">
          {/* 视频播放器 */}
          <div className="bg-black rounded-xl overflow-hidden relative shadow-lg">
            <video
              ref={videoRef}
              src={video.file_path}
              controls
              className="w-full aspect-video"
            />
            {showDanmaku && (
              <div
                ref={danmakuContainerRef}
                className="absolute inset-0 pointer-events-none overflow-hidden"
                style={{ bottom: 40 }}
              >
                {activeDanmaku.map(d => (
                  <span
                    key={d.uniqueId}
                    className="absolute whitespace-nowrap text-sm font-medium"
                    style={{
                      color: d.color,
                      top: d.top,
                      right: '-100%',
                      textShadow: '1px 1px 2px #000',
                      animation: 'danmaku 8s linear forwards'
                    }}
                  >
                    {d.content}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 弹幕栏 */}
          <div className="flex items-center gap-5 mt-4 bg-white rounded-xl px-5 py-4 shadow-sm">
            <button
              onClick={() => setShowDanmaku(!showDanmaku)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                showDanmaku
                  ? 'bg-purple-100 text-purple-600'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
              弹幕 {showDanmaku ? '开' : '关'}
            </button>
            <div className="h-6 w-px bg-gray-200"></div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">颜色</span>
              <div className="flex gap-2">
                {colors.map(c => (
                  <button
                    key={c}
                    onClick={() => setDanmakuColor(c)}
                    className={`w-7 h-7 rounded-full transition-all hover:scale-105 ${danmakuColor === c ? 'ring-2 ring-offset-2 ring-purple-400' : ''}`}
                    style={{ background: c, border: c === '#FFFFFF' ? '1px solid #e5e7eb' : 'none' }}
                  />
                ))}
              </div>
            </div>
            <div className="h-6 w-px bg-gray-200"></div>
            <form onSubmit={handleSubmitDanmaku} className="flex-1 flex gap-3">
              <input
                value={newDanmaku}
                onChange={e => setNewDanmaku(e.target.value)}
                placeholder="发个弹幕..."
                maxLength={30}
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!newDanmaku.trim()}
                className="px-5 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 disabled:bg-gray-200 disabled:text-gray-400"
              >
                发送
              </button>
            </form>
          </div>

          {/* 标题和信息 */}
          <div className="bg-white rounded-xl p-4 mt-4 shadow-sm">
            <h1 className="text-lg font-medium text-gray-900">{video.title}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
              <span>{video.view_count || 0}次观看</span>
              <span>·</span>
              <span>{danmakuList.length}条弹幕</span>
              {video.grade && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">{video.grade}</span>}
              {video.subject && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs">{video.subject}</span>}
            </div>
            {video.description && <p className="mt-3 text-sm text-gray-600">{video.description}</p>}
            <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => navigate('/dashboard/videos')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← 返回列表
              </button>
              {video.status === 'public' && video.share_code && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/video/${video.share_code}`);
                    alert('链接已复制');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  分享视频
                </button>
              )}
            </div>
          </div>

          {/* 评论 */}
          <div className="bg-white rounded-xl p-6 mt-4 shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-6">{comments.length} 条评论</h2>

            <form onSubmit={handleSubmitComment} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center font-medium flex-shrink-0">我</div>
              <div className="flex-1 relative">
                {replyTo && (
                  <div className="text-sm text-gray-500 mb-2">
                    回复 @{replyTo.user_name || replyTo.author_name}
                    <button type="button" onClick={() => setReplyTo(null)} className="ml-2 text-purple-500 hover:text-purple-600">取消</button>
                  </div>
                )}
                <div className="relative">
                  <textarea
                    ref={commentInputRef}
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="添加评论..."
                    rows={3}
                    className="w-full px-4 py-3 pr-24 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-purple-500 focus:bg-white transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submitting}
                    className="absolute right-3 bottom-3 px-6 py-2.5 text-sm font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    发布评论
                  </button>
                </div>
              </div>
            </form>

          <div className="mt-6 space-y-5">
            {comments.map(c => (
              <div key={c.id} className="flex gap-4 group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-white flex items-center justify-center font-medium flex-shrink-0">
                  {(c.user_name || c.author_name || '?')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{c.user_name || c.author_name || '匿名'}</span>
                    <span className="text-gray-400 text-xs">{formatDate(c.created_at)}</span>
                  </div>
                  <p className="text-gray-800 mt-1">{c.content}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-400">
                    <button onClick={() => { setReplyTo(c); commentInputRef.current?.focus(); }} className="hover:text-purple-500">回复</button>
                    <button onClick={() => setDeleteConfirm(c.id)} className="hover:text-red-500 opacity-0 group-hover:opacity-100">删除</button>
                  </div>
                  {c.replies?.map(r => (
                    <div key={r.id} className="flex gap-3 mt-4 group/r">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {(r.user_name || r.author_name || '?')[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{r.user_name || r.author_name || '匿名'}</span>
                          <span className="text-gray-400 text-xs">{formatDate(r.created_at)}</span>
                        </div>
                        <p className="text-gray-800 mt-1">{r.content}</p>
                        <button onClick={() => setDeleteConfirm(r.id)} className="mt-1 text-sm text-gray-400 hover:text-red-500 opacity-0 group-hover/r:opacity-100">删除</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>

        {/* 右侧推荐 */}
        <div className="w-96 flex-shrink-0 hidden xl:block">
          <h3 className="text-base font-medium text-gray-900 mb-4">相关视频</h3>
          {relatedVideos.length === 0 ? (
            <div className="text-sm text-gray-400 bg-white rounded-lg p-4">暂无相关视频</div>
          ) : (
            <div className="space-y-3">
              {relatedVideos.map(v => (
                <div
                  key={v.id}
                  onClick={() => navigate(`/dashboard/videos/${v.id}/play`)}
                  className="bg-white rounded-lg p-2 cursor-pointer hover:shadow-md transition-shadow group"
                >
                  <div className="aspect-video rounded overflow-hidden bg-gray-100 relative">
                    {v.thumbnail ? (
                      <img src={v.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-purple-300" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/75 text-white text-xs rounded">{formatDuration(v.duration_seconds)}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-2 line-clamp-2 group-hover:text-purple-600">{v.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{v.view_count || 0}次观看</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 删除弹窗 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-lg p-5 w-72" onClick={e => e.stopPropagation()}>
            <p className="text-gray-900 font-medium">删除评论？</p>
            <p className="text-sm text-gray-500 mt-1">此操作无法撤销</p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded">取消</button>
              <button onClick={confirmDelete} className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">删除</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes danmaku {
          from { transform: translateX(0); }
          to { transform: translateX(calc(-100vw - 100%)); }
        }
      `}</style>
    </div>
  );
};
