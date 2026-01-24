import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { classesApi, studentsApi } from '../services/api';

export const ClassDetail = () => {
  const { id } = useParams();
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({ name: '', student_no: '', gender: '' });
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [classData, studentsData] = await Promise.all([
        classesApi.get(id),
        studentsApi.getByClass(id),
      ]);
      setClassInfo(classData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name,
        student_no: student.student_no || '',
        gender: student.gender || '',
      });
    } else {
      setEditingStudent(null);
      setFormData({ name: '', student_no: '', gender: '' });
    }
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingStudent) {
        await studentsApi.update(editingStudent.id, formData);
      } else {
        await studentsApi.add(id, formData);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (studentId) => {
    if (!confirm('确定要删除这个学生吗？')) return;

    try {
      await studentsApi.delete(studentId);
      loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('请上传Excel文件（.xlsx或.xls）');
      return;
    }

    setImporting(true);
    try {
      const result = await studentsApi.import(id, file);
      alert(result.message);
      loadData();
    } catch (error) {
      alert(error.message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">班级不存在</p>
        <Link to="/dashboard/classes" className="text-purple-600 hover:text-purple-500 mt-2 inline-block">
          返回班级列表
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
            <Link to="/dashboard/classes" className="hover:text-purple-600">班级管理</Link>
            <span>/</span>
            <span>{classInfo.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{classInfo.name}</h1>
          <p className="text-gray-500 mt-2">
            {classInfo.grade && <span className="mr-2">{classInfo.grade}</span>}
            {classInfo.subject && <span>{classInfo.subject}</span>}
          </p>
        </div>
        <div className="flex space-x-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx,.xls"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50 font-medium"
          >
            {importing ? '导入中...' : '导入Excel'}
          </button>
          <button
            onClick={() => openModal()}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 font-medium shadow-lg shadow-purple-500/25"
          >
            添加学生
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-8 py-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            学生列表（{students.length}人）
          </h2>
        </div>
        {students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    学号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    姓名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    性别
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.student_no || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.gender || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openModal(student)}
                        className="text-purple-600 hover:text-purple-700 mr-4"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-14 text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="mt-5 text-xl font-medium text-gray-900">还没有学生</h3>
            <p className="mt-3 text-gray-500">添加学生或导入Excel文件</p>
            <div className="mt-8 space-x-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-5 py-2.5 border border-gray-200 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50"
              >
                导入Excel
              </button>
              <button
                onClick={() => openModal()}
                className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 shadow-lg shadow-purple-500/25"
              >
                添加学生
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import Tips */}
      <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
        <h3 className="text-sm font-semibold text-purple-800">Excel导入说明</h3>
        <ul className="mt-3 text-sm text-purple-700 list-disc list-inside space-y-1">
          <li>支持 .xlsx 和 .xls 格式</li>
          <li>Excel列名支持：姓名/name、学号/student_no、性别/gender</li>
          <li>第一行为表头，从第二行开始导入数据</li>
        </ul>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-10 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              {editingStudent ? '编辑学生' : '添加学生'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">姓名 *</label>
                <input
                  type="text"
                  required
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">学号</label>
                <input
                  type="text"
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
                  value={formData.student_no}
                  onChange={(e) => setFormData({ ...formData, student_no: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">性别</label>
                <select
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow bg-white"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="">请选择</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
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
                  {editingStudent ? '保存' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
