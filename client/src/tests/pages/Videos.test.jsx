import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Videos } from '../../pages/Videos';
import { ToastProvider } from '../../store/ToastContext';
import * as api from '../../services/api';

// Mock API
vi.mock('../../services/api', () => ({
  videosApi: {
    getAll: vi.fn(),
    delete: vi.fn(),
    publish: vi.fn(),
    unpublish: vi.fn(),
    getStorageUsage: vi.fn()
  }
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const mockVideos = [
  {
    id: 1,
    title: '数学第一课',
    description: '加法入门',
    grade: '一年级',
    subject: '数学',
    status: 'published',
    share_code: 'ABC123',
    view_count: 100,
    created_at: '2026-01-01'
  },
  {
    id: 2,
    title: '数学第二课',
    description: '减法入门',
    grade: '一年级',
    subject: '数学',
    status: 'draft',
    share_code: null,
    view_count: 0,
    created_at: '2026-01-02'
  }
];

const mockStorageUsage = {
  videoCount: 2,
  totalSizeMB: 50,
  limits: {
    maxVideoCount: 10,
    maxVideoStorageMB: 500,
    unlimited: false
  }
};

const renderVideos = () => {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <Videos />
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('Videos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.videosApi.getAll.mockResolvedValue(mockVideos);
    api.videosApi.getStorageUsage.mockResolvedValue(mockStorageUsage);
  });

  it('should render videos page with title', async () => {
    renderVideos();

    await waitFor(() => {
      expect(screen.getByText('我的视频')).toBeInTheDocument();
    });
  });

  it('should load and display videos', async () => {
    renderVideos();

    await waitFor(() => {
      expect(screen.getByText('数学第一课')).toBeInTheDocument();
      expect(screen.getByText('数学第二课')).toBeInTheDocument();
    });
  });

  it('should show upload button', async () => {
    renderVideos();

    await waitFor(() => {
      expect(screen.getByText('上传视频')).toBeInTheDocument();
    });
  });

  it('should show empty state when no videos', async () => {
    api.videosApi.getAll.mockResolvedValueOnce([]);

    renderVideos();

    await waitFor(() => {
      expect(screen.getByText(/还没有视频/)).toBeInTheDocument();
    });
  });

  it('should call getAll API on mount', async () => {
    renderVideos();

    await waitFor(() => {
      expect(api.videosApi.getAll).toHaveBeenCalled();
    });
  });

  it('should call getStorageUsage API on mount', async () => {
    renderVideos();

    await waitFor(() => {
      expect(api.videosApi.getStorageUsage).toHaveBeenCalled();
    });
  });
});
