import { useRef, useEffect, useState } from 'react';
import Lottie from 'lottie-react';

/**
 * LottiePlayer - Renders Lottie animations from JSON data or URL
 */
export default function LottiePlayer({
  animationData,
  animationUrl,
  loop = true,
  autoplay = true,
  speed = 1,
  direction = 1,
  onComplete,
  onLoopComplete,
  onEnterFrame,
  onSegmentStart,
  className = '',
  style = {},
  ...props
}) {
  const lottieRef = useRef(null);
  const [loadedData, setLoadedData] = useState(animationData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load animation from URL if provided
  useEffect(() => {
    if (animationUrl && !animationData) {
      setLoading(true);
      setError(null);

      fetch(animationUrl)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load animation');
          return res.json();
        })
        .then((data) => {
          setLoadedData(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    } else if (animationData) {
      setLoadedData(animationData);
    }
  }, [animationUrl, animationData]);

  // Update speed when prop changes
  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(speed);
    }
  }, [speed]);

  // Update direction when prop changes
  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setDirection(direction);
    }
  }, [direction]);

  // Expose control methods via ref
  const play = () => lottieRef.current?.play();
  const pause = () => lottieRef.current?.pause();
  const stop = () => lottieRef.current?.stop();
  const goToAndStop = (frame, isFrame = true) => lottieRef.current?.goToAndStop(frame, isFrame);
  const goToAndPlay = (frame, isFrame = true) => lottieRef.current?.goToAndPlay(frame, isFrame);
  const getDuration = (inFrames = false) => lottieRef.current?.getDuration(inFrames);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={style}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center text-red-500 ${className}`} style={style}>
        <span>加载动画失败</span>
      </div>
    );
  }

  if (!loadedData) {
    return (
      <div className={`flex items-center justify-center text-gray-400 ${className}`} style={style}>
        <span>无动画数据</span>
      </div>
    );
  }

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={loadedData}
      loop={loop}
      autoplay={autoplay}
      onComplete={onComplete}
      onLoopComplete={onLoopComplete}
      onEnterFrame={onEnterFrame}
      onSegmentStart={onSegmentStart}
      className={className}
      style={style}
      {...props}
    />
  );
}
