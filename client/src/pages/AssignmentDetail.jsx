import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assignmentsApi } from '../services/api';
import { useToastContext } from '../store/ToastContext';

export const AssignmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const toast = useToastContext();

  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [quickComments, setQuickComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('submissions');

  // Grading modal state
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeForm, setGradeForm] = useState({ score: '', grade: '', comment: '' });

  // Upload modal state (for classroom assignments)
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingStudent, setUploadingStudent] = useState(null);
  const [uploadImages, setUploadImages] = useState([]);

  // QR Code modal state
  const [showQRModal, setShowQRModal] = useState(false);

  // New comment state
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assignmentData, submissionsData, statsData, commentsData] = await Promise.all([
        assignmentsApi.get(id),
        assignmentsApi.getSubmissions(id),
        assignmentsApi.getStatistics(id),
        assignmentsApi.getQuickComments()
      ]);
      setAssignment(assignmentData);
      setSubmissions(submissionsData);
      setStatistics(statsData);
      setQuickComments(commentsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('加载失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openGradeModal = (submission) => {
    setGradingSubmission(submission);
    setGradeForm({
      score: submission.score || '',
      grade: submission.grade || '',
      comment: submission.comment || ''
    });
    setShowGradeModal(true);
  };

  const handleGrade = async () => {
    if (!gradingSubmission?.submission_id) return;

    try {
      await assignmentsApi.gradeSubmission(gradingSubmission.submission_id, gradeForm);
      setShowGradeModal(false);
      loadData();
    } catch (error) {
      toast.error('批改失败: ' + error.message);
    }
  };

  const openUploadModal = (student) => {
    setUploadingStudent(student);
    setUploadImages([]);
    setShowUploadModal(true);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => URL.createObjectURL(file));
    setUploadImages(prev => [...prev, ...newImages].slice(0, 9));
  };

  const handleUpload = async () => {
    if (!uploadingStudent || uploadImages.length === 0) return;

    try {
      // In a real app, you'd upload images to a server and get URLs back
      // For now, we'll simulate with placeholder URLs
      const imageUrls = uploadImages.map((_, i) => `/uploads/assignment_${id}_student_${uploadingStudent.student_id}_${i}.jpg`);

      await assignmentsApi.teacherSubmit(id, {
        student_id: uploadingStudent.student_id,
        images: imageUrls
      });
      setShowUploadModal(false);
      loadData();
    } catch (error) {
      toast.error('上传失败: ' + error.message);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await assignmentsApi.createQuickComment({ content: newComment });
      setNewComment('');
      const comments = await assignmentsApi.getQuickComments();
      setQuickComments(comments);
    } catch (error) {
      toast.error('添加失败: ' + error.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await assignmentsApi.deleteQuickComment(commentId);
      const comments = await assignmentsApi.getQuickComments();
      setQuickComments(comments);
    } catch (error) {
      toast.error('删除失败: ' + error.message);
    }
  };

  const getGradeColor = (grade) => {
    const colors = {
      'A': 'bg-green-100 text-green-700',
      'B': 'bg-blue-100 text-blue-700',
      'C': 'bg-yellow-100 text-yellow-700',
      'D': 'bg-orange-100 text-orange-700',
      'F': 'bg-red-100 text-red-700'
    };
    return colors[grade] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">作业不存在</p>
        <Link to="/dashboard/assignments" className="text-indigo-600 hover:text-indigo-500 mt-2 inline-block">
          返回作业列表
        </Link>
      </div>
    );
  }

  const submittedStudents = submissions.filter(s => s.submission_id);
  const unsubmittedStudents = submissions.filter(s => !s.submission_id);
  const gradedCount = submissions.filter(s => s.graded_at).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/dashboard/assignments')}
            className="text-gray-500 hover:text-gray-700 mb-2 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回列表
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
          <p className="text-gray-500 mt-1">
            {assignment.class_name} ·
            {assignment.type === 'homework' ? ' 家庭作业' : ' 课堂作业'}
          </p>
        </div>
        {assignment.type === 'homework' && assignment.submit_code && (
          <button
            onClick={() => setShowQRModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            查看提交码
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">总人数</div>
          <div className="text-2xl font-bold text-gray-900">{statistics?.studentCount || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">已提交</div>
          <div className="text-2xl font-bold text-green-600">{statistics?.submissionCount || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">提交率</div>
          <div className="text-2xl font-bold text-indigo-600">{statistics?.submissionRate || 0}%</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">已批改</div>
          <div className="text-2xl font-bold text-orange-600">{gradedCount}/{statistics?.submissionCount || 0}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'submissions', label: `已提交 (${submittedStudents.length})` },
            { key: 'unsubmitted', label: `未提交 (${unsubmittedStudents.length})` },
            { key: 'statistics', label: '统计分析' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <div className="bg-white rounded-lg shadow">
          {submittedStudents.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {submittedStudents.map((sub) => (
                <div key={sub.student_id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="font-medium text-gray-900">{sub.name}</div>
                        <div className="text-sm text-gray-500">{sub.student_no}</div>
                      </div>
                      <div className="text-sm text-gray-500">
                        提交于 {new Date(sub.submitted_at).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {sub.graded_at ? (
                        <div className="flex items-center space-x-2">
                          {sub.score !== null && (
                            <span className="text-lg font-bold text-indigo-600">{sub.score}分</span>
                          )}
                          {sub.grade && (
                            <span className={`px-2 py-0.5 rounded text-sm font-medium ${getGradeColor(sub.grade)}`}>
                              {sub.grade}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-yellow-600">待批改</span>
                      )}
                      <button
                        onClick={() => openGradeModal(sub)}
                        className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      >
                        {sub.graded_at ? '重新批改' : '批改'}
                      </button>
                    </div>
                  </div>
                  {sub.images && sub.images.length > 0 && (
                    <div className="mt-3 flex space-x-2">
                      {sub.images.slice(0, 4).map((img, idx) => (
                        <div key={idx} className="w-20 h-20 bg-gray-100 rounded overflow-hidden">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {sub.images.length > 4 && (
                        <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                          +{sub.images.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                  {sub.comment && (
                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      评语: {sub.comment}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              暂无提交记录
            </div>
          )}
        </div>
      )}

      {/* Unsubmitted Tab */}
      {activeTab === 'unsubmitted' && (
        <div className="bg-white rounded-lg shadow">
          {unsubmittedStudents.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {unsubmittedStudents.map((student) => (
                <div key={student.student_id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-500">{student.student_no}</div>
                  </div>
                  {assignment.type === 'classroom' && (
                    <button
                      onClick={() => openUploadModal(student)}
                      className="px-3 py-1 text-sm border border-indigo-600 text-indigo-600 rounded hover:bg-indigo-50"
                    >
                      上传作业
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              所有学生已提交
            </div>
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'statistics' && statistics && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">分数统计</h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-500">平均分</div>
                <div className="text-3xl font-bold text-indigo-600">
                  {statistics.avgScore || '-'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">最高分</div>
                <div className="text-3xl font-bold text-green-600">
                  {statistics.maxScore || '-'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">最低分</div>
                <div className="text-3xl font-bold text-red-600">
                  {statistics.minScore || '-'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">分数分布</h3>
            {statistics.scoreDistribution && statistics.scoreDistribution.length > 0 ? (
              <div className="space-y-3">
                {['A', 'B', 'C', 'D', 'F'].map((grade) => {
                  const item = statistics.scoreDistribution.find(d => d.grade_level === grade);
                  const count = item ? parseInt(item.count) : 0;
                  const total = statistics.submissionCount || 1;
                  const percentage = (count / total * 100).toFixed(0);
                  return (
                    <div key={grade} className="flex items-center">
                      <span className={`w-8 text-center font-medium ${getGradeColor(grade)} rounded px-2 py-0.5`}>
                        {grade}
                      </span>
                      <div className="flex-1 mx-4 h-6 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-indigo-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-20 text-right text-sm text-gray-600">
                        {count}人 ({percentage}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">暂无批改数据</p>
            )}
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {showGradeModal && gradingSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <h2 className="text-xl font-semibold mb-4">
              批改作业 - {gradingSubmission.name}
            </h2>

            {/* Images */}
            {gradingSubmission.images && gradingSubmission.images.length > 0 && (
              <div className="mb-4 grid grid-cols-3 gap-2">
                {gradingSubmission.images.map((img, idx) => (
                  <div key={idx} className="aspect-square bg-gray-100 rounded overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">分数</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={gradeForm.score}
                    onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                    placeholder="0-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">等级</label>
                  <div className="flex space-x-2">
                    {['A', 'B', 'C', 'D', 'F'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGradeForm({ ...gradeForm, grade: g })}
                        className={`w-10 h-10 rounded font-medium ${
                          gradeForm.grade === g
                            ? getGradeColor(g)
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">评语</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={gradeForm.comment}
                  onChange={(e) => setGradeForm({ ...gradeForm, comment: e.target.value })}
                  placeholder="填写评语（选填）"
                />
              </div>

              {/* Quick Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">快捷评语</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {quickComments.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setGradeForm({ ...gradeForm, comment: c.content })}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full"
                    >
                      {c.content}
                    </button>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-md"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="添加新的快捷评语"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <button
                    type="button"
                    onClick={handleAddComment}
                    className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    添加
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowGradeModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleGrade}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                保存批改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && uploadingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">
              上传作业 - {uploadingStudent.name}
            </h2>

            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500"
              >
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">点击选择图片或拍照</p>
                <p className="text-xs text-gray-500">最多9张图片</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />

              {uploadImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {uploadImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-square bg-gray-100 rounded overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setUploadImages(uploadImages.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleUpload}
                disabled={uploadImages.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
              >
                上传
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && assignment.submit_code && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md text-center">
            <h2 className="text-xl font-semibold mb-4">作业提交码</h2>
            <div className="bg-gray-100 p-8 rounded-lg mb-4">
              <div className="text-4xl font-mono font-bold text-indigo-600 tracking-wider">
                {assignment.submit_code}
              </div>
            </div>
            <p className="text-gray-600 mb-2">学生访问链接:</p>
            <p className="text-sm text-indigo-600 bg-indigo-50 p-2 rounded break-all">
              {window.location.origin}/submit/{assignment.submit_code}
            </p>
            <p className="text-xs text-gray-500 mt-4">
              将此链接或提交码分享给学生，学生无需登录即可提交作业
            </p>
            <button
              onClick={() => setShowQRModal(false)}
              className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
