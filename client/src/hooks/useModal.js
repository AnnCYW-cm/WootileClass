import { useState, useCallback } from 'react';

/**
 * Hook for managing modal state
 * Handles open/close state, editing item, and form data
 */
export const useModal = (initialFormData = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState('');

  const open = useCallback((item = null, customFormData = null) => {
    if (item) {
      setEditingItem(item);
      // Populate form with item data if editing
      setFormData(customFormData || item);
    } else {
      setEditingItem(null);
      setFormData(initialFormData);
    }
    setError('');
    setIsOpen(true);
  }, [initialFormData]);

  const close = useCallback(() => {
    setIsOpen(false);
    setEditingItem(null);
    setFormData(initialFormData);
    setError('');
  }, [initialFormData]);

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateFields = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setError('');
  }, [initialFormData]);

  const isEditing = editingItem !== null;

  return {
    isOpen,
    editingItem,
    formData,
    error,
    isEditing,
    open,
    close,
    setFormData,
    updateField,
    updateFields,
    resetForm,
    setError
  };
};

/**
 * Hook for managing multiple modals
 * Useful when a page has several different modals
 */
export const useMultiModal = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState({});

  const openModal = useCallback((modalName, data = {}) => {
    setActiveModal(modalName);
    setModalData(data);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalData({});
  }, []);

  const isModalOpen = useCallback((modalName) => {
    return activeModal === modalName;
  }, [activeModal]);

  return {
    activeModal,
    modalData,
    openModal,
    closeModal,
    isModalOpen
  };
};
