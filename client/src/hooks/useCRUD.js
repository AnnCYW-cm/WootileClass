import { useState, useCallback } from 'react';

/**
 * Generic CRUD operations hook
 * Provides standardized create, read, update, delete operations with state management
 */
export const useCRUD = (api, options = {}) => {
  const {
    idField = 'id',
    onSuccess = null,
    onError = null
  } = options;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleError = useCallback((err) => {
    const message = err.message || '操作失败';
    setError(message);
    if (onError) onError(message);
    return message;
  }, [onError]);

  const handleSuccess = useCallback((data, action) => {
    setError(null);
    if (onSuccess) onSuccess(data, action);
    return data;
  }, [onSuccess]);

  const fetchAll = useCallback(async (...args) => {
    if (!api.getAll) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAll(...args);
      setItems(data);
      return handleSuccess(data, 'fetch');
    } catch (err) {
      handleError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [api, handleSuccess, handleError]);

  const fetchOne = useCallback(async (id) => {
    if (!api.get) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(id);
      return handleSuccess(data, 'fetchOne');
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, handleSuccess, handleError]);

  const create = useCallback(async (data) => {
    if (!api.create) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.create(data);
      setItems(prev => [...prev, result]);
      return handleSuccess(result, 'create');
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [api, handleSuccess, handleError]);

  const update = useCallback(async (id, data) => {
    if (!api.update) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.update(id, data);
      setItems(prev => prev.map(item =>
        item[idField] === id ? result : item
      ));
      return handleSuccess(result, 'update');
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [api, idField, handleSuccess, handleError]);

  const remove = useCallback(async (id) => {
    if (!api.delete) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.delete(id);
      setItems(prev => prev.filter(item => item[idField] !== id));
      return handleSuccess(id, 'delete');
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [api, idField, handleSuccess, handleError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    items,
    setItems,
    loading,
    submitting,
    error,
    fetchAll,
    fetchOne,
    create,
    update,
    remove,
    clearError
  };
};
