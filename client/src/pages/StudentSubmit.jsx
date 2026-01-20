import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { assignmentsApi } from '../services/api';

export const StudentSubmit = () => {
  const { code } = useParams();
  const fileInputRef = useRef(null);

  const [assignment, setAssignment] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAssignment();
  }, [code]);

  const loadAssignment = async () => {
    try {
      const data = await assignmentsApi.getByCode(code);
      setAssignment(data);
      setStudents(data.students || []);
    } catch (err) {
      setError(err.message || '作业不存在或已关闭');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages].slice(0, 9));
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedStudent) {
      alert('请选择你的姓名');
      return;
    }
    if (images.length === 0) {
      alert('请上传作业图片');
      return;
    }

    setSubmitting(true);
    try {
      // In a real app, you'd upload images to a server first
      // For now, simulate with placeholder URLs
      const imageUrls = images.map((_, i) => `/uploads/submission_${code}_${selectedStudent}_${i}.jpg`);

      await assignmentsApi.submitByCode(code, {
        student_id: selectedStudent,
        images: imageUrls
      });
      setSubmitted(true);
    } catch (err) {
      alert(err.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.includes(searchTerm) || (s.student_no && s.student_no.includes(searchTerm))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <svg className="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">无法提交作业</h2>
          <p className="mt-2 text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">提交成功</h2>
          <p className="mt-2 text-gray-500">你的作业已成功提交，请等待老师批改。</p>
          <button
            onClick={() => {
              setSubmitted(false);
              setImages([]);
            }}
            className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            重新提交
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold">{assignment.title}</h1>
          <p className="text-indigo-200 text-sm mt-1">{assignment.class_name}</p>
          {assignment.deadline && (
            <p className="text-indigo-200 text-sm mt-1">
              截止时间: {new Date(assignment.deadline).toLocaleString('zh-CN')}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto p-4 space-y-6">
        {assignment.description && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">作业要求</h3>
            <p className="text-gray-600 text-sm">{assignment.description}</p>
          </div>
        )}

        {/* Student Selection */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">选择你的姓名 *</h3>
          <input
            type="text"
            placeholder="搜索姓名或学号..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredStudents.map((student) => (
              <label
                key={student.id}
                className={`flex items-center p-3 rounded-lg cursor-pointer ${
                  selectedStudent === student.id
                    ? 'bg-indigo-50 border-2 border-indigo-500'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <input
                  type="radio"
                  name="student"
                  value={student.id}
                  checked={selectedStudent === student.id}
                  onChange={() => setSelectedStudent(student.id)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-3 text-gray-900">{student.name}</span>
                {student.student_no && (
                  <span className="ml-2 text-gray-500 text-sm">{student.student_no}</span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Image Upload */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">上传作业图片 *</h3>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500"
          >
            <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">点击拍照或选择图片</p>
            <p className="text-xs text-gray-500">最多可上传9张图片</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square bg-gray-100 rounded overflow-hidden">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !selectedStudent || images.length === 0}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {submitting ? '提交中...' : '提交作业'}
        </button>

        <p className="text-center text-xs text-gray-500">
          提交后可重新上传覆盖之前的作业
        </p>
      </div>
    </div>
  );
};
