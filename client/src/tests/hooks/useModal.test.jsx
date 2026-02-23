import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModal } from '../../hooks/useModal';

describe('useModal', () => {
  const initialFormData = { name: '', email: '' };

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useModal(initialFormData));

    expect(result.current.isOpen).toBe(false);
    expect(result.current.editingItem).toBeNull();
    expect(result.current.formData).toEqual(initialFormData);
    expect(result.current.error).toBe('');
    expect(result.current.isEditing).toBe(false);
  });

  it('should open modal for creating new item', () => {
    const { result } = renderHook(() => useModal(initialFormData));

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.editingItem).toBeNull();
    expect(result.current.isEditing).toBe(false);
  });

  it('should open modal for editing existing item', () => {
    const { result } = renderHook(() => useModal(initialFormData));
    const existingItem = { id: 1, name: 'Test', email: 'test@example.com' };

    act(() => {
      result.current.open(existingItem);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.editingItem).toEqual(existingItem);
    expect(result.current.isEditing).toBe(true);
    expect(result.current.formData).toEqual(existingItem);
  });

  it('should close modal and reset state', () => {
    const { result } = renderHook(() => useModal(initialFormData));

    act(() => {
      result.current.open({ id: 1, name: 'Test' });
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.editingItem).toBeNull();
    expect(result.current.formData).toEqual(initialFormData);
  });

  it('should update single field', () => {
    const { result } = renderHook(() => useModal(initialFormData));

    act(() => {
      result.current.open();
      result.current.updateField('name', 'New Name');
    });

    expect(result.current.formData.name).toBe('New Name');
    expect(result.current.formData.email).toBe('');
  });

  it('should update multiple fields', () => {
    const { result } = renderHook(() => useModal(initialFormData));

    act(() => {
      result.current.open();
      result.current.updateFields({ name: 'New Name', email: 'new@example.com' });
    });

    expect(result.current.formData.name).toBe('New Name');
    expect(result.current.formData.email).toBe('new@example.com');
  });

  it('should set and clear error', () => {
    const { result } = renderHook(() => useModal(initialFormData));

    act(() => {
      result.current.setError('Test error');
    });

    expect(result.current.error).toBe('Test error');

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.error).toBe('');
  });
});
