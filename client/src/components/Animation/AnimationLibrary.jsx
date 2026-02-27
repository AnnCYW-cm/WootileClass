import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';

/**
 * AnimationLibrary - Built-in animation selector with preview
 */
export default function AnimationLibrary({
  onSelect,
  selectedId = null,
  category = null,
  className = '',
}) {
  const [animations, setAnimations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(category || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewAnimation, setPreviewAnimation] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Fetch categories
  useEffect(() => {
    fetch('/api/animations/builtin/categories')
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
      })
      .catch((err) => {
        console.error('Failed to load categories:', err);
      });
  }, []);

  // Fetch animations
  useEffect(() => {
    setLoading(true);
    setError(null);

    const url = activeCategory && activeCategory !== 'all'
      ? `/api/animations/builtin?category=${activeCategory}`
      : '/api/animations/builtin';

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('加载失败');
        return res.json();
      })
      .then((data) => {
        setAnimations(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [activeCategory]);

  // Load preview animation data
  const loadPreview = async (animation) => {
    setPreviewAnimation(animation);
    setLoadingPreview(true);
    setPreviewData(null);

    // HTML animations don't need to load JSON data
    const isHtml = animation.type === 'html' || animation.source_path?.endsWith('.html');
    if (isHtml) {
      setLoadingPreview(false);
      return;
    }

    try {
      const response = await fetch(animation.source_path);
      if (!response.ok) throw new Error('加载预览失败');
      const data = await response.json();
      setPreviewData(data);
    } catch (err) {
      console.error('Failed to load preview:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Filter animations by search
  const filteredAnimations = animations.filter((anim) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      anim.name.toLowerCase().includes(query) ||
      anim.description?.toLowerCase().includes(query) ||
      anim.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  // Category labels
  const categoryLabels = {
    math: '数学',
    physics: '物理',
    chemistry: '化学',
    general: '通用',
  };

  // Get category icon
  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'math':
        return '📐';
      case 'physics':
        return '⚛️';
      case 'chemistry':
        return '🧪';
      default:
        return '📚';
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Header with search */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="搜索动画..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
            activeCategory === 'all'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          全部
        </button>
        {categories.map((cat) => (
          <button
            key={cat.category}
            onClick={() => setActiveCategory(cat.category)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
              activeCategory === cat.category
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {getCategoryIcon(cat.category)} {categoryLabels[cat.category] || cat.category}
            <span className="ml-1 text-xs opacity-75">({cat.count})</span>
          </button>
        ))}
      </div>

      {/* Animation grid */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : filteredAnimations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? '没有找到匹配的动画' : '暂无动画'}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAnimations.map((animation) => (
              <div
                key={animation.id}
                onClick={() => loadPreview(animation)}
                className={`
                  relative p-3 bg-white rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg
                  ${selectedId === animation.id ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200 hover:border-purple-300'}
                `}
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                  {animation.thumbnail ? (
                    <img
                      src={animation.thumbnail}
                      alt={animation.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-4xl">
                      {getCategoryIcon(animation.category)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <h4 className="font-medium text-sm text-gray-800 truncate">{animation.name}</h4>
                <p className="text-xs text-gray-500 truncate">{animation.description}</p>

                {/* Tags */}
                {animation.tags && animation.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {animation.tags.slice(0, 2).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Interactive badge */}
                {animation.is_interactive && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    可交互
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
            {/* Preview Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{previewAnimation.name}</h3>
              <button
                onClick={() => {
                  setPreviewAnimation(null);
                  setPreviewData(null);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Preview Content */}
            <div className="p-4">
              <div className={`${previewAnimation?.type === 'html' || previewAnimation?.source_path?.endsWith('.html') ? 'h-[400px]' : 'aspect-square'} bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden`}>
                {loadingPreview ? (
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
                ) : (previewAnimation?.type === 'html' || previewAnimation?.source_path?.endsWith('.html')) ? (
                  <iframe
                    src={previewAnimation.source_path}
                    title={previewAnimation.name}
                    className="w-full h-full border-0"
                    style={{ background: '#667eea' }}
                  />
                ) : previewData ? (
                  <Lottie
                    animationData={previewData}
                    loop
                    autoplay
                    className="w-full h-full"
                  />
                ) : (
                  <div className="text-gray-400">无法加载预览</div>
                )}
              </div>

              <p className="text-gray-600 text-sm mb-4">{previewAnimation.description}</p>

              {previewAnimation.tags && previewAnimation.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {previewAnimation.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-50 text-purple-600 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  onSelect?.(previewAnimation);
                  setPreviewAnimation(null);
                  setPreviewData(null);
                }}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition"
              >
                添加到课程
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
