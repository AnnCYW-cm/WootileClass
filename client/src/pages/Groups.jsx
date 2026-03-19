import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { classesApi, studentsApi } from '../services/api';
import { useToastContext } from '../store/ToastContext';

export const Groups = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('random'); // random or saved
  const [groupCount, setGroupCount] = useState(4);
  const [isAnimating, setIsAnimating] = useState(false);
  const [savedGroups, setSavedGroups] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const toast = useToastContext();

  useEffect(() => {
    loadClasses();
    loadSavedGroups();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
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

  const loadSavedGroups = () => {
    const saved = localStorage.getItem('savedGroups');
    if (saved) {
      setSavedGroups(JSON.parse(saved));
    }
  };

  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const generateGroups = async () => {
    if (students.length === 0) {
      toast.warning('班级中没有学生');
      return;
    }

    setIsAnimating(true);

    // Shuffle animation
    const shuffledStudents = shuffleArray(students);
    const newGroups = [];
    const studentsPerGroup = Math.ceil(shuffledStudents.length / groupCount);

    for (let i = 0; i < groupCount; i++) {
      const start = i * studentsPerGroup;
      const end = start + studentsPerGroup;
      const groupStudents = shuffledStudents.slice(start, end);
      if (groupStudents.length > 0) {
        newGroups.push({
          id: i + 1,
          name: `第${i + 1}组`,
          students: groupStudents,
          color: getGroupColor(i)
        });
      }
    }

    // Delayed reveal for animation effect
    setTimeout(() => {
      setGroups(newGroups);
      setIsAnimating(false);
    }, 1000);
  };

  const getGroupColor = (index) => {
    const colors = [
      'bg-red-100 border-red-300',
      'bg-blue-100 border-blue-300',
      'bg-green-100 border-green-300',
      'bg-yellow-100 border-yellow-300',
      'bg-purple-100 border-purple-300',
      'bg-pink-100 border-pink-300',
      'bg-indigo-100 border-indigo-300',
      'bg-orange-100 border-orange-300',
    ];
    return colors[index % colors.length];
  };

  const saveCurrentGroups = () => {
    if (groups.length === 0) {
      toast.warning('请先生成分组');
      return;
    }
    setShowSaveModal(true);
  };

  const handleSaveGroups = () => {
    if (!groupName.trim()) {
      toast.warning('请输入分组名称');
      return;
    }

    const newSavedGroup = {
      id: Date.now(),
      name: groupName,
      classId: selectedClass,
      className: classes.find(c => c.id == selectedClass)?.name || '',
      groups: groups,
      createdAt: new Date().toISOString()
    };

    const updated = [...savedGroups, newSavedGroup];
    setSavedGroups(updated);
    localStorage.setItem('savedGroups', JSON.stringify(updated));
    setShowSaveModal(false);
    setGroupName('');
  };

  const loadSavedGroup = (savedGroup) => {
    setGroups(savedGroup.groups);
    setSelectedClass(savedGroup.classId);
  };

  const deleteSavedGroup = (id) => {
    if (!confirm('确定要删除这个保存的分组吗？')) return;
    const updated = savedGroups.filter(g => g.id !== id);
    setSavedGroups(updated);
    localStorage.setItem('savedGroups', JSON.stringify(updated));
  };

  const pickRandomFromGroup = (group) => {
    if (group.students.length === 0) return;
    const randomStudent = group.students[Math.floor(Math.random() * group.students.length)];
    toast.success(`抽中: ${randomStudent.name}`);
  };

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">分组工具</h1>
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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('random')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'random'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            随机分组
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'saved'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            保存的分组 ({savedGroups.length})
          </button>
        </nav>
      </div>

      {/* Random Grouping Tab */}
      {activeTab === 'random' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">分组数量:</label>
              <select
                value={groupCount}
                onChange={(e) => setGroupCount(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                {[2, 3, 4, 5, 6, 7, 8].map(n => (
                  <option key={n} value={n}>{n}组</option>
                ))}
              </select>
            </div>
            <button
              onClick={generateGroups}
              disabled={isAnimating}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 flex items-center"
            >
              {isAnimating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  分组中...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  随机分组
                </>
              )}
            </button>
            {groups.length > 0 && (
              <button
                onClick={saveCurrentGroups}
                className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-50"
              >
                保存分组
              </button>
            )}
          </div>

          {/* Student Count Info */}
          <div className="text-sm text-gray-500">
            班级共 {students.length} 名学生，分成 {groupCount} 组，每组约 {Math.ceil(students.length / groupCount)} 人
          </div>

          {/* Groups Display */}
          <AnimatePresence>
            {groups.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {groups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`rounded-lg border-2 ${group.color} p-4`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-lg">{group.name}</h3>
                      <span className="text-sm text-gray-500">{group.students.length}人</span>
                    </div>
                    <div className="space-y-2">
                      {group.students.map((student) => (
                        <div
                          key={student.id}
                          className="bg-white rounded px-3 py-2 text-sm"
                        >
                          {student.name}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => pickRandomFromGroup(group)}
                      className="mt-3 w-full py-2 text-sm bg-white rounded border hover:bg-gray-50"
                    >
                      从该组抽人
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {groups.length === 0 && !isAnimating && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">点击"随机分组"开始</h3>
              <p className="mt-1 text-sm text-gray-500">系统会随机将学生分配到各组</p>
            </div>
          )}
        </div>
      )}

      {/* Saved Groups Tab */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {savedGroups.length > 0 ? (
            savedGroups.map((saved) => (
              <div key={saved.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{saved.name}</h3>
                    <p className="text-sm text-gray-500">
                      {saved.className} · {saved.groups.length}组 · {new Date(saved.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => loadSavedGroup(saved)}
                      className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      加载
                    </button>
                    <button
                      onClick={() => deleteSavedGroup(saved.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      删除
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {saved.groups.map((group) => (
                    <span key={group.id} className={`px-2 py-1 rounded text-sm ${group.color}`}>
                      {group.name}: {group.students.length}人
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">暂无保存的分组</p>
              <p className="text-sm text-gray-400 mt-1">随机分组后可以保存供下次使用</p>
            </div>
          )}
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">保存分组</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">分组名称</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="例如：小组讨论分组"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSaveGroups}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
