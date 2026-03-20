import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AnimationPlayer } from '../components/Animation';

/**
 * CourseViewer - Public course viewer for students
 * Accessible via share code without authentication
 */
export const CourseViewer = () => {
  const { code } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);

  // Load course by share code
  useEffect(() => {
    const loadCourse = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/courses/share/${code}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('课程不存在或未发布');
          }
          throw new Error('加载课程失败');
        }
        const data = await response.json();
        setCourse(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [code]);

  // Get current animation
  const currentSection = course?.sections?.[currentSectionIndex];
  const currentAnimation = currentSection?.animations?.[currentAnimationIndex];

  // Navigation
  const goToAnimation = (sectionIndex, animationIndex) => {
    setCurrentSectionIndex(sectionIndex);
    setCurrentAnimationIndex(animationIndex);
  };

  const goToPrevious = () => {
    if (currentAnimationIndex > 0) {
      setCurrentAnimationIndex(currentAnimationIndex - 1);
    } else if (currentSectionIndex > 0) {
      const prevSection = course.sections[currentSectionIndex - 1];
      setCurrentSectionIndex(currentSectionIndex - 1);
      setCurrentAnimationIndex((prevSection.animations?.length || 1) - 1);
    }
  };

  const goToNext = () => {
    const currentSectionAnimations = currentSection?.animations?.length || 0;
    if (currentAnimationIndex < currentSectionAnimations - 1) {
      setCurrentAnimationIndex(currentAnimationIndex + 1);
    } else if (currentSectionIndex < (course?.sections?.length || 0) - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentAnimationIndex(0);
    }
  };

  const hasPrevious = currentSectionIndex > 0 || currentAnimationIndex > 0;
  const hasNext =
    currentSectionIndex < (course?.sections?.length || 0) - 1 ||
    currentAnimationIndex < (currentSection?.animations?.length || 0) - 1;

  // Calculate total animations and current position
  const getTotalAnimations = () => {
    return course?.sections?.reduce((sum, s) => sum + (s.animations?.length || 0), 0) || 0;
  };

  const getCurrentPosition = () => {
    let position = 0;
    for (let i = 0; i < currentSectionIndex; i++) {
      position += course?.sections?.[i]?.animations?.length || 0;
    }
    return position + currentAnimationIndex + 1;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">加载课程中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">无法加载课程</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            to="/"
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition inline-block"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  if (!course?.sections?.length || !getTotalAnimations()) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{course?.title || '课程'}</h1>
          <p className="text-gray-400">这个课程还没有动画内容</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? 'w-80' : 'w-0'
        } bg-gray-800 border-r border-gray-700 flex-shrink-0 overflow-hidden transition-all duration-300`}
      >
        <div className="h-full flex flex-col w-80">
          {/* Course Header */}
          <div className="p-5 border-b border-gray-700">
            <h1 className="text-lg font-bold text-white mb-1 truncate">{course.title}</h1>
            {course.subject && (
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-xl">
                {course.subject}
              </span>
            )}
            {course.description && (
              <p className="text-sm text-gray-400 mt-3 line-clamp-2">{course.description}</p>
            )}
          </div>

          {/* Section List */}
          <div className="flex-1 overflow-y-auto">
            {course.sections.map((section, sectionIndex) => (
              <div key={section.id} className="border-b border-gray-700/50">
                <div className="px-5 py-3 bg-gray-700/30">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-purple-500/20 text-purple-400 rounded flex items-center justify-center text-xs font-medium">
                      {sectionIndex + 1}
                    </span>
                    <h3 className="font-medium text-gray-300 text-sm truncate">{section.title}</h3>
                  </div>
                </div>
                <div className="py-1">
                  {section.animations?.map((animation, animIndex) => {
                    const isActive = sectionIndex === currentSectionIndex && animIndex === currentAnimationIndex;
                    return (
                      <button
                        key={animation.id}
                        onClick={() => goToAnimation(sectionIndex, animIndex)}
                        className={`w-full px-5 py-3 text-left flex items-center gap-3 transition ${
                          isActive
                            ? 'bg-purple-500/20 text-white'
                            : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isActive ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {isActive ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span className="text-xs">{animIndex + 1}</span>
                          )}
                        </div>
                        <span className="truncate text-sm">{animation.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 text-center">
            <span className="text-xs text-gray-500">
              {getCurrentPosition()} / {getTotalAnimations()} 个动画
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="text-white font-medium truncate">
              {currentAnimation?.title || '选择动画'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevious}
              disabled={!hasPrevious}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm text-gray-400 min-w-[80px] text-center">
              {getCurrentPosition()} / {getTotalAnimations()}
            </span>
            <button
              onClick={goToNext}
              disabled={!hasNext}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Animation Display */}
        <div className="flex-1 flex items-center justify-center p-4 bg-gray-900">
          {currentAnimation ? (
            <div className="w-full max-w-4xl">
              <AnimationPlayer
                animation={{
                  ...currentAnimation,
                  sourceUrl: currentAnimation.source_url,
                }}
                autoPlay={true}
                loop={true}
                showControls={true}
                allowFullscreen={true}
                className="rounded-2xl overflow-hidden shadow-2xl"
              />

              {currentAnimation.description && (
                <p className="mt-4 text-center text-gray-400">
                  {currentAnimation.description}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>从左侧选择一个动画开始学习</p>
            </div>
          )}
        </div>

        {/* Bottom Navigation (Mobile) */}
        <div className="h-16 bg-gray-800 border-t border-gray-700 flex items-center justify-between px-4 md:hidden">
          <button
            onClick={goToPrevious}
            disabled={!hasPrevious}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-30"
          >
            上一个
          </button>
          <button
            onClick={goToNext}
            disabled={!hasNext}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg disabled:opacity-30"
          >
            下一个
          </button>
        </div>
      </div>
    </div>
  );
};
