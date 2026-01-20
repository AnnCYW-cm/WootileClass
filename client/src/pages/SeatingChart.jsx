import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { classesApi, studentsApi } from '../services/api';

export const SeatingChart = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Seating configuration
  const [rows, setRows] = useState(6);
  const [cols, setCols] = useState(8);
  const [seats, setSeats] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
      loadSeatingChart();
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      const data = await classesApi.getAll();
      const activeClasses = data.filter(c => c.status !== 'archived');
      setClasses(activeClasses);
      if (activeClasses.length > 0) {
        setSelectedClass(activeClasses[0].id);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const data = await studentsApi.getByClass(selectedClass);
      setStudents(data);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  const loadSeatingChart = () => {
    const saved = localStorage.getItem(`seating_${selectedClass}`);
    if (saved) {
      const data = JSON.parse(saved);
      setRows(data.rows || 6);
      setCols(data.cols || 8);
      setSeats(data.seats || {});
    } else {
      setSeats({});
    }
  };

  const saveSeatingChart = () => {
    localStorage.setItem(`seating_${selectedClass}`, JSON.stringify({
      rows,
      cols,
      seats
    }));
    alert('座位表已保存');
  };

  const handleSeatClick = (row, col) => {
    const seatKey = `${row}-${col}`;

    if (selectedStudent) {
      // Remove student from previous seat
      const newSeats = { ...seats };
      Object.keys(newSeats).forEach(key => {
        if (newSeats[key]?.id === selectedStudent.id) {
          delete newSeats[key];
        }
      });
      // Assign to new seat
      newSeats[seatKey] = selectedStudent;
      setSeats(newSeats);
      setSelectedStudent(null);
    } else if (seats[seatKey]) {
      // Click on occupied seat - select that student for moving
      setSelectedStudent(seats[seatKey]);
    }
  };

  const handleStudentClick = (student) => {
    if (selectedStudent?.id === student.id) {
      setSelectedStudent(null);
    } else {
      setSelectedStudent(student);
    }
  };

  const removeFromSeat = (seatKey) => {
    const newSeats = { ...seats };
    delete newSeats[seatKey];
    setSeats(newSeats);
  };

  const autoAssign = () => {
    if (!confirm('自动分配会清除当前座位表，确定继续吗？')) return;

    const newSeats = {};
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    let studentIndex = 0;

    for (let row = 0; row < rows && studentIndex < shuffled.length; row++) {
      for (let col = 0; col < cols && studentIndex < shuffled.length; col++) {
        newSeats[`${row}-${col}`] = shuffled[studentIndex];
        studentIndex++;
      }
    }

    setSeats(newSeats);
  };

  const clearAll = () => {
    if (!confirm('确定要清空座位表吗？')) return;
    setSeats({});
  };

  const getAssignedStudentIds = () => {
    return new Set(Object.values(seats).map(s => s?.id).filter(Boolean));
  };

  const assignedIds = getAssignedStudentIds();
  const unassignedStudents = students.filter(s => !assignedIds.has(s.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">请先创建班级并添加学生</p>
      </div>
    );
  }

  // Fullscreen view
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-gray-800 to-gray-900 z-50 p-8 overflow-auto">
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 text-white hover:text-gray-300"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-8">
          <div className="inline-block px-8 py-2 bg-gray-700 text-white rounded-lg text-xl">
            讲台
          </div>
        </div>

        <div className="flex justify-center">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(80px, 1fr))`,
              maxWidth: `${cols * 100}px`
            }}
          >
            {Array.from({ length: rows * cols }).map((_, index) => {
              const row = Math.floor(index / cols);
              const col = index % cols;
              const seatKey = `${row}-${col}`;
              const student = seats[seatKey];

              return (
                <motion.div
                  key={seatKey}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.01 }}
                  className={`aspect-square rounded-lg flex items-center justify-center text-center p-2 ${
                    student
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {student ? (
                    <span className="text-sm font-medium truncate">{student.name}</span>
                  ) : (
                    <span className="text-xs">空座</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">座位表</h1>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Student List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium text-gray-900 mb-3">
              未分配学生 ({unassignedStudents.length})
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {unassignedStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleStudentClick(student)}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    selectedStudent?.id === student.id
                      ? 'bg-indigo-100 border-2 border-indigo-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium text-sm">{student.name}</div>
                  {student.student_no && (
                    <div className="text-xs text-gray-500">{student.student_no}</div>
                  )}
                </div>
              ))}
              {unassignedStudents.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  所有学生已分配座位
                </p>
              )}
            </div>
            {selectedStudent && (
              <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                <p className="text-sm text-indigo-700">
                  已选中: <strong>{selectedStudent.name}</strong>
                </p>
                <p className="text-xs text-indigo-600 mt-1">点击座位进行分配</p>
              </div>
            )}
          </div>
        </div>

        {/* Seating Chart */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow p-4">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">行数:</label>
                <select
                  value={rows}
                  onChange={(e) => setRows(parseInt(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  {[4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">列数:</label>
                <select
                  value={cols}
                  onChange={(e) => setCols(parseInt(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  {[4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={autoAssign}
                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                自动分配
              </button>
              <button
                onClick={clearAll}
                className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                清空
              </button>
              <button
                onClick={saveSeatingChart}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                保存
              </button>
              <button
                onClick={() => setIsFullscreen(true)}
                className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                全屏展示
              </button>
            </div>

            {/* Podium */}
            <div className="text-center mb-4">
              <div className="inline-block px-6 py-2 bg-gray-200 text-gray-700 rounded text-sm">
                讲台
              </div>
            </div>

            {/* Seats Grid */}
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(60px, 1fr))`
              }}
            >
              {Array.from({ length: rows * cols }).map((_, index) => {
                const row = Math.floor(index / cols);
                const col = index % cols;
                const seatKey = `${row}-${col}`;
                const student = seats[seatKey];

                return (
                  <div
                    key={seatKey}
                    onClick={() => handleSeatClick(row, col)}
                    className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all p-1 ${
                      student
                        ? 'bg-indigo-100 border-indigo-300 hover:bg-indigo-200'
                        : selectedStudent
                        ? 'bg-gray-50 border-dashed border-indigo-300 hover:bg-indigo-50'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {student ? (
                      <>
                        <span className="text-xs font-medium text-gray-900 truncate w-full text-center">
                          {student.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromSeat(seatKey);
                          }}
                          className="mt-1 text-red-500 hover:text-red-700"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {row + 1}-{col + 1}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center space-x-6 mt-4 pt-4 border-t text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-indigo-100 border-2 border-indigo-300 rounded"></div>
                <span>已分配</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-50 border-2 border-gray-200 rounded"></div>
                <span>空座</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
