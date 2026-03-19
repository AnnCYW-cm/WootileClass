import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Courses } from '../../pages/Courses';
import * as api from '../../services/api';

// Mock API
vi.mock('../../services/api', () => ({
  coursesApi: {
    getAll: vi.fn(),
  },
  membershipApi: {
    getUsage: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockCourses = [
  {
    id: 1,
    title: '小学数学基础',
    description: '适合一年级学生的数学入门课程',
    subject: '数学',
    grade: '一年级',
    section_count: 5,
    animation_count: 10,
    canPlay: true,
  },
  {
    id: 2,
    title: '一年级语文启蒙',
    description: '语文基础课程',
    subject: '语文',
    grade: '一年级',
    section_count: 3,
    animation_count: 6,
    canPlay: true,
  },
  {
    id: 3,
    title: '初二物理入门',
    description: '初中物理基础课程',
    subject: '物理',
    grade: '初二',
    section_count: 4,
    animation_count: 8,
    canPlay: true,
  },
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
        videos: { current: 5, limit: 50, unlimited: false },
      },
    });
  });

  it('should render page title', async () => {
    renderCourses();

    await waitFor(() => {
      expect(screen.getByText('课程动画')).toBeInTheDocument();
    });
  });

  it('should call getAll API on mount', async () => {
    renderCourses();

    await waitFor(() => {
      expect(api.coursesApi.getAll).toHaveBeenCalled();
    });
  });

  it('should show loading skeletons while fetching', () => {
    // Keep the promise pending
    api.coursesApi.getAll.mockReturnValue(new Promise(() => {}));
    renderCourses();

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  describe('Grade Picker View', () => {
    it('should render grade groups (小学/初中/高中)', async () => {
      renderCourses();

      await waitFor(() => {
        expect(screen.getByText('小学')).toBeInTheDocument();
        expect(screen.getByText('初中')).toBeInTheDocument();
        expect(screen.getByText('高中')).toBeInTheDocument();
      });
    });

    it('should render all grade buttons', async () => {
      renderCourses();

      await waitFor(() => {
        expect(screen.getByText('一年级')).toBeInTheDocument();
        expect(screen.getByText('六年级')).toBeInTheDocument();
        expect(screen.getByText('初一')).toBeInTheDocument();
        expect(screen.getByText('初三')).toBeInTheDocument();
        expect(screen.getByText('高一')).toBeInTheDocument();
        expect(screen.getByText('高三')).toBeInTheDocument();
      });
    });

    it('should show course count on grade cards that have courses', async () => {
      renderCourses();

      await waitFor(() => {
        // 一年级 has 2 courses in mockCourses
        expect(screen.getByText('2 个课程')).toBeInTheDocument();
        // 初二 has 1 course
        expect(screen.getByText('1 个课程')).toBeInTheDocument();
      });
    });

    it('should show 即将上线 for grades with no courses', async () => {
      renderCourses();

      await waitFor(() => {
        const comingSoonElements = screen.getAllByText('即将上线');
        // Most grades have 0 courses, so there should be multiple
        expect(comingSoonElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Course List View (after selecting a grade)', () => {
    it('should show course list when a grade is clicked', async () => {
      const user = userEvent.setup();
      renderCourses();

      await waitFor(() => {
        expect(screen.getByText('一年级')).toBeInTheDocument();
      });

      await user.click(screen.getByText('一年级'));

      await waitFor(() => {
        expect(screen.getByText('小学数学基础')).toBeInTheDocument();
        expect(screen.getByText('一年级语文启蒙')).toBeInTheDocument();
      });

      // Should NOT show courses from other grades
      expect(screen.queryByText('初二物理入门')).not.toBeInTheDocument();
    });

    it('should show breadcrumb with selected grade', async () => {
      const user = userEvent.setup();
      renderCourses();

      await waitFor(() => {
        expect(screen.getByText('一年级')).toBeInTheDocument();
      });

      await user.click(screen.getByText('一年级'));

      await waitFor(() => {
        expect(screen.getByText('一年级 · 课程动画')).toBeInTheDocument();
      });
    });

    it('should show subject tags on course cards', async () => {
      const user = userEvent.setup();
      renderCourses();

      await waitFor(() => {
        expect(screen.getByText('一年级')).toBeInTheDocument();
      });

      await user.click(screen.getByText('一年级'));

      await waitFor(() => {
        // 数学 appears both in filter dropdown and as tag; 语文 likewise
        expect(screen.getAllByText('数学').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('语文').length).toBeGreaterThanOrEqual(1);
      });

      // Verify the tags specifically exist (with the tag class)
      const subjectTags = document.querySelectorAll('.bg-purple-50.text-purple-600');
      const tagTexts = Array.from(subjectTags).map((el) => el.textContent);
      expect(tagTexts).toContain('数学');
      expect(tagTexts).toContain('语文');
    });

    it('should filter courses by subject', async () => {
      const user = userEvent.setup();
      renderCourses();

      await waitFor(() => {
        expect(screen.getByText('一年级')).toBeInTheDocument();
      });

      await user.click(screen.getByText('一年级'));

      await waitFor(() => {
        expect(screen.getByText('小学数学基础')).toBeInTheDocument();
      });

      // Select 数学 subject filter
      const select = screen.getByDisplayValue('全部科目');
      await user.selectOptions(select, '数学');

      // Should only show 数学 courses
      expect(screen.getByText('小学数学基础')).toBeInTheDocument();
      expect(screen.queryByText('一年级语文启蒙')).not.toBeInTheDocument();
    });

    it('should navigate to play page when clicking a course card', async () => {
      const user = userEvent.setup();
      renderCourses();

      await waitFor(() => {
        expect(screen.getByText('一年级')).toBeInTheDocument();
      });

      await user.click(screen.getByText('一年级'));

      await waitFor(() => {
        expect(screen.getByText('小学数学基础')).toBeInTheDocument();
      });

      await user.click(screen.getByText('小学数学基础'));

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/courses/1/play');
    });

    it('should show empty state with 即将上线 when grade has no courses', async () => {
      const user = userEvent.setup();
      renderCourses();

      await waitFor(() => {
        expect(screen.getByText('高一')).toBeInTheDocument();
      });

      await user.click(screen.getByText('高一'));

      await waitFor(() => {
        expect(screen.getByText('高一的课程即将上线')).toBeInTheDocument();
        expect(screen.getByText('我们正在为该年级准备精选课程动画，敬请期待')).toBeInTheDocument();
      });
    });

    it('should go back to grade picker when back button is clicked', async () => {
      const user = userEvent.setup();
      renderCourses();

      await waitFor(() => {
        expect(screen.getByText('一年级')).toBeInTheDocument();
      });

      await user.click(screen.getByText('一年级'));

      await waitFor(() => {
        expect(screen.getByText('一年级 · 课程动画')).toBeInTheDocument();
      });

      // Click the back button (has title="返回年级选择")
      const backButton = screen.getByTitle('返回年级选择');
      await user.click(backButton);

      await waitFor(() => {
        // Should be back on grade picker - grade groups visible again
        expect(screen.getByText('小学')).toBeInTheDocument();
        expect(screen.getByText('初中')).toBeInTheDocument();
        expect(screen.getByText('高中')).toBeInTheDocument();
      });
    });
  });
});
