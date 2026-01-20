import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const ClassroomTools = () => {
  const [activeTool, setActiveTool] = useState('timer');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">课堂工具</h1>
      </div>

      {/* Tool Tabs */}
      <div className="flex space-x-2">
        {[
          { key: 'timer', label: '计时器', icon: '⏱️' },
          { key: 'noise', label: '噪音监测', icon: '🔊' },
        ].map((tool) => (
          <button
            key={tool.key}
            onClick={() => setActiveTool(tool.key)}
            className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
              activeTool === tool.key
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>{tool.icon}</span>
            <span>{tool.label}</span>
          </button>
        ))}
      </div>

      {/* Timer Tool */}
      {activeTool === 'timer' && <TimerTool />}

      {/* Noise Monitor Tool */}
      {activeTool === 'noise' && <NoiseMonitor />}
    </div>
  );
};

// Timer Tool Component
const TimerTool = () => {
  const [mode, setMode] = useState('countdown'); // countdown or stopwatch
  const [time, setTime] = useState(300); // 5 minutes default
  const [inputTime, setInputTime] = useState({ minutes: 5, seconds: 0 });
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  const presets = [
    { label: '1分钟', seconds: 60 },
    { label: '3分钟', seconds: 180 },
    { label: '5分钟', seconds: 300 },
    { label: '10分钟', seconds: 600 },
    { label: '15分钟', seconds: 900 },
    { label: '20分钟', seconds: 1200 },
  ];

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => {
          if (mode === 'countdown') {
            if (prev <= 1) {
              setIsRunning(false);
              playAlarm();
              return 0;
            }
            return prev - 1;
          } else {
            return prev + 1;
          }
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

  const playAlarm = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.5;

    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (mode === 'countdown' && time === 0) {
      setTime(inputTime.minutes * 60 + inputTime.seconds);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (mode === 'countdown') {
      setTime(inputTime.minutes * 60 + inputTime.seconds);
    } else {
      setTime(0);
    }
  };

  const handlePreset = (seconds) => {
    setIsRunning(false);
    setTime(seconds);
    setInputTime({ minutes: Math.floor(seconds / 60), seconds: seconds % 60 });
  };

  const handleModeChange = (newMode) => {
    setIsRunning(false);
    setMode(newMode);
    if (newMode === 'stopwatch') {
      setTime(0);
    } else {
      setTime(inputTime.minutes * 60 + inputTime.seconds);
    }
  };

  const getProgressPercent = () => {
    if (mode === 'stopwatch') return 0;
    const total = inputTime.minutes * 60 + inputTime.seconds;
    if (total === 0) return 0;
    return ((total - time) / total) * 100;
  };

  // Fullscreen timer view
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 to-purple-900 z-50 flex flex-col items-center justify-center">
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 text-white hover:text-gray-300"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <motion.div
          key={time}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className={`text-[12rem] font-mono font-bold ${
            time <= 10 && mode === 'countdown' ? 'text-red-400' : 'text-white'
          }`}
        >
          {formatTime(time)}
        </motion.div>

        {mode === 'countdown' && (
          <div className="w-96 h-2 bg-white/20 rounded-full mt-8 overflow-hidden">
            <motion.div
              className="h-full bg-white"
              initial={{ width: '0%' }}
              animate={{ width: `${getProgressPercent()}%` }}
            />
          </div>
        )}

        <div className="flex space-x-4 mt-12">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="px-8 py-4 bg-green-500 text-white rounded-full text-xl font-medium hover:bg-green-600"
            >
              开始
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="px-8 py-4 bg-yellow-500 text-white rounded-full text-xl font-medium hover:bg-yellow-600"
            >
              暂停
            </button>
          )}
          <button
            onClick={handleReset}
            className="px-8 py-4 bg-gray-500 text-white rounded-full text-xl font-medium hover:bg-gray-600"
          >
            重置
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => handleModeChange('countdown')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              mode === 'countdown' ? 'bg-white shadow text-indigo-600' : 'text-gray-600'
            }`}
          >
            倒计时
          </button>
          <button
            onClick={() => handleModeChange('stopwatch')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              mode === 'stopwatch' ? 'bg-white shadow text-indigo-600' : 'text-gray-600'
            }`}
          >
            正计时
          </button>
        </div>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-6">
        <motion.div
          key={time}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          className={`text-7xl font-mono font-bold ${
            time <= 10 && mode === 'countdown' && isRunning ? 'text-red-500' : 'text-gray-900'
          }`}
        >
          {formatTime(time)}
        </motion.div>

        {mode === 'countdown' && (
          <div className="w-full h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500"
              animate={{ width: `${getProgressPercent()}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
      </div>

      {/* Time Input (for countdown mode) */}
      {mode === 'countdown' && !isRunning && (
        <div className="flex justify-center items-center space-x-2 mb-6">
          <input
            type="number"
            min="0"
            max="99"
            value={inputTime.minutes}
            onChange={(e) => {
              const mins = parseInt(e.target.value) || 0;
              setInputTime({ ...inputTime, minutes: mins });
              setTime(mins * 60 + inputTime.seconds);
            }}
            className="w-16 text-center text-2xl font-mono border border-gray-300 rounded-md py-2"
          />
          <span className="text-2xl">:</span>
          <input
            type="number"
            min="0"
            max="59"
            value={inputTime.seconds}
            onChange={(e) => {
              const secs = Math.min(59, parseInt(e.target.value) || 0);
              setInputTime({ ...inputTime, seconds: secs });
              setTime(inputTime.minutes * 60 + secs);
            }}
            className="w-16 text-center text-2xl font-mono border border-gray-300 rounded-md py-2"
          />
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex justify-center space-x-4 mb-6">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            开始
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="px-6 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
            暂停
          </button>
        )}
        <button
          onClick={handleReset}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600"
        >
          重置
        </button>
        <button
          onClick={() => setIsFullscreen(true)}
          className="px-6 py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          全屏
        </button>
      </div>

      {/* Presets (for countdown mode) */}
      {mode === 'countdown' && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">快速设置</h4>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.seconds}
                onClick={() => handlePreset(preset.seconds)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Noise Monitor Component
const NoiseMonitor = () => {
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const [threshold, setThreshold] = useState(70);
  const [isOverThreshold, setIsOverThreshold] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const animationRef = useRef(null);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);

      analyserRef.current.fftSize = 256;
      microphoneRef.current.connect(analyserRef.current);

      setIsListening(true);
      checkVolume();
    } catch (error) {
      alert('无法访问麦克风，请检查浏览器权限设置');
      console.error('Microphone error:', error);
    }
  };

  const stopListening = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsListening(false);
    setVolume(0);
    setIsOverThreshold(false);
  };

  const checkVolume = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const normalizedVolume = Math.min(100, Math.round((average / 128) * 100));

    setVolume(normalizedVolume);

    if (normalizedVolume > threshold) {
      setIsOverThreshold(true);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 500);
    } else {
      setIsOverThreshold(false);
    }

    animationRef.current = requestAnimationFrame(checkVolume);
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const getVolumeColor = () => {
    if (volume > threshold) return 'bg-red-500';
    if (volume > threshold * 0.7) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getVolumeEmoji = () => {
    if (volume > threshold) return '🔴';
    if (volume > threshold * 0.7) return '🟡';
    if (volume > threshold * 0.3) return '🟢';
    return '😴';
  };

  // Fullscreen view
  if (isFullscreen) {
    return (
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-colors duration-300 ${
        isOverThreshold ? 'bg-red-600' : 'bg-gradient-to-br from-green-800 to-teal-900'
      }`}>
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 text-white hover:text-gray-300"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <AnimatePresence>
          {showAlert && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="absolute text-9xl"
            >
              🤫
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-9xl mb-8">{getVolumeEmoji()}</div>

        <div className="text-white text-6xl font-bold mb-8">
          {volume}%
        </div>

        <div className="w-96 h-8 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${getVolumeColor()}`}
            animate={{ width: `${volume}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        <div className="text-white/60 mt-4">
          阈值: {threshold}%
        </div>

        <div className="mt-8">
          {!isListening ? (
            <button
              onClick={startListening}
              className="px-8 py-4 bg-white text-gray-900 rounded-full text-xl font-medium hover:bg-gray-100"
            >
              开始监测
            </button>
          ) : (
            <button
              onClick={stopListening}
              className="px-8 py-4 bg-red-500 text-white rounded-full text-xl font-medium hover:bg-red-600"
            >
              停止监测
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">{getVolumeEmoji()}</div>
        <div className={`text-5xl font-bold ${isOverThreshold ? 'text-red-500' : 'text-gray-900'}`}>
          {volume}%
        </div>
        <p className="text-gray-500 mt-2">当前音量</p>
      </div>

      {/* Volume Bar */}
      <div className="mb-6">
        <div className="h-8 bg-gray-200 rounded-full overflow-hidden relative">
          <motion.div
            className={`h-full ${getVolumeColor()}`}
            animate={{ width: `${volume}%` }}
            transition={{ duration: 0.1 }}
          />
          {/* Threshold marker */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-red-600"
            style={{ left: `${threshold}%` }}
          />
        </div>
      </div>

      {/* Threshold Setting */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          噪音阈值: {threshold}%
        </label>
        <input
          type="range"
          min="20"
          max="100"
          value={threshold}
          onChange={(e) => setThreshold(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <p className="text-xs text-gray-500 mt-1">超过阈值时会显示提醒</p>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center space-x-4">
        {!isListening ? (
          <button
            onClick={startListening}
            className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            开始监测
          </button>
        ) : (
          <button
            onClick={stopListening}
            className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            停止监测
          </button>
        )}
        <button
          onClick={() => setIsFullscreen(true)}
          className="px-6 py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          全屏
        </button>
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">使用提示</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 首次使用需要允许浏览器访问麦克风</li>
          <li>• 全屏模式适合投影展示给学生</li>
          <li>• 音量超过阈值时会显示"嘘"的提醒</li>
        </ul>
      </div>
    </div>
  );
};
