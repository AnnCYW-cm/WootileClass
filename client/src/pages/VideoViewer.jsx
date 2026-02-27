import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { videosApi } from '../services/api';

export const VideoViewer = () => {
  const { code } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadVideo = async () => {
      try {
        const data = await videosApi.getByShareCode(code);
        setVideo(data);
      } catch (err) {
        setError(err.message || '视频不存在或未公开');
      } finally {
        setLoading(false);
      }
    };
    loadVideo();
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-400 mb-6">{error || '视频不存在或未公开'}</p>
        <Link
          to="/"
          className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
        >
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-sm">🎓</span>
            </div>
            <span className="text-lg font-bold text-white">木瓦课堂</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Video Player */}
        <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
          <video
            src={video.file_path}
            controls
            autoPlay
            className="w-full aspect-video"
          />
        </div>

        {/* Video Info */}
        <div className="mt-8">
          <h1 className="text-3xl font-bold text-white mb-4">{video.title}</h1>
          {video.description && (
            <p className="text-gray-400 mb-6 text-lg">{video.description}</p>
          )}
          <div className="flex items-center gap-4 flex-wrap">
            {video.grade && (
              <span className="px-4 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                {video.grade}
              </span>
            )}
            {video.subject && (
              <span className="px-4 py-1.5 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                {video.subject}
              </span>
            )}
            <span className="text-gray-500">
              {video.view_count || 0} 次播放
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-8 border border-purple-500/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">想要更多优质课程？</h3>
              <p className="text-gray-400">注册木瓦课堂，获取更多学习资源</p>
            </div>
            <Link
              to="/register"
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              免费注册
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-500 text-sm">
          © 2024 木瓦课堂 WootileClass. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
