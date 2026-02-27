import { useState, useRef, useCallback } from 'react';
import Lottie from 'lottie-react';

/**
 * AnimationUploader - Drag and drop animation file uploader
 */
export default function AnimationUploader({
  onUpload,
  onSelect,
  accept = '.json,.gif',
  maxSize = 10 * 1024 * 1024, // 10MB
  className = '',
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  // Handle file selection
  const handleFile = useCallback(async (file) => {
    setError(null);
    setPreview(null);

    // Validate file type
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['json', 'gif'].includes(ext)) {
      setError('只支持 JSON (Lottie) 和 GIF 格式');
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(`文件大小不能超过 ${maxSize / 1024 / 1024}MB`);
      return;
    }

    // Preview Lottie JSON
    if (ext === 'json') {
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Validate Lottie format
        if (!data.v || !data.layers) {
          setError('无效的 Lottie 动画文件');
          return;
        }

        setPreview({
          type: 'lottie',
          data,
          name: file.name,
        });
      } catch {
        setError('无法解析 JSON 文件');
        return;
      }
    } else if (ext === 'gif') {
      const url = URL.createObjectURL(file);
      setPreview({
        type: 'gif',
        url,
        name: file.name,
      });
    }

    // Upload file if onUpload provided
    if (onUpload) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('animation', file);

        const response = await fetch('/api/animations/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || '上传失败');
        }

        const result = await response.json();
        onUpload({
          ...result,
          type: ext === 'json' ? 'lottie' : 'gif',
          originalName: file.name,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setUploading(false);
      }
    }

    // Call onSelect if provided
    if (onSelect) {
      onSelect({
        file,
        type: ext === 'json' ? 'lottie' : 'gif',
        name: file.name,
      });
    }
  }, [maxSize, onUpload, onSelect]);

  // Handle drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Handle click to select file
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file input change
  const handleInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  // Clear preview
  const clearPreview = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragging
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
          }
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mb-3"></div>
            <span className="text-gray-500">上传中...</span>
          </div>
        ) : preview ? (
          <div className="flex flex-col items-center">
            {/* Preview */}
            <div className="w-32 h-32 mb-3 bg-gray-100 rounded-lg overflow-hidden">
              {preview.type === 'lottie' ? (
                <Lottie
                  animationData={preview.data}
                  loop
                  autoplay
                  className="w-full h-full"
                />
              ) : (
                <img
                  src={preview.url}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <p className="text-sm text-gray-600 mb-2">{preview.name}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearPreview();
              }}
              className="text-sm text-purple-500 hover:text-purple-600"
            >
              选择其他文件
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 mb-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-gray-600 mb-1">
              拖拽文件到这里，或
              <span className="text-purple-500">点击上传</span>
            </p>
            <p className="text-sm text-gray-400">
              支持 Lottie JSON、GIF 格式，最大 {maxSize / 1024 / 1024}MB
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
