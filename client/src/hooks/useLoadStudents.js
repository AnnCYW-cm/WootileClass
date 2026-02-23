import { useState, useEffect, useCallback } from 'react';
import { studentsApi } from '../services/api';

/**
 * Hook for loading and managing student data
 * Reusable across pages that need student list for a class
 */
export const useLoadStudents = (classId, options = {}) => {
  const { autoLoad = true } = options;

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadStudents = useCallback(async () => {
    if (!classId) {
      setStudents([]);
      return [];
    }

    setLoading(true);
    setError(null);
    try {
      const data = await studentsApi.getByClass(classId);
      setStudents(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Failed to load students:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (autoLoad && classId) {
      loadStudents();
    }
  }, [classId, autoLoad]); // eslint-disable-line react-hooks/exhaustive-deps

  const addStudent = async (studentData) => {
    const newStudent = await studentsApi.add(classId, studentData);
    setStudents(prev => [...prev, newStudent]);
    return newStudent;
  };

  const updateStudent = async (studentId, studentData) => {
    const updated = await studentsApi.update(studentId, studentData);
    setStudents(prev => prev.map(s => s.id === studentId ? updated : s));
    return updated;
  };

  const deleteStudent = async (studentId) => {
    await studentsApi.delete(studentId);
    setStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const importStudents = async (file) => {
    const result = await studentsApi.import(classId, file);
    await loadStudents(); // Reload to get all students
    return result;
  };

  return {
    students,
    loading,
    error,
    reload: loadStudents,
    addStudent,
    updateStudent,
    deleteStudent,
    importStudents
  };
};
