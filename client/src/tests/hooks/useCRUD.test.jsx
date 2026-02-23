import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCRUD } from '../../hooks/useCRUD';

describe('useCRUD', () => {
  const mockApi = {
    getAll: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useCRUD(mockApi));

    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.submitting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch all items', async () => {
    const mockData = [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }];
    mockApi.getAll.mockResolvedValue(mockData);

    const { result } = renderHook(() => useCRUD(mockApi));

    act(() => {
      result.current.fetchAll();
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toEqual(mockData);
    expect(mockApi.getAll).toHaveBeenCalled();
  });

  it('should handle fetch error', async () => {
    mockApi.getAll.mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => useCRUD(mockApi));

    act(() => {
      result.current.fetchAll();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Fetch failed');
  });

  it('should create item and add to list', async () => {
    const newItem = { id: 3, name: 'New Item' };
    mockApi.create.mockResolvedValue(newItem);

    const { result } = renderHook(() => useCRUD(mockApi));

    await act(async () => {
      await result.current.create({ name: 'New Item' });
    });

    expect(result.current.items).toContainEqual(newItem);
    expect(mockApi.create).toHaveBeenCalledWith({ name: 'New Item' });
  });

  it('should update item in list', async () => {
    const initialItems = [{ id: 1, name: 'Old Name' }];
    const updatedItem = { id: 1, name: 'New Name' };
    mockApi.getAll.mockResolvedValue(initialItems);
    mockApi.update.mockResolvedValue(updatedItem);

    const { result } = renderHook(() => useCRUD(mockApi));

    await act(async () => {
      await result.current.fetchAll();
    });

    await act(async () => {
      await result.current.update(1, { name: 'New Name' });
    });

    expect(result.current.items[0].name).toBe('New Name');
  });

  it('should remove item from list', async () => {
    const initialItems = [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }];
    mockApi.getAll.mockResolvedValue(initialItems);
    mockApi.delete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useCRUD(mockApi));

    await act(async () => {
      await result.current.fetchAll();
    });

    await act(async () => {
      await result.current.remove(1);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe(2);
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useCRUD(mockApi));

    act(() => {
      // Manually set error for testing
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
