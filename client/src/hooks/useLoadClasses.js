import { useState, useEffect, useCallback } from 'react';
import { classesApi } from '../services/api';

/**
 * Hook for loading and managing class data
 * Reusable across multiple pages that need class list
 */
export const useLoadClasses = (options = {}) => {
  const { autoLoad = true, status = null } = options;

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await classesApi.getAll(status);
      setClasses(data);
      // Auto-select first class if none selected
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].id);
      }
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Failed to load classes:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [status, selectedClassId]);

  useEffect(() => {
    if (autoLoad) {
      loadClasses();
    }
  }, [autoLoad]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectClass = useCallback((classId) => {
    setSelectedClassId(classId);
  }, []);

  const selectedClass = classes.find(c => c.id === selectedClassId) || null;

  // Filter helpers
  const activeClasses = classes.filter(c => c.status !== 'archived');
  const archivedClasses = classes.filter(c => c.status === 'archived');

  return {
    classes,
    activeClasses,
    archivedClasses,
    loading,
    error,
    selectedClassId,
    selectedClass,
    selectClass,
    reload: loadClasses
  };
};
