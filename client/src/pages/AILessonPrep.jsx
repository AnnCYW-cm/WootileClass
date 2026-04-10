import { useState, useEffect } from 'react';
import { useToastContext } from '../store/ToastContext';
import { aiApi } from '../services/api';

const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三', '高一', '高二', '高三'];

const subjectsByGrade = {
  '一年级': ['语文', '数学', '英语', '科学'],
  '二年级': ['语文', '数学', '英语', '科学'],
  '三年级': ['语文', '数学', '英语', '科学'],
  '四年级': ['语文', '数学', '英语', '科学'],
  '五年级': ['语文', '数学', '英语', '科学'],
  '六年级': ['语文', '数学', '英语', '科学'],
  '初一': ['语文', '数学', '英语', '生物', '历史', '地理'],
  '初二': ['语文', '数学', '英语', '物理', '生物', '历史', '地理'],
  '初三': ['语文', '数学', '英语', '物理', '化学', '历史'],
  '高一': ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理'],
  '高二': ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理'],
  '高三': ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理'],
};

export const AILessonPrep = () => {
  const toast = useToastContext();
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('40分钟');
  const [objectives, setObjectives] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // PPT upload state
  const [pptContent, setPptContent] = useState('');
  const [pptFileName, setPptFileName] = useState('');
  const [pptUploading, setPptUploading] = useState(false);
  const [pptSlides, setPptSlides] = useState(0);

  // Related animations
  const [relatedAnimations, setRelatedAnimations] = useState([]);

  // Curriculum state
  const [curriculum, setCurriculum] = useState(null);
  const [selectedVolume, setSelectedVolume] = useState('上册');
  const [curriculumLoading, setCurriculumLoading] = useState(false);

  const subjects = grade ? (subjectsByGrade[grade] || []) : [];

  // Load curriculum when grade + subject change
  useEffect(() => {
    if (grade && subject) {
      setCurriculumLoading(true);
      aiApi.getCurriculum(grade, subject)
        .then(data => setCurriculum(data))
        .catch(() => setCurriculum(null))
        .finally(() => setCurriculumLoading(false));

      aiApi.getRelatedAnimations(grade, subject)
        .then(data => setRelatedAnimations(data))
        .catch(() => setRelatedAnimations([]));
    } else {
      setCurriculum(null);
      setRelatedAnimations([]);
    }
  }, [grade, subject]);

  const handlePPTUpload = async (file) => {
    if (!file) return;
    if (!file.name.endsWith('.pptx')) {
      toast.warning('仅支持 .pptx 格式');
      return;
    }
    setPptUploading(true);
    try {
      const data = await aiApi.uploadPpt(file);
      setPptContent(data.content);
      setPptFileName(file.name);
      setPptSlides(data.slides);
      toast.success(`已解析 ${data.slides} 页PPT`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPptUploading(false);
    }
  };

  const clearPPT = () => {
    setPptContent('');
    setPptFileName('');
    setPptSlides(0);
  };

  const handleGenerate = async () => {
    if (!grade || !subject || !topic.trim()) {
      toast.warning('请填写年级、学科和课题');
      return;
    }

    setLoading(true);
    setResult('');
    try {
      const data = await aiApi.generateLessonPlan({ grade, subject, topic, duration, objectives, pptContent: pptContent || undefined });
      setResult(data.plan);
      setHistory(prev => [{ grade, subject, topic, plan: data.plan, time: new Date() }, ...prev.slice(0, 9)]);
      toast.success('教案已生成');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast.success('已复制到剪贴板');
  };

  const handleSelectLesson = (lesson) => {
    setTopic(lesson);
    toast.info(`已选择：${lesson}`);
  };

  // Get units for current volume
  const currentUnits = curriculum?.[selectedVolume] || [];

  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-gray-900 mt-6 mb-3">{line.slice(2)}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-gray-800 mt-5 mb-2">{line.slice(3)}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold text-gray-700 mt-4 mb-2">{line.slice(4)}</h3>;
      if (line.startsWith('#### ')) return <h4 key={i} className="text-base font-semibold text-gray-700 mt-3 mb-1">{line.slice(5)}</h4>;
      if (line.startsWith('- ')) return <li key={i} className="ml-5 text-gray-700 list-disc">{line.slice(2)}</li>;
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-gray-800 mt-2">{line.slice(2, -2)}</p>;
      if (line.trim() === '') return <div key={i} className="h-2" />;
      return <p key={i} className="text-gray-700 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI 备课助手</h1>
        <p className="text-gray-500 mt-2">选择课文或输入课题，AI 自动生成教案</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Input Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">年级 *</label>
              <select
                value={grade}
                onChange={(e) => { setGrade(e.target.value); setSubject(''); setTopic(''); }}
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="">请选择年级</option>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">学科 *</label>
              <select
                value={subject}
                onChange={(e) => { setSubject(e.target.value); setTopic(''); }}
                disabled={!grade}
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white disabled:bg-gray-50"
              >
                <option value="">请选择学科</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Curriculum Picker */}
            {curriculum && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">从教材选择课文</label>
                <div className="flex gap-2 mb-3">
                  {Object.keys(curriculum).map(vol => (
                    <button
                      key={vol}
                      onClick={() => setSelectedVolume(vol)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                        selectedVolume === vol
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {vol}
                    </button>
                  ))}
                </div>
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                  {currentUnits.map((unit, ui) => (
                    <div key={ui}>
                      <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-500">{unit.unit}</div>
                      {unit.lessons.map((lesson, li) => (
                        <button
                          key={li}
                          onClick={() => handleSelectLesson(lesson)}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 transition flex items-center justify-between group ${
                            topic === lesson ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                          }`}
                        >
                          <span>{lesson}</span>
                          {topic === lesson ? (
                            <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                      {unit.extras?.map((extra, ei) => (
                        <button
                          key={`e${ei}`}
                          onClick={() => handleSelectLesson(extra)}
                          className={`w-full text-left px-4 py-2 text-xs hover:bg-blue-50 transition ${
                            topic === extra ? 'bg-blue-50 text-blue-600' : 'text-gray-400'
                          }`}
                        >
                          {extra}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {curriculumLoading && (
              <p className="text-xs text-gray-400 text-center">正在加载教材目录...</p>
            )}

            {grade && subject && !curriculum && !curriculumLoading && (
              <p className="text-xs text-gray-400 text-center">该学科暂无教材目录，请手动输入课题</p>
            )}

            {/* PPT Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">上传课件（选填）</label>
              {pptFileName ? (
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <svg className="w-8 h-8 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-800 truncate">{pptFileName}</p>
                    <p className="text-xs text-blue-500">{pptSlides} 页已解析</p>
                  </div>
                  <button onClick={clearPPT} className="p-1 text-blue-400 hover:text-blue-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer transition ${
                  pptUploading ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                }`}>
                  {pptUploading ? (
                    <>
                      <svg className="animate-spin w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-sm text-blue-500">解析中...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm text-gray-500">上传 PPT 课件</span>
                      <span className="text-xs text-gray-400">(.pptx)</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pptx"
                    className="hidden"
                    onChange={(e) => {
                      handlePPTUpload(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                    disabled={pptUploading}
                  />
                </label>
              )}
              {pptContent && (
                <p className="text-xs text-gray-400 mt-1">AI 将基于您的课件内容生成配套教案</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                课题 *
                {curriculum && <span className="text-gray-400 font-normal ml-1">（已从教材选择，或手动输入）</span>}
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder={curriculum ? '点击上方课文选择，或手动输入' : '例如：三角形的面积'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">课时</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="35分钟">35分钟</option>
                <option value="40分钟">40分钟</option>
                <option value="45分钟">45分钟</option>
                <option value="80分钟">80分钟（双课时）</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">补充要求（选填）</label>
              <textarea
                rows={3}
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="例如：侧重动手操作，适合基础薄弱的学生"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  AI 生成中...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  生成教案
                </>
              )}
            </button>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">生成记录</h3>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => setResult(h.plan)}
                    className="w-full text-left p-3 rounded-lg hover:bg-purple-50 transition text-sm"
                  >
                    <div className="font-medium text-gray-900 truncate">{h.topic}</div>
                    <div className="text-gray-400 text-xs mt-1">{h.grade} · {h.subject}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Result */}
        <div className="lg:col-span-2">
          {result ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">生成结果</h2>
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  复制
                </button>
              </div>
              <div className="p-6 prose prose-purple max-w-none">
                {renderMarkdown(result)}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-14 text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-5">
                <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900">AI 智能备课</h3>
              <p className="mt-3 text-gray-500 max-w-md mx-auto">
                选择年级和学科后，可直接从教材目录中选择课文生成教案，也可以手动输入任意课题
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-gray-400">
                <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full">已收录：一年级语文</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full">更多学科持续更新中</span>
              </div>
            </div>
          )}

          {/* Related Animations */}
          {relatedAnimations.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                相关课程动画
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {relatedAnimations.map(anim => (
                  <a
                    key={anim.id}
                    href={`/dashboard/courses/${anim.id}/play`}
                    className="group block rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-purple-200 transition"
                  >
                    <div className="aspect-video bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center relative">
                      {anim.cover_image ? (
                        <img src={anim.cover_image} alt={anim.title} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-8 h-8 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition transform scale-75 group-hover:scale-100">
                          <svg className="w-5 h-5 text-purple-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-900 truncate">{anim.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{anim.animation_count || 0} 个动画</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
