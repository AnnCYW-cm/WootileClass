import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Membership from '../../pages/Membership';
import * as api from '../../services/api';

// Mock API
vi.mock('../../services/api', () => ({
  membershipApi: {
    getPlans: vi.fn(),
    getStatus: vi.fn(),
    purchase: vi.fn()
  }
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    path: (props) => <path {...props} />
  },
  AnimatePresence: ({ children }) => <>{children}</>
}));

const mockPlans = {
  premium: {
    name: '高级会员',
    price: 199,
    features: ['无限班级', '无限学生', '数据导出', '优先支持']
  }
};

const mockFreeStatus = {
  is_active: false,
  plan: 'free',
  expires_at: null,
  days_remaining: 0
};

const mockPremiumStatus = {
  is_active: true,
  plan: 'premium',
  expires_at: '2027-01-01T00:00:00.000Z',
  days_remaining: 300
};

const renderMembership = () => {
  return render(
    <MemoryRouter>
      <Membership />
    </MemoryRouter>
  );
};

describe('Membership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Free User', () => {
    beforeEach(() => {
      api.membershipApi.getPlans.mockResolvedValue(mockPlans);
      api.membershipApi.getStatus.mockResolvedValue(mockFreeStatus);
    });

    it('should render membership page', async () => {
      renderMembership();

      await waitFor(() => {
        expect(screen.getByText('会员中心')).toBeInTheDocument();
      });
    });

    it('should show free user status', async () => {
      renderMembership();

      await waitFor(() => {
        expect(screen.getByText('免费用户')).toBeInTheDocument();
      });
    });

    it('should display membership plans', async () => {
      renderMembership();

      await waitFor(() => {
        expect(screen.getByText('高级会员')).toBeInTheDocument();
        expect(screen.getByText('¥199')).toBeInTheDocument();
      });
    });

    it('should show plan features', async () => {
      renderMembership();

      await waitFor(() => {
        expect(screen.getByText('无限班级')).toBeInTheDocument();
        expect(screen.getByText('无限学生')).toBeInTheDocument();
      });
    });

    it('should show purchase button for free users', async () => {
      renderMembership();

      await waitFor(() => {
        expect(screen.getByText('立即开通')).toBeInTheDocument();
      });
    });

    it('should open confirm modal on purchase click', async () => {
      const user = userEvent.setup();
      renderMembership();

      await waitFor(() => {
        expect(screen.getByText('立即开通')).toBeInTheDocument();
      });

      const purchaseButton = screen.getByText('立即开通');
      await user.click(purchaseButton);

      await waitFor(() => {
        expect(screen.getByText('确认购买')).toBeInTheDocument();
        expect(screen.getByText('确认支付')).toBeInTheDocument();
      });
    });

    it('should close confirm modal on cancel', async () => {
      const user = userEvent.setup();
      renderMembership();

      await waitFor(() => {
        expect(screen.getByText('立即开通')).toBeInTheDocument();
      });

      await user.click(screen.getByText('立即开通'));

      await waitFor(() => {
        expect(screen.getByText('确认购买')).toBeInTheDocument();
      });

      await user.click(screen.getByText('取消'));

      await waitFor(() => {
        expect(screen.queryByText('确认购买')).not.toBeInTheDocument();
      });
    });

    it('should purchase membership successfully', async () => {
      const user = userEvent.setup();
      api.membershipApi.purchase.mockResolvedValueOnce({ success: true });
      api.membershipApi.getStatus.mockResolvedValueOnce(mockFreeStatus);
      api.membershipApi.getStatus.mockResolvedValueOnce(mockPremiumStatus);

      renderMembership();

      await waitFor(() => {
        expect(screen.getByText('立即开通')).toBeInTheDocument();
      });

      await user.click(screen.getByText('立即开通'));

      await waitFor(() => {
        expect(screen.getByText('确认支付')).toBeInTheDocument();
      });

      await user.click(screen.getByText('确认支付'));

      await waitFor(() => {
        expect(api.membershipApi.purchase).toHaveBeenCalledWith({ plan: 'premium' });
      });

      await waitFor(() => {
        expect(screen.getByText('购买成功！')).toBeInTheDocument();
      });
    });

    it('should show error on purchase failure', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      api.membershipApi.purchase.mockRejectedValueOnce(new Error('支付失败'));

      renderMembership();

      await waitFor(() => {
        expect(screen.getByText('立即开通')).toBeInTheDocument();
      });

      await user.click(screen.getByText('立即开通'));
      await user.click(screen.getByText('确认支付'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('支付失败');
      });

      alertSpy.mockRestore();
    });
  });

  describe('Premium User', () => {
    beforeEach(() => {
      api.membershipApi.getPlans.mockResolvedValue(mockPlans);
      api.membershipApi.getStatus.mockResolvedValue(mockPremiumStatus);
    });

    it('should show premium user status', async () => {
      renderMembership();

      await waitFor(() => {
        expect(screen.getByText('会员有效')).toBeInTheDocument();
      });
    });

    it('should show remaining days', async () => {
      renderMembership();

      await waitFor(() => {
        expect(screen.getByText(/剩余 300 天/)).toBeInTheDocument();
      });
    });

    it('should show renew button instead of purchase', async () => {
      renderMembership();

      await waitFor(() => {
        expect(screen.getByText('续费会员')).toBeInTheDocument();
      });
    });
  });

  describe('FAQ Section', () => {
    beforeEach(() => {
      api.membershipApi.getPlans.mockResolvedValue(mockPlans);
      api.membershipApi.getStatus.mockResolvedValue(mockFreeStatus);
    });

    it('should display FAQ questions', async () => {
      renderMembership();

      await waitFor(() => {
        expect(screen.getByText('常见问题')).toBeInTheDocument();
        expect(screen.getByText('如何付款？')).toBeInTheDocument();
        expect(screen.getByText('会员到期后怎么办？')).toBeInTheDocument();
        expect(screen.getByText('可以退款吗？')).toBeInTheDocument();
        expect(screen.getByText('续费会延长有效期吗？')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while loading', () => {
      api.membershipApi.getPlans.mockImplementation(() => new Promise(() => {}));
      api.membershipApi.getStatus.mockImplementation(() => new Promise(() => {}));

      renderMembership();

      // Check for the loading spinner element
      expect(document.querySelector('.animate-spin')).toBeTruthy();
    });
  });
});
