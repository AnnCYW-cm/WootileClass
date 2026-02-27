import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { videosApi } from '../services/api';

export const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [storageUsage, setStorageUsage] = useState(null);
  const [filter, setFilter] = useState({ grade: '', subject: '', status: '' });
  const [viewMode, setViewMode] = useState('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({ title: '', description: '', grade: '', subject: '' });
  const [uploadError, setUploadError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三', '高一', '高二', '高三'];
  const subjects = ['数学', '物理', '化学', '生物', '语文', '英语', '历史', '地理', '通用'];

  const loadVideos = async () => {
    setLoading(true);
    try {
      const data = await videosApi.getAll(filter);
      setVideos(data);
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStorageUsage = async () => {
    try {
      const data = await videosApi.getStorageUsage();
      setStorageUsage(data);
    } catch (error) {
      console.error('Failed to load storage usage:', error);
    }
  };

  useEffect(() => {
    loadVideos();
    loadStorageUsage();
  }, [filter.grade, filter.subject, filter.status]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadData({ ...uploadData, title: file.name.replace(/\.[^/.]+$/, '') });
      setShowUploadModal(true);
    }
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    setUploadProgress(0);

    try {
      await videosApi.upload(file, uploadData, (progress) => {
        setUploadProgress(progress);
      });
      setShowUploadModal(false);
      setUploadData({ title: '', description: '', grade: '', subject: '' });
      setSelectedFile(null);
      fileInputRef.current.value = '';
      loadVideos();
      loadStorageUsage();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个视频吗？删除后无法恢复。')) return;
    try {
      await videosApi.delete(id);
      loadVideos();
      loadStorageUsage();
    } catch (error) {
      alert(error.message);
    }
  };

  const handlePublish = async (video) => {
    try {
      if (video.status === 'public') {
        await videosApi.unpublish(video.id);
      } else {
        await videosApi.publish(video.id);
      }
      loadVideos();
    } catch (error) {
      alert(error.message);
    }
  };

  const copyShareLink = (shareCode) => {
    const link = `${window.location.origin}/video/${shareCode}`;
    navigator.clipboard.writeText(link);
    alert('分享链接已复制到剪贴板');
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-900">我的视频</h1>
        <div className="flex items-center flex-wrap gap-3">
          {/* Filters */}
          <select
            value={filter.grade}
            onChange={(e) => setFilter({ ...filter, grade: e.target.value })}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">全部年级</option>
            {grades.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>

          <select
            value={filter.subject}
            onChange={(e) => setFilter({ ...filter, subject: e.target.value })}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">全部科目</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25"
          >
            上传视频
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Storage Usage */}
      {storageUsage && (
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              存储空间：{storageUsage.totalSizeMB} MB
              {!storageUsage.limits.unlimited && ` / ${storageUsage.limits.maxVideoStorageMB} MB`}
            </span>
            <span className="text-sm text-gray-600">
              视频数量：{storageUsage.videoCount}
              {storageUsage.limits.maxVideoCount !== -1 && ` / ${storageUsage.limits.maxVideoCount}`}
            </span>
          </div>
          {!storageUsage.limits.unlimited && (
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                style={{ width: `${Math.min((storageUsage.totalSizeMB / storageUsage.limits.maxVideoStorageMB) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Video Grid/List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-xl p-4 animate-pulse border border-gray-100">
              <div className="aspect-video bg-gray-100 rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : videos.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div key={video.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                {/* Thumbnail */}
                <div
                  className="aspect-video bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 relative cursor-pointer group"
                  onClick={() => navigate(`/dashboard/videos/${video.id}/play`)}
                >
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  {/* Duration badge */}
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                    {formatDuration(video.duration_seconds)}
                  </div>
                  {/* Status badge */}
                  <div className="absolute top-2 right-2">
                    {video.status === 'public' ? (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">已分享</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full">私有</span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate mb-1">{video.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    {video.grade && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded">{video.grade}</span>}
                    {video.subject && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded">{video.subject}</span>}
                    <span>{formatFileSize(video.file_size)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/dashboard/videos/${video.id}/play`)}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                        title="播放"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handlePublish(video)}
                        className={`p-2 rounded-lg ${video.status === 'public' ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                        title={video.status === 'public' ? '取消分享' : '分享'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </button>
                      {video.status === 'public' && video.share_code && (
                        <button
                          onClick={() => copyShareLink(video.share_code)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="复制链接"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(video.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="删除"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <span className="text-xs text-gray-400">{video.view_count || 0} 次播放</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {videos.map((video) => (
              <div key={video.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div
                    className="w-40 h-24 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer relative bg-gradient-to-br from-violet-500 to-fuchsia-500"
                    onClick={() => navigate(`/dashboard/videos/${video.id}/play`)}
                  >
                    {video.thumbnail ? (
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded">
                      {formatDuration(video.duration_seconds)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{video.title}</h3>
                      {video.status === 'public' ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">已分享</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">私有</span>
                      )}
                    </div>
                    {video.description && (
                      <p className="text-sm text-gray-500 truncate mb-2">{video.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {video.grade && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded">{video.grade}</span>}
                      {video.subject && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded">{video.subject}</span>}
                      <span>{formatFileSize(video.file_size)}</span>
                      <span>{video.view_count || 0} 次播放</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/dashboard/videos/${video.id}/play`)}
                      className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-100"
                    >
                      播放
                    </button>
                    <button
                      onClick={() => handlePublish(video)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="mt-5 text-xl font-medium text-gray-900">还没有视频</h3>
          <p className="mt-3 text-gray-500">上传您的讲解视频，可以分享给学生观看</p>
          <div className="mt-8">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:opacity-90"
            >
              上传视频
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6">上传视频</h2>

            {/* File Info */}
            {selectedFile && !uploading && (
              <div className="bg-purple-50 rounded-xl p-4 mb-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {uploadError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{uploadError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">视频标题</label>
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年级</label>
                  <select
                    value={uploadData.grade}
                    onChange={(e) => setUploadData({ ...uploadData, grade: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="">请选择</option>
                    {grades.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">科目</label>
                  <select
                    value={uploadData.subject}
                    onChange={(e) => setUploadData({ ...uploadData, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="">请选择</option>
                    {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            {/* Upload Progress */}
            {uploading && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">上传进度</span>
                  <span className="text-sm font-medium text-purple-600">{uploadProgress}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  {uploadProgress < 100 ? '正在上传视频，请勿关闭页面...' : '上传完成，正在处理...'}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  fileInputRef.current.value = '';
                }}
                className="px-5 py-2 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
                disabled={uploading}
              >
                取消
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !uploadData.title}
                className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50"
              >
                {uploading ? `上传中 ${uploadProgress}%` : '上传'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
