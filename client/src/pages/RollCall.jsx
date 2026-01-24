import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { classesApi, studentsApi, attendanceApi } from '../services/api';

const ATTENDANCE_STATUS = {
  present: { label: '出勤', color: 'bg-green-500' },
  absent: { label: '缺勤', color: 'bg-red-500' },
  late: { label: '迟到', color: 'bg-yellow-500' },
  leave: { label: '请假', color: 'bg-blue-500' },
};

export const RollCall = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'random';

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(mode === 'quick' ? 'quick' : 'spin');

  // Random roll call state
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [spinningIndex, setSpinningIndex] = useState(0);

  // Bullet screen state
  const [bulletNames, setBulletNames] = useState([]);

  // Group roll call state
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupCount, setGroupCount] = useState(4);

  // Quick roll call state
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      const data = await classesApi.getAll();
      setClasses(data);
      if (data.length > 0) {
        setSelectedClass(data[0].id);
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
      setAttendanceRecords({});
      setCurrentStudentIndex(0);
      setSelectedStudent(null);
      setGroups([]);
      setSelectedGroup(null);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  // Spin animation for random roll call
  const startSpin = () => {
    if (students.length === 0) return;

    setIsSpinning(true);
    setSelectedStudent(null);

    let count = 0;
    const totalSpins = 20 + Math.floor(Math.random() * 10);

    const spinInterval = setInterval(() => {
      setSpinningIndex(Math.floor(Math.random() * students.length));
      count++;

      if (count >= totalSpins) {
        clearInterval(spinInterval);
        const finalIndex = Math.floor(Math.random() * students.length);
        setSpinningIndex(finalIndex);
        setSelectedStudent(students[finalIndex]);
        setIsSpinning(false);
      }
    }, 100 - count * 2);
  };

  // Card flip animation
  const flipCard = () => {
    if (students.length === 0) return;

    setIsSpinning(true);
    setSelectedStudent(null);

    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * students.length);
      setSelectedStudent(students[randomIndex]);
      setIsSpinning(false);
    }, 800);
  };

  // Bullet screen animation
  const startBullet = () => {
    if (students.length === 0) return;

    setIsSpinning(true);
    setSelectedStudent(null);
    setBulletNames([]);

    // Generate random bullet positions
    const bullets = students.map((s, i) => ({
      id: i,
      name: s.name,
      top: Math.random() * 80 + 10,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
    }));
    setBulletNames(bullets);

    // After animation, select random student
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * students.length);
      setSelectedStudent(students[randomIndex]);
      setIsSpinning(false);
      setBulletNames([]);
    }, 4000);
  };

  // Generate random groups
  const generateGroups = () => {
    if (students.length === 0) return;

    const shuffled = [...students].sort(() => Math.random() - 0.5);
    const newGroups = [];
    const groupSize = Math.ceil(shuffled.length / groupCount);

    for (let i = 0; i < groupCount; i++) {
      const groupStudents = shuffled.slice(i * groupSize, (i + 1) * groupSize);
      if (groupStudents.length > 0) {
        newGroups.push({
          id: i + 1,
          name: `第${i + 1}组`,
          students: groupStudents,
        });
      }
    }
    setGroups(newGroups);
    setSelectedGroup(null);
    setSelectedStudent(null);
  };

  // Pick random student from group
  const pickFromGroup = (group) => {
    setSelectedGroup(group);
    setIsSpinning(true);
    setSelectedStudent(null);

    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * group.students.length);
      setSelectedStudent(group.students[randomIndex]);
      setIsSpinning(false);
    }, 1000);
  };

  // Record attendance for selected student
  const recordAttendance = async (status) => {
    if (!selectedStudent) return;

    try {
      await attendanceApi.record(selectedClass, {
        student_id: selectedStudent.id,
        status,
      });
      setAttendanceRecords({
        ...attendanceRecords,
        [selectedStudent.id]: status,
      });
    } catch (error) {
      console.error('Failed to record attendance:', error);
    }
  };

  // Quick roll call - mark attendance for current student
  const markQuickAttendance = async (status) => {
    if (currentStudentIndex >= students.length) return;

    const student = students[currentStudentIndex];
    try {
      await attendanceApi.record(selectedClass, {
        student_id: student.id,
        status,
      });
      setAttendanceRecords({
        ...attendanceRecords,
        [student.id]: status,
      });
      setCurrentStudentIndex(currentStudentIndex + 1);
    } catch (error) {
      console.error('Failed to record attendance:', error);
    }
  };

  // Batch mark all present
  const markAllPresent = async () => {
    try {
      const records = students.map((s) => ({ student_id: s.id, status: 'present' }));
      await attendanceApi.batchRecord(selectedClass, { records });
      const newRecords = {};
      students.forEach((s) => { newRecords[s.id] = 'present'; });
      setAttendanceRecords(newRecords);
    } catch (error) {
      console.error('Failed to batch record:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">点名系统</h1>
        <select
          value={selectedClass || ''}
          onChange={(e) => setSelectedClass(Number(e.target.value))}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
        >
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name} ({cls.student_count}人)
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="bg-gray-100 rounded-xl p-1 inline-flex">
        {[
          { key: 'spin', label: '转盘点名' },
          { key: 'card', label: '抽卡点名' },
          { key: 'bullet', label: '弹幕点名' },
          { key: 'group', label: '分组点名' },
          { key: 'order', label: '按序点名' },
          { key: 'quick', label: '快速签到' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === tab.key
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {students.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-14 text-center">
          <p className="text-gray-500">该班级还没有学生</p>
        </div>
      ) : (
        <>
          {/* Spin Mode */}
          {activeTab === 'spin' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
              <div className="text-center">
                <div className="relative w-72 h-72 mx-auto mb-10">
                  <div className="absolute inset-0 rounded-full border-8 border-purple-200 flex items-center justify-center bg-gradient-to-br from-purple-50 to-white">
                    <AnimatePresence mode="wait">
                      {isSpinning ? (
                        <motion.div
                          key={spinningIndex}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ duration: 0.05 }}
                          className="text-4xl font-bold text-purple-600"
                        >
                          {students[spinningIndex]?.name}
                        </motion.div>
                      ) : selectedStudent ? (
                        <motion.div
                          initial={{ scale: 1.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-center"
                        >
                          <div className="text-4xl font-bold text-purple-600 mb-2">
                            {selectedStudent.name}
                          </div>
                          <div className="text-gray-500">
                            {selectedStudent.student_no && `学号: ${selectedStudent.student_no}`}
                          </div>
                        </motion.div>
                      ) : (
                        <div className="text-gray-400 text-xl">点击开始</div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <button
                  onClick={startSpin}
                  disabled={isSpinning}
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-lg font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {isSpinning ? '抽取中...' : '开始抽取'}
                </button>

                {selectedStudent && !isSpinning && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8"
                  >
                    <p className="text-gray-600 mb-4">记录出勤状态：</p>
                    <div className="flex justify-center space-x-3">
                      {Object.entries(ATTENDANCE_STATUS).map(([key, { label, color }]) => (
                        <button
                          key={key}
                          onClick={() => recordAttendance(key)}
                          className={`px-4 py-2 rounded-xl text-white ${color} hover:opacity-80 ${
                            attendanceRecords[selectedStudent.id] === key ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* Card Mode */}
          {activeTab === 'card' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
              <div className="text-center">
                <div className="relative w-48 h-64 mx-auto mb-8 perspective-1000">
                  <motion.div
                    className="w-full h-full"
                    animate={{ rotateY: isSpinning ? 180 : 0 }}
                    transition={{ duration: 0.8 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Card Front */}
                    <div
                      className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center backface-hidden"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="text-white text-6xl">?</div>
                    </div>
                    {/* Card Back */}
                    <div
                      className="absolute inset-0 rounded-xl bg-white border-4 border-purple-200 flex items-center justify-center"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      {selectedStudent ? (
                        <div className="text-center p-4">
                          <div className="text-3xl font-bold text-purple-600 mb-2">
                            {selectedStudent.name}
                          </div>
                          <div className="text-gray-500 text-sm">
                            {selectedStudent.student_no && `学号: ${selectedStudent.student_no}`}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400">等待抽取</div>
                      )}
                    </div>
                  </motion.div>
                </div>
                <button
                  onClick={flipCard}
                  disabled={isSpinning}
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-lg font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {isSpinning ? '翻牌中...' : '翻牌抽取'}
                </button>

                {selectedStudent && !isSpinning && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8"
                  >
                    <p className="text-gray-600 mb-4">记录出勤状态：</p>
                    <div className="flex justify-center space-x-3">
                      {Object.entries(ATTENDANCE_STATUS).map(([key, { label, color }]) => (
                        <button
                          key={key}
                          onClick={() => recordAttendance(key)}
                          className={`px-4 py-2 rounded-xl text-white ${color} hover:opacity-80 ${
                            attendanceRecords[selectedStudent.id] === key ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* Bullet Screen Mode */}
          {activeTab === 'bullet' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
              <div className="text-center">
                <div className="relative w-full h-64 mx-auto mb-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden">
                  {isSpinning && bulletNames.map((bullet) => (
                    <motion.div
                      key={bullet.id}
                      initial={{ x: '100%' }}
                      animate={{ x: '-100%' }}
                      transition={{
                        duration: bullet.duration,
                        delay: bullet.delay,
                        ease: 'linear',
                      }}
                      className="absolute text-2xl font-bold text-white whitespace-nowrap"
                      style={{ top: `${bullet.top}%` }}
                    >
                      {bullet.name}
                    </motion.div>
                  ))}
                  {!isSpinning && selectedStudent && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="text-center">
                        <div className="text-5xl font-bold text-yellow-400 mb-2">
                          {selectedStudent.name}
                        </div>
                        <div className="text-gray-300">
                          {selectedStudent.student_no && `学号: ${selectedStudent.student_no}`}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {!isSpinning && !selectedStudent && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-gray-500 text-xl">点击开始弹幕点名</div>
                    </div>
                  )}
                </div>
                <button
                  onClick={startBullet}
                  disabled={isSpinning}
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-lg font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {isSpinning ? '抽取中...' : '开始弹幕'}
                </button>

                {selectedStudent && !isSpinning && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8"
                  >
                    <p className="text-gray-600 mb-4">记录出勤状态：</p>
                    <div className="flex justify-center space-x-3">
                      {Object.entries(ATTENDANCE_STATUS).map(([key, { label, color }]) => (
                        <button
                          key={key}
                          onClick={() => recordAttendance(key)}
                          className={`px-4 py-2 rounded-xl text-white ${color} hover:opacity-80 ${
                            attendanceRecords[selectedStudent.id] === key ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* Group Mode */}
          {activeTab === 'group' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
              <div className="mb-6 flex items-center justify-center space-x-4">
                <span className="text-gray-600">分组数量：</span>
                <select
                  value={groupCount}
                  onChange={(e) => setGroupCount(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-xl"
                >
                  {[2, 3, 4, 5, 6, 8].map((n) => (
                    <option key={n} value={n}>{n}组</option>
                  ))}
                </select>
                <button
                  onClick={generateGroups}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90"
                >
                  随机分组
                </button>
              </div>

              {groups.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedGroup?.id === group.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                      onClick={() => pickFromGroup(group)}
                    >
                      <div className="font-semibold text-gray-900 mb-2">{group.name}</div>
                      <div className="text-sm text-gray-500 mb-2">{group.students.length}人</div>
                      <div className="flex flex-wrap gap-1">
                        {group.students.map((s) => (
                          <span
                            key={s.id}
                            className={`px-2 py-0.5 text-xs rounded ${
                              selectedStudent?.id === s.id
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  点击"随机分组"按钮生成小组
                </div>
              )}

              {selectedStudent && !isSpinning && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold text-purple-600 mb-4">
                    {selectedGroup?.name}：{selectedStudent.name}
                  </div>
                  <p className="text-gray-600 mb-4">记录出勤状态：</p>
                  <div className="flex justify-center space-x-3">
                    {Object.entries(ATTENDANCE_STATUS).map(([key, { label, color }]) => (
                      <button
                        key={key}
                        onClick={() => recordAttendance(key)}
                        className={`px-4 py-2 rounded-xl text-white ${color} hover:opacity-80 ${
                          attendanceRecords[selectedStudent.id] === key ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Order Mode */}
          {activeTab === 'order' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
              <div className="text-center mb-8">
                <p className="text-gray-600 mb-2">
                  当前学生（{currentStudentIndex + 1}/{students.length}）
                </p>
                {currentStudentIndex < students.length ? (
                  <motion.div
                    key={currentStudentIndex}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="py-8"
                  >
                    <div className="text-5xl font-bold text-purple-600 mb-2">
                      {students[currentStudentIndex].name}
                    </div>
                    <div className="text-gray-500">
                      {students[currentStudentIndex].student_no &&
                        `学号: ${students[currentStudentIndex].student_no}`}
                    </div>
                  </motion.div>
                ) : (
                  <div className="py-8">
                    <div className="text-2xl text-green-600 mb-2">点名完成！</div>
                    <button
                      onClick={() => setCurrentStudentIndex(0)}
                      className="text-purple-600 hover:text-indigo-500"
                    >
                      重新开始
                    </button>
                  </div>
                )}
              </div>

              {currentStudentIndex < students.length && (
                <div className="flex justify-center space-x-3">
                  {Object.entries(ATTENDANCE_STATUS).map(([key, { label, color }]) => (
                    <button
                      key={key}
                      onClick={() => markQuickAttendance(key)}
                      className={`px-6 py-3 rounded-xl text-white text-lg ${color} hover:opacity-80`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-8 flex justify-center space-x-4">
                <button
                  onClick={() => setCurrentStudentIndex(Math.max(0, currentStudentIndex - 1))}
                  disabled={currentStudentIndex === 0}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  上一个
                </button>
                <button
                  onClick={() => setCurrentStudentIndex(Math.min(students.length, currentStudentIndex + 1))}
                  disabled={currentStudentIndex >= students.length}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  跳过
                </button>
              </div>
            </div>
          )}

          {/* Quick Mode */}
          {activeTab === 'quick' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <span className="text-gray-600">
                  已签到：{Object.keys(attendanceRecords).length}/{students.length}
                </span>
                <button
                  onClick={markAllPresent}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
                >
                  全部出勤
                </button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {students.map((student) => {
                    const status = attendanceRecords[student.id];
                    return (
                      <div
                        key={student.id}
                        className={`relative p-3 rounded-lg border-2 transition-all ${
                          status
                            ? `border-transparent ${ATTENDANCE_STATUS[status].color} bg-opacity-10`
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-medium text-gray-900 mb-1">{student.name}</div>
                          {student.student_no && (
                            <div className="text-xs text-gray-500">{student.student_no}</div>
                          )}
                        </div>
                        <div className="mt-2 flex justify-center space-x-1">
                          {Object.entries(ATTENDANCE_STATUS).map(([key, { label, color }]) => (
                            <button
                              key={key}
                              onClick={async () => {
                                try {
                                  await attendanceApi.record(selectedClass, {
                                    student_id: student.id,
                                    status: key,
                                  });
                                  setAttendanceRecords({
                                    ...attendanceRecords,
                                    [student.id]: key,
                                  });
                                } catch (error) {
                                  console.error('Failed to record:', error);
                                }
                              }}
                              className={`w-6 h-6 rounded text-xs text-white ${color} ${
                                status === key ? 'ring-2 ring-offset-1 ring-gray-400' : 'opacity-60 hover:opacity-100'
                              }`}
                              title={label}
                            >
                              {label[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Legend */}
      <div className="flex justify-center space-x-6 text-sm">
        {Object.entries(ATTENDANCE_STATUS).map(([key, { label, color }]) => (
          <div key={key} className="flex items-center">
            <span className={`w-3 h-3 rounded-full ${color} mr-2`}></span>
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
