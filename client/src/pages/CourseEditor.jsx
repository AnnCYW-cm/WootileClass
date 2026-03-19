import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { coursesApi, animationsApi } from '../services/api';
import { AnimationPlayer, AnimationUploader, AnimationLibrary } from '../components/Animation';

export const CourseEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  // Section states
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionTitle, setSectionTitle] = useState('');

  // Animation states
  const [showAnimationModal, setShowAnimationModal] = useState(false);
  const [targetSectionId, setTargetSectionId] = useState(null);
  const [animationTab, setAnimationTab] = useState('library'); // library, upload
  const [animationTitle, setAnimationTitle] = useState('');
  const [animationDescription, setAnimationDescription] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);

  // Quick upload state
  const [quickUploadFile, setQuickUploadFile] = useState(null);

  // Preview state
  const [previewAnimation, setPreviewAnimation] = useState(null);

  const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三', '高一', '高二', '高三'];
  const subjects = ['数学', '物理', '化学', '生物', '语文', '英语', '历史', '地理', '通用'];

  // Load course
  const loadCourse = async () => {
    setLoading(true);
    try {
      const data = await coursesApi.getById(id);
      setCourse(data);
      setTitle(data.title);
      setGrade(data.grade || '');
      setSubject(data.subject || '');
      setDescription(data.description || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [id]);

  // Save course info
  const handleSave = async () => {
    setSaving(true);
    try {
      await coursesApi.update(id, { title, grade, subject, description });
      loadCourse();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Publish/Unpublish course
  const handlePublish = async () => {
    try {
      if (course.status === 'published') {
        await coursesApi.unpublish(id);
      } else {
        await coursesApi.publish(id);
      }
      loadCourse();
    } catch (err) {
      alert(err.message);
    }
  };

  // Section operations
  const handleAddSection = () => {
    setEditingSection(null);
    setSectionTitle('');
    setShowSectionModal(true);
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    setSectionTitle(section.title);
    setShowSectionModal(true);
  };

  const handleSaveSection = async () => {
    if (!sectionTitle.trim()) return;

    try {
      if (editingSection) {
        await coursesApi.updateSection(id, editingSection.id, { title: sectionTitle });
      } else {
        await coursesApi.createSection(id, { title: sectionTitle });
      }
      setShowSectionModal(false);
      loadCourse();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!confirm('确定要删除这个章节吗？章节内的动画也会被删除。')) return;

    try {
      await coursesApi.deleteSection(id, sectionId);
      loadCourse();
    } catch (err) {
      alert(err.message);
    }
  };

  // Animation operations
  const handleAddAnimation = (sectionId) => {
    setTargetSectionId(sectionId);
    setAnimationTab('library');
    setAnimationTitle('');
    setAnimationDescription('');
    setUploadedFile(null);
    setShowAnimationModal(true);
  };

  const handleSelectBuiltinAnimation = async (animation) => {
    try {
      await animationsApi.create({
        sectionId: targetSectionId,
        title: animation.name,
        description: animation.description,
        type: animation.type || 'lottie',
        sourceUrl: animation.source_path,
        thumbnail: animation.thumbnail,
      });
      setShowAnimationModal(false);
      loadCourse();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUploadAnimation = async () => {
    if (!uploadedFile || !animationTitle.trim()) {
      alert('请填写动画标题并上传文件');
      return;
    }

    try {
      await animationsApi.create({
        sectionId: targetSectionId,
        title: animationTitle,
        description: animationDescription,
        type: uploadedFile.type,
        sourceUrl: uploadedFile.url,
      });
      setShowAnimationModal(false);
      loadCourse();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAnimation = async (animationId) => {
    if (!confirm('确定要删除这个动画吗？')) return;

    try {
      await animationsApi.delete(animationId);
      loadCourse();
    } catch (err) {
      alert(err.message);
    }
  };

  // Auto-create a default section if none exists, then open animation modal
  const handleAutoCreateSectionAndAdd = async () => {
    try {
      await coursesApi.createSection(id, { title: '默认章节' });
      const data = await coursesApi.getById(id);
      setCourse(data);
      const newSectionId = data.sections?.[0]?.id;
      if (newSectionId) {
        handleAddAnimation(newSectionId);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Quick upload: auto-create section if needed, then upload file as animation
  const handleQuickUpload = async (file) => {
    let sectionId = course?.sections?.[0]?.id;

    // Auto-create default section if none exists
    if (!sectionId) {
      try {
        await coursesApi.createSection(id, { title: '默认章节' });
        const data = await coursesApi.getById(id);
        setCourse(data);
        sectionId = data.sections?.[0]?.id;
      } catch (err) {
        alert(err.message);
        return;
      }
    }

    // Determine file type
    const ext = file.name.split('.').pop().toLowerCase();
    const isVideo = ['mp4', 'webm', 'mov'].includes(ext);
    const isGif = ext === 'gif';
    const isLottie = ext === 'json';

    if (!isVideo && !isGif && !isLottie) {
      alert('不支持的文件格式');
      return;
    }

    // For animation files (Lottie/GIF), use the AnimationUploader flow
    // Set up the animation modal with the file pre-loaded
    setTargetSectionId(sectionId);
    setAnimationTab('upload');
    setAnimationTitle(file.name.replace(/\.[^/.]+$/, ''));
    setAnimationDescription('');
    setShowAnimationModal(true);
    // The user will complete the upload in the modal
    // We store the file reference for the uploader to pick up
    setQuickUploadFile(file);
  };

  const copyShareLink = () => {
    if (course?.share_code) {
      const link = `${window.location.origin}/learn/${course.share_code}`;
      navigator.clipboard.writeText(link);
      alert('分享链接已复制到剪贴板');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl">
        {error}
        <Link to="/dashboard/courses" className="ml-4 text-purple-600 hover:underline">
          返回课程列表
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard/courses"
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">编辑课程</h1>
            <p className="text-sm text-gray-500 mt-1">
              {course?.status === 'published' ? (
                <span className="text-green-600">已发布</span>
              ) : (
                <span className="text-gray-400">草稿</span>
              )}
              {course?.view_count > 0 && (
                <span className="ml-3">{course.view_count} 次观看</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {course?.status === 'published' && course?.share_code && (
            <button
              onClick={copyShareLink}
              className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              分享链接
            </button>
          )}

          <button
            onClick={handlePublish}
            className={`px-4 py-2 rounded-xl font-medium transition ${
              course?.status === 'published'
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {course?.status === 'published' ? '取消发布' : '发布课程'}
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* Course Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">课程信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">课程标题 *</label>
            <input
              type="text"
              className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入课程标题"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">年级</label>
            <select
              className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            >
              <option value="">请选择年级</option>
              {grades.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">学科</label>
            <select
              className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option value="">请选择学科</option>
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">课程描述</label>
            <textarea
              rows={3}
              className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要描述课程内容..."
            />
          </div>
        </div>
      </div>

      {/* Quick Add Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">添加内容</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              // If no sections exist, we'll auto-create one when adding
              const sectionId = course?.sections?.[0]?.id;
              if (sectionId) {
                handleAddAnimation(sectionId);
              } else {
                handleAutoCreateSectionAndAdd();
              }
            }}
            className="flex items-center gap-2 px-5 py-3 bg-purple-50 text-purple-600 rounded-xl font-medium hover:bg-purple-100 transition border border-purple-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            从动画库选择
          </button>
          <label className="flex items-center gap-2 px-5 py-3 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition border border-blue-200 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            上传文件
            <input
              type="file"
              accept=".json,.gif,.mp4,.webm,.mov"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleQuickUpload(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        <p className="text-xs text-gray-400 mt-3">支持 Lottie JSON、GIF、MP4、WebM、MOV 格式</p>
      </div>

      {/* Sections */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">课程章节</h2>
          <button
            onClick={handleAddSection}
            className="px-4 py-2 bg-purple-100 text-purple-600 rounded-xl font-medium hover:bg-purple-200 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加章节
          </button>
        </div>

        {course?.sections?.length > 0 ? (
          <div className="space-y-4">
            {course.sections.map((section, sectionIndex) => (
              <div
                key={section.id}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                {/* Section Header */}
                <div className="bg-gray-50 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm font-medium">
                      {sectionIndex + 1}
                    </span>
                    <h3 className="font-medium text-gray-900">{section.title}</h3>
                    <span className="text-sm text-gray-400">
                      {section.animations?.length || 0} 个动画
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAddAnimation(section.id)}
                      className="p-2 rounded-lg text-purple-600 hover:bg-purple-100 transition"
                      title="添加动画"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEditSection(section)}
                      className="p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition"
                      title="编辑"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteSection(section.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="删除"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Animations */}
                {section.animations?.length > 0 && (
                  <div className="p-4 space-y-3">
                    {section.animations.map((animation, animIndex) => (
                      <div
                        key={animation.id}
                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition group"
                      >
                        {/* Thumbnail */}
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {animation.thumbnail ? (
                            <img
                              src={animation.thumbnail}
                              alt={animation.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            </svg>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{animation.title}</h4>
                          {animation.description && (
                            <p className="text-sm text-gray-500 truncate">{animation.description}</p>
                          )}
                          <span className="text-xs text-gray-400">
                            {animation.type === 'builtin' ? '内置动画' : animation.type === 'lottie' ? 'Lottie' : 'GIF'}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => setPreviewAnimation(animation)}
                            className="p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-white transition"
                            title="预览"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteAnimation(animation.id)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-white transition"
                            title="删除"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {(!section.animations || section.animations.length === 0) && (
                  <div className="p-8 text-center">
                    <p className="text-gray-400 mb-4">这个章节还没有动画</p>
                    <button
                      onClick={() => handleAddAnimation(section.id)}
                      className="px-4 py-2 border border-dashed border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition"
                    >
                      添加第一个动画
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">章节可以帮助组织课程内容，也可以稍后再添加</p>
          </div>
        )}
      </div>

      {/* Section Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingSection ? '编辑章节' : '添加章节'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">章节标题 *</label>
                <input
                  type="text"
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  placeholder="例如：第一章 三角形的基本概念"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowSectionModal(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveSection}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90"
                >
                  {editingSection ? '保存' : '添加'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animation Modal */}
      {showAnimationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">添加动画</h2>
              <button
                onClick={() => setShowAnimationModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-4 flex gap-2">
              <button
                onClick={() => setAnimationTab('library')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  animationTab === 'library'
                    ? 'bg-purple-100 text-purple-600'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                内置动画库
              </button>
              <button
                onClick={() => setAnimationTab('upload')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  animationTab === 'upload'
                    ? 'bg-purple-100 text-purple-600'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                上传动画
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {animationTab === 'library' ? (
                <AnimationLibrary
                  onSelect={handleSelectBuiltinAnimation}
                  className="h-full"
                />
              ) : (
                <div className="space-y-6">
                  <AnimationUploader
                    onUpload={(file) => setUploadedFile(file)}
                  />

                  {uploadedFile && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">动画标题 *</label>
                        <input
                          type="text"
                          className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                          value={animationTitle}
                          onChange={(e) => setAnimationTitle(e.target.value)}
                          placeholder="输入动画标题"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">动画描述</label>
                        <textarea
                          rows={2}
                          className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                          value={animationDescription}
                          onChange={(e) => setAnimationDescription(e.target.value)}
                          placeholder="简要描述动画内容..."
                        />
                      </div>
                      <button
                        onClick={handleUploadAnimation}
                        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition"
                      >
                        添加到章节
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewAnimation && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">{previewAnimation.title}</h2>
              <button
                onClick={() => setPreviewAnimation(null)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <AnimationPlayer
                animation={{
                  ...previewAnimation,
                  sourceUrl: previewAnimation.source_url,
                }}
                autoPlay={true}
                showControls={true}
                allowFullscreen={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
