import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { classesApi, assignmentsApi } from '../services/api';
import { useToastContext } from '../store/ToastContext';

export const Assignments = () => {
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formData, setFormData] = useState({
    class_id: '',
    title: '',
    description: '',
    type: 'classroom',
    deadline: ''
  });
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('active');
  const toast = useToastContext();

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [selectedClass, filter]);

  const loadClasses = async () => {
    try {
      const data = await classesApi.getAll();
      setClasses(data.filter(c => c.status !== 'archived'));
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const data = await assignmentsApi.getAll(selectedClass || undefined, filter);
      setAssignments(data);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (assignment = null) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setFormData({
        class_id: assignment.class_id,
        title: assignment.title,
        description: assignment.description || '',
        type: assignment.type,
        deadline: assignment.deadline ? assignment.deadline.slice(0, 16) : ''
      });
    } else {
      setEditingAssignment(null);
      setFormData({
        class_id: selectedClass || (classes.length > 0 ? classes[0].id : ''),
        title: '',
        description: '',
        type: 'classroom',
        deadline: ''
      });
    }
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.class_id || !formData.title) {
      setError('请选择班级并填写标题');
      return;
    }

    try {
      if (editingAssignment) {
        await assignmentsApi.update(editingAssignment.id, formData);
      } else {
        await assignmentsApi.create(formData);
      }
      setShowModal(false);
      loadAssignments();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个作业吗？相关的提交记录也会被删除。')) return;

    try {
      await assignmentsApi.delete(id);
      loadAssignments();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleArchive = async (assignment) => {
    try {
      await assignmentsApi.update(assignment.id, {
        ...assignment,
        status: assignment.status === 'archived' ? 'active' : 'archived'
      });
      loadAssignments();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getTypeLabel = (type) => {
    return type === 'homework' ? '家庭作业' : '课堂作业';
  };

  const getTypeColor = (type) => {
    return type === 'homework' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return <span className="text-gray-400">无截止时间</span>;
    const date = new Date(deadline);
    const now = new Date();
    const diff = date - now;
    const isExpired = diff < 0;
    const absDiff = Math.abs(diff);
    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(absDiff / (1000 * 60 * 60));

    let relativeText = '';
    if (isExpired) {
      relativeText = days > 0 ? `已截止${days}天` : `已截止${hours}小时`;
    } else {
      relativeText = days > 0 ? `还剩${days}天` : `还剩${hours}小时`;
    }

    const dateStr = date.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
      <span className={isExpired ? 'text-red-500' : days <= 1 ? 'text-amber-500' : 'text-gray-500'}>
        {dateStr} · {relativeText}
      </span>
    );
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">作业管理</h1>
        <button
          onClick={() => openModal()}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 shadow-lg shadow-purple-500/25"
        >
          布置作业
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-6 items-center">
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
        >
          <option value="">所有班级</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>

        <div className="bg-gray-100 rounded-xl p-1 inline-flex">
          {[
            { key: 'active', label: '进行中' },
            { key: 'archived', label: '已归档' },
            { key: '', label: '全部' }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                filter === item.key
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assignment List */}
      {loading ? (
        <div className="space-y-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-pulse">
              <div className="h-5 bg-gray-100 rounded-full w-1/3 mb-5"></div>
              <div className="h-4 bg-gray-100 rounded-full w-1/2"></div>
            </div>
          ))}
        </div>
      ) : assignments.length > 0 ? (
        <div className="space-y-5">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className={`bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-purple-200 transition-all ${
                assignment.status === 'archived' ? 'opacity-75' : ''
              }`}
            >
              <div className="p-8">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded ${getTypeColor(assignment.type)}`}>
                        {getTypeLabel(assignment.type)}
                      </span>
                      {assignment.status === 'archived' && (
                        <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">已归档</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {assignment.class_name} · {formatDeadline(assignment.deadline)}
                    </p>
                    {assignment.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{assignment.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => openModal(assignment)}
                      className="text-gray-400 hover:text-purple-600"
                      title="编辑"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleArchive(assignment)}
                      className="text-gray-400 hover:text-yellow-600"
                      title={assignment.status === 'archived' ? '恢复' : '归档'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(assignment.id)}
                      className="text-gray-400 hover:text-red-600"
                      title="删除"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-6 text-sm">
                    <span className="text-gray-500">
                      提交: <span className="font-medium text-gray-900">{assignment.submission_count}/{assignment.student_count}</span>
                    </span>
                    <span className="text-gray-500">
                      提交率: <span className="font-medium text-gray-900">
                        {assignment.student_count > 0
                          ? Math.round(assignment.submission_count / assignment.student_count * 100)
                          : 0}%
                      </span>
                    </span>
                  </div>
                  <div className="flex space-x-3">
                    {assignment.type === 'homework' && assignment.submit_code && (
                      <Link
                        to={`/dashboard/assignments/${assignment.id}/qrcode`}
                        className="text-sm text-purple-600 hover:text-purple-500"
                      >
                        查看提交码
                      </Link>
                    )}
                    <Link
                      to={`/dashboard/assignments/${assignment.id}`}
                      className="text-sm text-purple-600 hover:text-purple-500 font-medium"
                    >
                      查看批改 &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-14 text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mt-5 text-xl font-medium text-gray-900">
            {filter === 'archived' ? '没有已归档的作业' : '还没有作业'}
          </h3>
          <p className="mt-3 text-gray-500">
            {filter === 'archived' ? '归档的作业会显示在这里' : '点击"布置作业"创建第一个作业'}
          </p>
          {filter !== 'archived' && (
            <div className="mt-8">
              <button
                onClick={() => openModal()}
                className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 shadow-lg shadow-purple-500/25"
              >
                布置作业
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-10 w-full max-w-lg shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              {editingAssignment ? '编辑作业' : '布置作业'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">班级 *</label>
                <select
                  required
                  disabled={!!editingAssignment}
                  className="mt-1 block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                >
                  <option value="">请选择班级</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">作业类型 *</label>
                <div className="mt-2 flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      disabled={!!editingAssignment}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                      checked={formData.type === 'classroom'}
                      onChange={() => setFormData({ ...formData, type: 'classroom' })}
                    />
                    <span className="ml-2 text-sm text-gray-700">课堂作业</span>
                    <span className="ml-1 text-xs text-gray-500">(老师上传)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      disabled={!!editingAssignment}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                      checked={formData.type === 'homework'}
                      onChange={() => setFormData({ ...formData, type: 'homework' })}
                    />
                    <span className="ml-2 text-sm text-gray-700">家庭作业</span>
                    <span className="ml-1 text-xs text-gray-500">(学生扫码)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">作业标题 *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="例如：第三单元课后练习"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">作业描述</label>
                <textarea
                  rows={3}
                  className="mt-1 block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="作业要求说明（选填）"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">截止时间</label>
                <input
                  type="datetime-local"
                  className="mt-1 block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  {editingAssignment ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
