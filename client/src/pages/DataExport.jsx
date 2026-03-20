import { useState, useEffect } from 'react';
import { useToastContext } from '../store/ToastContext';

export const DataExport = () => {
  const toast = useToastContext();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [exportType, setExportType] = useState('students');
  const [dateRange, setDateRange] = useState({ type: 'month', start: '', end: '' });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const exportTypes = [
    { value: 'students', label: '学生名单', desc: '学号、姓名、性别、入班时间' },
    { value: 'attendance', label: '出勤记录', desc: '日期、姓名、学号、出勤状态' },
    { value: 'scores', label: '积分明细', desc: '时间、姓名、变动分值、原因' },
    { value: 'score_summary', label: '积分汇总', desc: '姓名、总积分、本月积分、排名' },
    { value: 'assignments', label: '作业统计', desc: '作业名称、提交率、平均分' },
    { value: 'student_assignments', label: '学生作业明细', desc: '姓名、作业、状态、得分' },
    { value: 'comprehensive', label: '综合报表', desc: '出勤率、积分、作业提交率、平均分' }
  ];

  const dateRangeTypes = [
    { value: 'week', label: '本周' },
    { value: 'month', label: '本月' },
    { value: 'semester', label: '本学期' },
    { value: 'custom', label: '自定义' }
  ];

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setClasses(data);
      if (data.length > 0) setSelectedClass(data[0].id);
    } catch (error) {
      console.error('获取班级失败:', error);
    }
  };

  const handlePreview = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const res = await fetch('/api/export/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          class_id: selectedClass,
          export_type: exportType,
          date_range: dateRange
        })
      });
      const data = await res.json();
      setPreview(data);
    } catch (error) {
      console.error('预览失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedClass) return;
    setExporting(true);
    try {
      const res = await fetch('/api/export/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          class_id: selectedClass,
          export_type: exportType,
          date_range: dateRange
        })
      });

      if (!res.ok) throw new Error('导出失败');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = res.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? decodeURIComponent(contentDisposition.split("filename*=UTF-8''")[1] || '导出数据.xlsx')
        : '导出数据.xlsx';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出失败:', error);
      toast.error('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">数据导出</h1>
        <p className="text-gray-500 mt-1">导出班级数据为Excel文件</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Settings */}
        <div className="lg:col-span-1 space-y-6">
          {/* Class Selection */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">选择班级</h3>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Export Type */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">导出类型</h3>
            <div className="space-y-2">
              {exportTypes.map(type => (
                <label
                  key={type.value}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    exportType === type.value ? 'bg-purple-50 border border-purple-200' : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <input
                    type="radio"
                    name="exportType"
                    value={type.value}
                    checked={exportType === type.value}
                    onChange={(e) => setExportType(e.target.value)}
                    className="mt-1 text-purple-600"
                  />
                  <div>
                    <div className="font-medium text-gray-700">{type.label}</div>
                    <div className="text-sm text-gray-500">{type.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">时间范围</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {dateRangeTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setDateRange({ ...dateRange, type: type.value })}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    dateRange.type === type.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
            {dateRange.type === 'custom' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">开始日期</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">结束日期</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handlePreview}
              disabled={loading || !selectedClass}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loading ? '加载中...' : '预览数据'}
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || !selectedClass}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {exporting ? '导出中...' : '导出Excel'}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">数据预览</h3>
              {preview && (
                <span className="text-sm text-gray-500">
                  {preview.class_name} · 共 {preview.total} 条数据
                </span>
              )}
            </div>
            {preview && preview.preview.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      {Object.keys(preview.preview[0]).map(key => (
                        <th key={key} className="py-2 px-2 whitespace-nowrap">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.preview.map((row, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="py-2 px-2 text-gray-700 whitespace-nowrap">
                            {val?.toString().slice(0, 30) || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.total > 10 && (
                  <div className="text-center text-gray-400 text-sm py-4">
                    仅显示前10条数据...
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>点击"预览数据"查看导出内容</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
