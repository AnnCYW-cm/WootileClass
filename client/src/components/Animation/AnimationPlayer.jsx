import { useState, useRef, useEffect, useCallback } from 'react';
import Lottie from 'lottie-react';

/**
 * AnimationPlayer - Full-featured animation player with controls
 */
export default function AnimationPlayer({
  animation,
  autoPlay = false,
  loop = true,
  initialSpeed = 1,
  showControls = true,
  allowFullscreen = true,
  onComplete,
  className = '',
}) {
  const lottieRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(initialSpeed);
  const [progress, setProgress] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [animationData, setAnimationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load animation data
  useEffect(() => {
    setLoading(true);
    setError(null);

    if (!animation) {
      setLoading(false);
      return;
    }

    // Check if it's an HTML animation
    const src = animation.source_url || animation.sourceUrl || '';
    const isHtml = animation.type === 'html' || src.endsWith('.html');

    // HTML and GIF animations don't need JSON loading
    if (isHtml || animation.type === 'gif') {
      setAnimationData(null);
      setLoading(false);
      return;
    }

    // Check if animation is JSON object or URL
    if (typeof animation === 'object' && animation.v) {
      // Direct Lottie JSON data
      setAnimationData(animation);
      setTotalFrames(animation.op - animation.ip);
      setLoading(false);
    } else if (animation.source_url || animation.sourceUrl) {
      // Load from URL (Lottie JSON)
      const url = animation.source_url || animation.sourceUrl;
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error('无法加载动画');
          return res.json();
        })
        .then((data) => {
          setAnimationData(data);
          setTotalFrames(data.op - data.ip);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [animation]);

  // Handle frame updates
  const handleEnterFrame = useCallback((e) => {
    if (totalFrames > 0) {
      setCurrentFrame(Math.floor(e.currentTime));
      setProgress((e.currentTime / totalFrames) * 100);
    }
  }, [totalFrames]);

  // Play/Pause toggle
  const togglePlay = () => {
    if (lottieRef.current) {
      if (isPlaying) {
        lottieRef.current.pause();
      } else {
        lottieRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Restart animation
  const restart = () => {
    if (lottieRef.current) {
      lottieRef.current.goToAndPlay(0, true);
      setIsPlaying(true);
    }
  };

  // Change speed
  const changeSpeed = (newSpeed) => {
    setSpeed(newSpeed);
    if (lottieRef.current) {
      lottieRef.current.setSpeed(newSpeed);
    }
  };

  // Seek to position
  const seekTo = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = (clickX / rect.width) * 100;
    const newFrame = Math.floor((newProgress / 100) * totalFrames);

    if (lottieRef.current) {
      lottieRef.current.goToAndStop(newFrame, true);
      setProgress(newProgress);
      setCurrentFrame(newFrame);
      setIsPlaying(false);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle completion
  const handleComplete = () => {
    if (!loop) {
      setIsPlaying(false);
    }
    onComplete?.();
  };

  const speedOptions = [0.5, 1, 1.5, 2];

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg min-h-[200px] ${className}`}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 rounded-lg min-h-[200px] ${className}`}>
        <span className="text-red-500 mb-2">加载失败</span>
        <span className="text-gray-500 text-sm">{error}</span>
      </div>
    );
  }

  // Check if it's an HTML animation (by type or file extension)
  const animationSrc = animation?.source_url || animation?.sourceUrl || '';
  const isHtmlAnimation = animation?.type === 'html' || animationSrc.endsWith('.html');

  // HTML animation (iframe)
  if (isHtmlAnimation) {
    const htmlSrc = animationSrc;
    return (
      <div
        ref={containerRef}
        className={`relative bg-gray-900 rounded-lg overflow-hidden ${isFullscreen ? 'w-full h-full' : ''} ${className}`}
      >
        <iframe
          src={htmlSrc}
          title={animation.title || '动画'}
          className={`w-full border-0 ${isFullscreen ? 'h-full' : 'h-[500px]'}`}
          allow="fullscreen"
          style={{ background: '#1a1a2e' }}
        />
        {/* Controls for HTML animation */}
        {showControls && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium">
                {animation.title || '动画演示'}
              </span>
              {allowFullscreen && (
                <button
                  onClick={toggleFullscreen}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition backdrop-blur-sm"
                  title={isFullscreen ? '退出全屏' : '全屏'}
                >
                  {isFullscreen ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // GIF animation
  if (animation?.type === 'gif') {
    return (
      <div
        ref={containerRef}
        className={`relative bg-white rounded-lg overflow-hidden ${className}`}
      >
        <img
          src={animation.source_url || animation.sourceUrl}
          alt={animation.title || '动画'}
          className="w-full h-auto"
        />
        {animation.title && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm">
            {animation.title}
          </div>
        )}
      </div>
    );
  }

  if (!animationData) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg min-h-[200px] ${className}`}>
        <span className="text-gray-400">无动画数据</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-white rounded-lg overflow-hidden ${isFullscreen ? 'flex flex-col' : ''} ${className}`}
    >
      {/* Animation Display */}
      <div className={`${isFullscreen ? 'flex-1 flex items-center justify-center bg-gray-900' : ''}`}>
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={loop}
          autoplay={autoPlay}
          onComplete={handleComplete}
          onEnterFrame={handleEnterFrame}
          className={isFullscreen ? 'max-h-full max-w-full' : 'w-full'}
        />
      </div>

      {/* Controls */}
      {showControls && (
        <div className={`${isFullscreen ? 'bg-gray-900 p-4' : 'bg-gray-50 p-3'}`}>
          {/* Progress Bar */}
          <div
            className="h-2 bg-gray-200 rounded-full cursor-pointer mb-3 relative"
            onClick={seekTo}
          >
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-purple-500 rounded-full shadow"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition"
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Restart */}
              <button
                onClick={restart}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition"
                title="重播"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Frame Info */}
              <span className={`text-xs ${isFullscreen ? 'text-gray-300' : 'text-gray-500'}`}>
                {currentFrame} / {totalFrames}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Speed Control */}
              <div className="flex items-center gap-1">
                <span className={`text-xs ${isFullscreen ? 'text-gray-300' : 'text-gray-500'}`}>速度:</span>
                <div className="flex gap-1">
                  {speedOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => changeSpeed(s)}
                      className={`px-2 py-1 text-xs rounded ${
                        speed === s
                          ? 'bg-purple-500 text-white'
                          : isFullscreen
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      } transition`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Fullscreen */}
              {allowFullscreen && (
                <button
                  onClick={toggleFullscreen}
                  className={`w-8 h-8 flex items-center justify-center rounded ${
                    isFullscreen ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-600'
                  } hover:opacity-80 transition`}
                  title={isFullscreen ? '退出全屏' : '全屏'}
                >
                  {isFullscreen ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
