import { useState } from 'react';
import { useToastContext } from '../store/ToastContext';

const API_BASE = '/api';
const getToken = () => localStorage.getItem('token');

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '请求失败');
  return data;
};

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

  const subjects = grade ? (subjectsByGrade[grade] || []) : [];

  const handleGenerate = async () => {
    if (!grade || !subject || !topic.trim()) {
      toast.warning('请填写年级、学科和课题');
      return;
    }

    setLoading(true);
    setResult('');
    try {
      const data = await request('/ai/lesson-plan', {
        method: 'POST',
        body: JSON.stringify({ grade, subject, topic, duration, objectives }),
      });
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

  // Simple markdown-like rendering
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
        <p className="text-gray-500 mt-2">输入课题信息，AI 自动生成教案</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Input Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">年级 *</label>
              <select
                value={grade}
                onChange={(e) => { setGrade(e.target.value); setSubject(''); }}
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
                onChange={(e) => setSubject(e.target.value)}
                disabled={!grade}
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white disabled:bg-gray-50"
              >
                <option value="">请选择学科</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">课题 *</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="例如：三角形的面积"
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
                填写左侧的课题信息，AI 将自动生成包含教学目标、重难点、教学过程和作业建议的完整教案
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
