import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { classesApi, membershipApi } from '../services/api';
import { useLoadClasses, useModal } from '../hooks';
import { useToastContext } from '../store/ToastContext';

export const Classes = () => {
  const toast = useToastContext();
  const { classes, activeClasses, archivedClasses, loading, reload } = useLoadClasses();
  const [showArchived, setShowArchived] = useState(false);
  const [usageStats, setUsageStats] = useState(null);

  const modal = useModal({ name: '', grade: '', subject: '' });

  // 获取使用量统计
  useEffect(() => {
    membershipApi.getUsage().then(setUsageStats).catch(() => {});
  }, [classes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    modal.setError('');

    try {
      if (modal.isEditing) {
        await classesApi.update(modal.editingItem.id, modal.formData);
      } else {
        await classesApi.create(modal.formData);
      }
      modal.close();
      reload();
      // 刷新使用量统计
      membershipApi.getUsage().then(setUsageStats).catch(() => {});
    } catch (err) {
      if (err.code === 'LIMIT_EXCEEDED') {
        modal.setError(`${err.message}（当前：${err.current}/${err.limit}）`);
      } else {
        modal.setError(err.message);
      }
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个班级吗？删除后无法恢复。')) return;

    try {
      await classesApi.delete(id);
      reload();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleArchive = async (cls) => {
    const action = cls.status === 'archived' ? '恢复' : '归档';
    if (!confirm(`确定要${action}班级"${cls.name}"吗？`)) return;

    try {
      await classesApi.archive(cls.id);
      reload();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openEditModal = (cls) => {
    modal.open(cls, {
      name: cls.name,
      grade: cls.grade || '',
      subject: cls.subject || ''
    });
  };

  const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三', '高一', '高二', '高三'];
  const subjects = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治', '音乐', '美术', '体育', '信息技术', '其他'];

  const displayClasses = showArchived ? archivedClasses : activeClasses;

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">班级管理</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setShowArchived(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !showArchived
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              活跃 ({activeClasses.length})
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                showArchived
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              已归档 ({archivedClasses.length})
            </button>
          </div>
          <button
            onClick={() => modal.open()}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25"
          >
            创建班级
          </button>
        </div>
      </div>

      {/* 使用量提示 */}
      {usageStats && !usageStats.usage?.classes?.unlimited && (
        <div className={`p-4 rounded-xl flex items-center justify-between ${
          usageStats.usage.classes.current >= usageStats.usage.classes.limit
            ? 'bg-amber-50 border border-amber-200'
            : 'bg-purple-50 border border-purple-100'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              usageStats.usage.classes.current >= usageStats.usage.classes.limit
                ? 'bg-amber-100'
                : 'bg-purple-100'
            }`}>
              <svg className={`w-5 h-5 ${
                usageStats.usage.classes.current >= usageStats.usage.classes.limit
                  ? 'text-amber-600'
                  : 'text-purple-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p className={`text-sm font-medium ${
                usageStats.usage.classes.current >= usageStats.usage.classes.limit
                  ? 'text-amber-800'
                  : 'text-purple-800'
              }`}>
                {usageStats.usage.classes.current >= usageStats.usage.classes.limit
                  ? `已创建 ${usageStats.usage.classes.current} 个班级，免费版上限 ${usageStats.usage.classes.limit} 个`
                  : `已创建 ${usageStats.usage.classes.current} 个班级，还可创建 ${usageStats.usage.classes.limit - usageStats.usage.classes.current} 个`
                }
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {usageStats.isPremium ? '会员版' : '免费版'}
                {usageStats.usage.classes.current >= usageStats.usage.classes.limit
                  ? ' · 升级会员解锁无限班级'
                  : ''}
              </p>
            </div>
          </div>
          {!usageStats.isPremium && (
            <Link
              to="/dashboard/membership"
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              升级会员
            </Link>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-pulse">
              <div className="h-5 bg-gray-100 rounded-full w-3/4 mb-5"></div>
              <div className="h-4 bg-gray-100 rounded-full w-1/2"></div>
            </div>
          ))}
        </div>
      ) : displayClasses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayClasses.map((cls) => (
            <div
              key={cls.id}
              className={`bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-purple-200 transition-all ${
                cls.status === 'archived' ? 'opacity-75' : ''
              }`}
            >
              <div className="p-7">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900">{cls.name}</h3>
                      {cls.status === 'archived' && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full font-medium">
                          已归档
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1.5">
                      {cls.grade && <span className="mr-2">{cls.grade}</span>}
                      {cls.subject && <span>{cls.subject}</span>}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => openEditModal(cls)}
                      className="p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                      title="编辑"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleArchive(cls)}
                      className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      title={cls.status === 'archived' ? '恢复' : '归档'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {cls.status === 'archived' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        )}
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(cls.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="删除"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="mt-6 flex items-center text-sm text-gray-400">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <span className="font-medium">{cls.student_count || 0}</span>
                  <span className="ml-1">名学生</span>
                </div>
              </div>
              <div className="border-t border-gray-100 px-7 py-5 bg-gray-50/50 rounded-b-2xl">
                <Link
                  to={`/dashboard/classes/${cls.id}`}
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center group"
                >
                  管理学生
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-14 text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="mt-5 text-xl font-medium text-gray-900">
            {showArchived ? '没有已归档的班级' : '还没有班级'}
          </h3>
          <p className="mt-3 text-gray-500">
            {showArchived ? '归档的班级会显示在这里' : '创建您的第一个班级开始使用'}
          </p>
          {!showArchived && (
            <div className="mt-8">
              <button
                onClick={() => modal.open()}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25"
              >
                创建班级
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-10 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              {modal.isEditing ? '编辑班级' : '创建班级'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {modal.error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">
                  {modal.error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">班级名称 *</label>
                <input
                  type="text"
                  required
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
                  value={modal.formData.name}
                  onChange={(e) => modal.updateField('name', e.target.value)}
                  placeholder="例如：三年级1班"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">年级</label>
                <select
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow bg-white"
                  value={modal.formData.grade}
                  onChange={(e) => modal.updateField('grade', e.target.value)}
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
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow bg-white"
                  value={modal.formData.subject}
                  onChange={(e) => modal.updateField('subject', e.target.value)}
                >
                  <option value="">请选择学科</option>
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => modal.close()}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  {modal.isEditing ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
