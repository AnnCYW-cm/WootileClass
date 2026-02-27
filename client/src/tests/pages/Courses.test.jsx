import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Courses } from '../../pages/Courses';
import * as api from '../../services/api';

// Mock API
vi.mock('../../services/api', () => ({
  coursesApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    publish: vi.fn(),
    unpublish: vi.fn()
  },
  membershipApi: {
    getUsage: vi.fn()
  }
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const mockCourses = [
  {
    id: 1,
    title: '小学数学基础',
    description: '适合一年级学生的数学入门课程',
    subject: '数学',
    status: 'published',
    share_code: 'MATH01',
    section_count: 5,
    animation_count: 10,
    view_count: 100,
    canPlay: true,
    isPremiumOnly: false,
    created_at: '2026-01-01'
  },
  {
    id: 2,
    title: '物理入门',
    description: '初中物理基础课程',
    subject: '物理',
    status: 'draft',
    share_code: null,
    section_count: 3,
    animation_count: 6,
    view_count: 0,
    canPlay: true,
    isPremiumOnly: false,
    created_at: '2026-01-02'
  }
];

const renderCourses = () => {
  return render(
    <MemoryRouter>
      <Courses />
    </MemoryRouter>
  );
};

describe('Courses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.coursesApi.getAll.mockResolvedValue(mockCourses);
    api.membershipApi.getUsage.mockResolvedValue({
      isPremium: false,
      usage: {
        courses: { current: 2, limit: 10, unlimited: false },
        videos: { current: 5, limit: 50, unlimited: false }
      }
    });
  });

  it('should render courses page with title', async () => {
    renderCourses();

    await waitFor(() => {
      expect(screen.getByText('课程动画')).toBeInTheDocument();
    });
  });

  it('should load and display courses', async () => {
    renderCourses();

    await waitFor(() => {
      expect(screen.getByText('小学数学基础')).toBeInTheDocument();
      expect(screen.getByText('物理入门')).toBeInTheDocument();
    });
  });

  it('should show create button', async () => {
    renderCourses();

    await waitFor(() => {
      expect(screen.getByText('创建课程')).toBeInTheDocument();
    });
  });

  it('should show course statistics', async () => {
    renderCourses();

    await waitFor(() => {
      expect(screen.getByText(/5 章节/)).toBeInTheDocument();
      expect(screen.getByText(/10 动画/)).toBeInTheDocument();
    });
  });

  it('should show empty state when no courses', async () => {
    api.coursesApi.getAll.mockResolvedValueOnce([]);

    renderCourses();

    await waitFor(() => {
      expect(screen.getByText(/还没有课程/)).toBeInTheDocument();
    });
  });

  it('should call getAll API on mount', async () => {
    renderCourses();

    await waitFor(() => {
      expect(api.coursesApi.getAll).toHaveBeenCalled();
    });
  });
});
