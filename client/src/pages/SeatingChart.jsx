import { useState, useEffect } from 'react';
import { useToastContext } from '../store/ToastContext';

export const SeatingChart = () => {
  const toast = useToastContext();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [seating, setSeating] = useState(null);
  const [seats, setSeats] = useState([]);
  const [settings, setSettings] = useState({ rows: 6, cols: 8, aisle_after: 4 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [draggedStudent, setDraggedStudent] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
      fetchSeating();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes', { headers: getHeaders() });
      const data = await res.json();
      setClasses(data);
      if (data.length > 0) setSelectedClass(data[0].id);
    } catch (error) {
      console.error('获取班级失败:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`/api/classes/${selectedClass}/students`, { headers: getHeaders() });
      setStudents(await res.json());
    } catch (error) {
      console.error('获取学生失败:', error);
    }
  };

  const fetchSeating = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/seating/${selectedClass}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSeating(data);
        setSettings({ rows: data.rows, cols: data.cols, aisle_after: data.aisle_after });
        setSeats(data.assignments || []);
      } else {
        setSeating(null);
        setSeats([]);
      }
    } catch (error) {
      console.error('获取座位表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeSeating = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/seating', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ class_id: selectedClass, ...settings })
      });
      if (res.ok) {
        fetchSeating();
      }
    } catch (error) {
      console.error('创建座位表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRandomSeating = async (mode) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/seating/${selectedClass}/random`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ mode })
      });
      if (res.ok) {
        const data = await res.json();
        setSeats(data.assignments);
      }
    } catch (error) {
      console.error('随机排座失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSeating = async (rule) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/seating/${selectedClass}/auto`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ rule })
      });
      if (res.ok) {
        const data = await res.json();
        setSeats(data.assignments);
      }
    } catch (error) {
      console.error('自动排座失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSeating = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/seating/${selectedClass}/assignments`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ assignments: seats })
      });
      if (res.ok) {
        toast.success('保存成功');
      }
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      const res = await fetch(`/api/seating/${selectedClass}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setShowSettings(false);
        fetchSeating();
      }
    } catch (error) {
      console.error('更新设置失败:', error);
    }
  };

  const handleDragStart = (student) => {
    setDraggedStudent(student);
  };

  const handleDrop = (row, col) => {
    if (!draggedStudent) return;

    const newSeats = seats.filter(s => s.student_id !== draggedStudent.id);
    const existingSeat = seats.find(s => s.row === row && s.col === col);

    if (existingSeat && existingSeat.student_id !== draggedStudent.id) {
      const draggedSeat = seats.find(s => s.student_id === draggedStudent.id);
      if (draggedSeat) {
        newSeats.push({ ...existingSeat, row: draggedSeat.row, col: draggedSeat.col });
      } else {
        newSeats.push({ ...existingSeat });
      }
    }

    newSeats.push({ student_id: draggedStudent.id, row, col });
    setSeats(newSeats);
    setDraggedStudent(null);
  };

  const handleRemoveFromSeat = (studentId) => {
    setSeats(seats.filter(s => s.student_id !== studentId));
  };

  const getStudentAtSeat = (row, col) => {
    const seat = seats.find(s => s.row === row && s.col === col);
    if (!seat) return null;
    return students.find(s => s.id === seat.student_id);
  };

  const getUnassignedStudents = () => {
    const assignedIds = seats.map(s => s.student_id);
    return students.filter(s => !assignedIds.includes(s.id));
  };

  const renderGrid = () => {
    const grid = [];
    for (let row = 0; row < settings.rows; row++) {
      const rowSeats = [];
      for (let col = 0; col < settings.cols; col++) {
        const student = getStudentAtSeat(row, col);
        const isAisle = settings.aisle_after && col === settings.aisle_after - 1;

        rowSeats.push(
          <div
            key={`${row}-${col}`}
            className={`relative w-16 h-16 border-2 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
              student
                ? 'bg-purple-100 border-purple-300 hover:bg-purple-200'
                : 'bg-gray-50 border-dashed border-gray-300 hover:bg-gray-100 hover:border-gray-400'
            } ${isAisle ? 'mr-4' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(row, col)}
            onClick={() => student && handleRemoveFromSeat(student.id)}
            title={student ? `${student.name} (点击移除)` : '拖拽学生到此处'}
          >
            {student ? (
              <div className="text-center">
                <div className="text-xs font-medium text-purple-700 truncate w-14">
                  {student.name}
                </div>
                {student.gender && (
                  <div className={`text-xs ${student.gender === '男' ? 'text-blue-500' : 'text-pink-500'}`}>
                    {student.gender}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-gray-300 text-xs">{row + 1}-{col + 1}</span>
            )}
          </div>
        );
      }
      grid.push(
        <div key={row} className="flex gap-2 justify-center">
          {rowSeats}
        </div>
      );
    }
    return grid;
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center p-8">
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setIsFullscreen(false)}
            className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100"
          >
            退出全屏
          </button>
        </div>
        <div className="text-white text-2xl mb-8">
          {classes.find(c => c.id === selectedClass)?.name} - 座位表
        </div>
        <div className="bg-white rounded-xl p-8 shadow-2xl">
          <div className="text-center text-gray-500 mb-4 pb-4 border-b-2 border-gray-200">
            讲 台
          </div>
          <div className="space-y-2">
            {renderGrid()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">座位表</h1>
          <p className="text-gray-500 mt-1">拖拽学生安排座位</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={() => setIsFullscreen(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            title="投屏模式"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : !seating ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-700 mb-2">尚未创建座位表</h3>
          <p className="text-gray-500 mb-6">设置教室布局后开始安排座位</p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-600 mb-1">行数</label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.rows}
                onChange={(e) => setSettings({ ...settings, rows: parseInt(e.target.value) || 6 })}
                className="w-20 px-3 py-2 border rounded-lg text-center"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">列数</label>
              <input
                type="number"
                min="1"
                max="12"
                value={settings.cols}
                onChange={(e) => setSettings({ ...settings, cols: parseInt(e.target.value) || 8 })}
                className="w-20 px-3 py-2 border rounded-lg text-center"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">过道位置</label>
              <input
                type="number"
                min="0"
                max={settings.cols}
                value={settings.aisle_after}
                onChange={(e) => setSettings({ ...settings, aisle_after: parseInt(e.target.value) || 0 })}
                className="w-20 px-3 py-2 border rounded-lg text-center"
              />
            </div>
          </div>
          <button
            onClick={initializeSeating}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            创建座位表
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Student List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 sticky top-4">
              <h3 className="font-semibold text-gray-800 mb-3">未安排学生</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getUnassignedStudents().map(student => (
                  <div
                    key={student.id}
                    draggable
                    onDragStart={() => handleDragStart(student)}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors"
                  >
                    <span className={`w-2 h-2 rounded-full ${student.gender === '男' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                    <span className="text-sm text-gray-700">{student.name}</span>
                  </div>
                ))}
                {getUnassignedStudents().length === 0 && (
                  <div className="text-center text-gray-400 py-4 text-sm">
                    所有学生已安排座位
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2">快捷操作</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => handleRandomSeating('full')}
                    className="w-full px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    完全随机
                  </button>
                  <button
                    onClick={() => handleRandomSeating('gender_separate')}
                    className="w-full px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    男女分开
                  </button>
                  <button
                    onClick={() => handleRandomSeating('gender_pair')}
                    className="w-full px-3 py-2 text-sm bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 transition-colors"
                  >
                    男女搭配
                  </button>
                  <button
                    onClick={() => handleAutoSeating('height')}
                    className="w-full px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    按身高排座
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Seating Grid */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="text-center text-gray-500 px-8 py-2 bg-gray-100 rounded-lg">
                  讲 台
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    设置
                  </button>
                  <button
                    onClick={handleSaveSeating}
                    disabled={saving}
                    className="px-4 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? '保存中...' : '保存'}
                  </button>
                </div>
              </div>

              {showSettings && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg flex items-end gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">行数</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={settings.rows}
                      onChange={(e) => setSettings({ ...settings, rows: parseInt(e.target.value) || 6 })}
                      className="w-20 px-3 py-2 border rounded-lg text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">列数</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={settings.cols}
                      onChange={(e) => setSettings({ ...settings, cols: parseInt(e.target.value) || 8 })}
                      className="w-20 px-3 py-2 border rounded-lg text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">过道位置</label>
                    <input
                      type="number"
                      min="0"
                      max={settings.cols}
                      value={settings.aisle_after}
                      onChange={(e) => setSettings({ ...settings, aisle_after: parseInt(e.target.value) || 0 })}
                      className="w-20 px-3 py-2 border rounded-lg text-center"
                    />
                  </div>
                  <button
                    onClick={handleUpdateSettings}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    应用
                  </button>
                </div>
              )}

              <div className="space-y-2 overflow-x-auto py-4">
                {renderGrid()}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-purple-100 border border-purple-300"></span>
                    已安排
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-gray-50 border border-dashed border-gray-300"></span>
                    空座位
                  </span>
                </div>
                <span>
                  已安排 {seats.length}/{students.length} 人
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
