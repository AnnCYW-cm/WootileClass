import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  authApi,
  classesApi,
  studentsApi,
  attendanceApi,
  scoresApi,
  assignmentsApi,
  redemptionApi,
  membershipApi
} from '../../services/api';

describe('API Services', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.getItem.mockReturnValue('test-token');
  });

  const mockResponse = (data, ok = true) => {
    return Promise.resolve({
      ok,
      json: () => Promise.resolve(data)
    });
  };

  describe('authApi', () => {
    it('should register a user', async () => {
      const userData = { email: 'test@test.com', password: '123456', name: 'Test' };
      const responseData = { user: { id: 1, email: 'test@test.com' }, token: 'token' };

      fetch.mockImplementationOnce(() => mockResponse(responseData));

      const result = await authApi.register(userData);

      expect(fetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(userData)
      }));
      expect(result).toEqual(responseData);
    });

    it('should login a user', async () => {
      const credentials = { email: 'test@test.com', password: '123456' };
      const responseData = { user: { id: 1, email: 'test@test.com' }, token: 'token' };

      fetch.mockImplementationOnce(() => mockResponse(responseData));

      const result = await authApi.login(credentials);

      expect(fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(credentials)
      }));
      expect(result).toEqual(responseData);
    });

    it('should get user profile', async () => {
      const profileData = { id: 1, email: 'test@test.com', name: 'Test' };

      fetch.mockImplementationOnce(() => mockResponse(profileData));

      const result = await authApi.getProfile();

      expect(fetch).toHaveBeenCalledWith('/api/auth/profile', expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token'
        })
      }));
      expect(result).toEqual(profileData);
    });

    it('should throw error on failed request', async () => {
      fetch.mockImplementationOnce(() => mockResponse({ error: '登录失败' }, false));

      await expect(authApi.login({ email: 'test@test.com', password: 'wrong' }))
        .rejects.toThrow('登录失败');
    });
  });

  describe('classesApi', () => {
    it('should get all classes', async () => {
      const classesData = [{ id: 1, name: '三年级1班' }];

      fetch.mockImplementationOnce(() => mockResponse(classesData));

      const result = await classesApi.getAll();

      expect(fetch).toHaveBeenCalledWith('/api/classes', expect.any(Object));
      expect(result).toEqual(classesData);
    });

    it('should get classes filtered by status', async () => {
      const classesData = [{ id: 1, name: '三年级1班', status: 'active' }];

      fetch.mockImplementationOnce(() => mockResponse(classesData));

      await classesApi.getAll('active');

      expect(fetch).toHaveBeenCalledWith('/api/classes?status=active', expect.any(Object));
    });

    it('should get a specific class', async () => {
      const classData = { id: 1, name: '三年级1班' };

      fetch.mockImplementationOnce(() => mockResponse(classData));

      const result = await classesApi.get(1);

      expect(fetch).toHaveBeenCalledWith('/api/classes/1', expect.any(Object));
      expect(result).toEqual(classData);
    });

    it('should create a class', async () => {
      const newClass = { name: '四年级1班', grade: '四年级', subject: '语文' };
      const createdClass = { id: 1, ...newClass };

      fetch.mockImplementationOnce(() => mockResponse(createdClass));

      const result = await classesApi.create(newClass);

      expect(fetch).toHaveBeenCalledWith('/api/classes', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(newClass)
      }));
      expect(result).toEqual(createdClass);
    });

    it('should update a class', async () => {
      const updateData = { name: '更新后的班级' };

      fetch.mockImplementationOnce(() => mockResponse({ id: 1, ...updateData }));

      await classesApi.update(1, updateData);

      expect(fetch).toHaveBeenCalledWith('/api/classes/1', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(updateData)
      }));
    });

    it('should archive a class', async () => {
      fetch.mockImplementationOnce(() => mockResponse({ id: 1, status: 'archived' }));

      await classesApi.archive(1);

      expect(fetch).toHaveBeenCalledWith('/api/classes/1/archive', expect.objectContaining({
        method: 'PUT'
      }));
    });

    it('should delete a class', async () => {
      fetch.mockImplementationOnce(() => mockResponse({ message: '删除成功' }));

      await classesApi.delete(1);

      expect(fetch).toHaveBeenCalledWith('/api/classes/1', expect.objectContaining({
        method: 'DELETE'
      }));
    });
  });

  describe('studentsApi', () => {
    it('should get students by class', async () => {
      const students = [{ id: 1, name: '张三' }];

      fetch.mockImplementationOnce(() => mockResponse(students));

      const result = await studentsApi.getByClass(1);

      expect(fetch).toHaveBeenCalledWith('/api/students/class/1', expect.any(Object));
      expect(result).toEqual(students);
    });

    it('should add a student', async () => {
      const studentData = { name: '李四', student_no: '001' };

      fetch.mockImplementationOnce(() => mockResponse({ id: 1, ...studentData }));

      await studentsApi.add(1, studentData);

      expect(fetch).toHaveBeenCalledWith('/api/students/class/1', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(studentData)
      }));
    });

    it('should update a student', async () => {
      const updateData = { name: '张三三' };

      fetch.mockImplementationOnce(() => mockResponse({ id: 1, ...updateData }));

      await studentsApi.update(1, updateData);

      expect(fetch).toHaveBeenCalledWith('/api/students/1', expect.objectContaining({
        method: 'PUT'
      }));
    });

    it('should delete a student', async () => {
      fetch.mockImplementationOnce(() => mockResponse({ message: '删除成功' }));

      await studentsApi.delete(1);

      expect(fetch).toHaveBeenCalledWith('/api/students/1', expect.objectContaining({
        method: 'DELETE'
      }));
    });

    it('should import students from file', async () => {
      const file = new File([''], 'students.xlsx');
      const responseData = { message: '导入成功', students: [] };

      fetch.mockImplementationOnce(() => mockResponse(responseData));

      const result = await studentsApi.import(1, file);

      expect(fetch).toHaveBeenCalledWith('/api/students/class/1/import', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token'
        })
      }));
      expect(result).toEqual(responseData);
    });
  });

  describe('scoresApi', () => {
    it('should get class scores', async () => {
      const scores = [{ id: 1, name: '张三', total_score: 15 }];

      fetch.mockImplementationOnce(() => mockResponse(scores));

      const result = await scoresApi.getByClass(1);

      expect(fetch).toHaveBeenCalledWith('/api/scores/class/1', expect.any(Object));
      expect(result).toEqual(scores);
    });

    it('should add a score', async () => {
      const scoreData = { student_id: 1, change: 5, reason: '回答正确' };

      fetch.mockImplementationOnce(() => mockResponse({ record: { id: 1 }, total_score: 20 }));

      await scoresApi.add(1, scoreData);

      expect(fetch).toHaveBeenCalledWith('/api/scores/class/1', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(scoreData)
      }));
    });

    it('should batch add scores', async () => {
      const batchData = { records: [{ student_id: 1, change: 5 }] };

      fetch.mockImplementationOnce(() => mockResponse({ message: '成功' }));

      await scoresApi.batchAdd(1, batchData);

      expect(fetch).toHaveBeenCalledWith('/api/scores/class/1/batch', expect.objectContaining({
        method: 'POST'
      }));
    });

    it('should get ranking', async () => {
      const ranking = [{ id: 1, name: '张三', total_score: 20, rank: 1 }];

      fetch.mockImplementationOnce(() => mockResponse(ranking));

      await scoresApi.getRanking(1, 'week');

      expect(fetch).toHaveBeenCalledWith('/api/scores/class/1/ranking?period=week', expect.any(Object));
    });

    it('should get student history', async () => {
      const history = [{ id: 1, change: 5, reason: '回答正确' }];

      fetch.mockImplementationOnce(() => mockResponse(history));

      await scoresApi.getStudentHistory(1);

      expect(fetch).toHaveBeenCalledWith('/api/scores/student/1/history', expect.any(Object));
    });

    it('should reset scores', async () => {
      fetch.mockImplementationOnce(() => mockResponse({ message: '重置成功' }));

      await scoresApi.reset(1);

      expect(fetch).toHaveBeenCalledWith('/api/scores/class/1/reset', expect.objectContaining({
        method: 'DELETE'
      }));
    });

    it('should get presets', async () => {
      const presets = [{ id: 1, name: '回答正确', score: 2 }];

      fetch.mockImplementationOnce(() => mockResponse(presets));

      const result = await scoresApi.getPresets();

      expect(fetch).toHaveBeenCalledWith('/api/scores/presets', expect.any(Object));
      expect(result).toEqual(presets);
    });

    it('should create preset', async () => {
      const presetData = { name: '新预设', score: 3, icon: '⭐' };

      fetch.mockImplementationOnce(() => mockResponse({ id: 1, ...presetData }));

      await scoresApi.createPreset(presetData);

      expect(fetch).toHaveBeenCalledWith('/api/scores/presets', expect.objectContaining({
        method: 'POST'
      }));
    });

    it('should delete preset', async () => {
      fetch.mockImplementationOnce(() => mockResponse({ message: '删除成功' }));

      await scoresApi.deletePreset(1);

      expect(fetch).toHaveBeenCalledWith('/api/scores/presets/1', expect.objectContaining({
        method: 'DELETE'
      }));
    });
  });

  describe('attendanceApi', () => {
    it('should get attendance records', async () => {
      const records = [{ id: 1, student_id: 1, status: 'present' }];

      fetch.mockImplementationOnce(() => mockResponse(records));

      await attendanceApi.get(1, '2024-01-20');

      expect(fetch).toHaveBeenCalledWith('/api/attendance/class/1?date=2024-01-20', expect.any(Object));
    });

    it('should record attendance', async () => {
      const recordData = { student_id: 1, status: 'present' };

      fetch.mockImplementationOnce(() => mockResponse({ id: 1, ...recordData }));

      await attendanceApi.record(1, recordData);

      expect(fetch).toHaveBeenCalledWith('/api/attendance/class/1', expect.objectContaining({
        method: 'POST'
      }));
    });

    it('should batch record attendance', async () => {
      const batchData = { records: [{ student_id: 1, status: 'present' }] };

      fetch.mockImplementationOnce(() => mockResponse({ message: '成功' }));

      await attendanceApi.batchRecord(1, batchData);

      expect(fetch).toHaveBeenCalledWith('/api/attendance/class/1/batch', expect.objectContaining({
        method: 'POST'
      }));
    });

    it('should get random student', async () => {
      const student = { id: 1, name: '张三' };

      fetch.mockImplementationOnce(() => mockResponse(student));

      await attendanceApi.getRandomStudent(1);

      expect(fetch).toHaveBeenCalledWith('/api/attendance/class/1/random', expect.any(Object));
    });
  });

  describe('assignmentsApi', () => {
    it('should get all assignments', async () => {
      const assignments = [{ id: 1, title: '作业1' }];

      fetch.mockImplementationOnce(() => mockResponse(assignments));

      await assignmentsApi.getAll();

      expect(fetch).toHaveBeenCalledWith('/api/assignments', expect.any(Object));
    });

    it('should get assignments with filters', async () => {
      fetch.mockImplementationOnce(() => mockResponse([]));

      await assignmentsApi.getAll(1, 'active');

      expect(fetch).toHaveBeenCalledWith('/api/assignments?class_id=1&status=active', expect.any(Object));
    });

    it('should create assignment', async () => {
      const assignmentData = { title: '新作业', class_id: 1 };

      fetch.mockImplementationOnce(() => mockResponse({ id: 1, ...assignmentData }));

      await assignmentsApi.create(assignmentData);

      expect(fetch).toHaveBeenCalledWith('/api/assignments', expect.objectContaining({
        method: 'POST'
      }));
    });

    it('should get submissions', async () => {
      const submissions = [{ id: 1, student_id: 1 }];

      fetch.mockImplementationOnce(() => mockResponse(submissions));

      await assignmentsApi.getSubmissions(1);

      expect(fetch).toHaveBeenCalledWith('/api/assignments/1/submissions', expect.any(Object));
    });

    it('should grade submission', async () => {
      const gradeData = { score: 90, grade: 'A', comment: '很好' };

      fetch.mockImplementationOnce(() => mockResponse({ id: 1, ...gradeData }));

      await assignmentsApi.gradeSubmission(1, gradeData);

      expect(fetch).toHaveBeenCalledWith('/api/assignments/submissions/1/grade', expect.objectContaining({
        method: 'PUT'
      }));
    });
  });

  describe('redemptionApi', () => {
    it('should get rewards', async () => {
      const rewards = [{ id: 1, name: '奖励1' }];

      fetch.mockImplementationOnce(() => mockResponse(rewards));

      await redemptionApi.getRewards(1);

      expect(fetch).toHaveBeenCalledWith('/api/redemption/classes/1/rewards', expect.any(Object));
    });

    it('should create reward', async () => {
      const rewardData = { name: '新奖励', points_required: 10 };

      fetch.mockImplementationOnce(() => mockResponse({ id: 1, ...rewardData }));

      await redemptionApi.createReward(1, rewardData);

      expect(fetch).toHaveBeenCalledWith('/api/redemption/classes/1/rewards', expect.objectContaining({
        method: 'POST'
      }));
    });

    it('should redeem reward', async () => {
      const redeemData = { student_id: 1, reward_id: 1 };

      fetch.mockImplementationOnce(() => mockResponse({ message: '兑换成功' }));

      await redemptionApi.redeem(1, redeemData);

      expect(fetch).toHaveBeenCalledWith('/api/redemption/classes/1/redeem', expect.objectContaining({
        method: 'POST'
      }));
    });
  });

  describe('membershipApi', () => {
    it('should get plans', async () => {
      const plans = [{ id: 'monthly', name: '月度会员', price: 19.9 }];

      fetch.mockImplementationOnce(() => mockResponse(plans));

      await membershipApi.getPlans();

      expect(fetch).toHaveBeenCalledWith('/api/membership/plans', expect.any(Object));
    });

    it('should get status', async () => {
      const status = { membership_type: 'premium', expires_at: '2024-12-31' };

      fetch.mockImplementationOnce(() => mockResponse(status));

      await membershipApi.getStatus();

      expect(fetch).toHaveBeenCalledWith('/api/membership/status', expect.any(Object));
    });

    it('should purchase membership', async () => {
      const purchaseData = { plan_type: 'monthly' };

      fetch.mockImplementationOnce(() => mockResponse({ success: true }));

      await membershipApi.purchase(purchaseData);

      expect(fetch).toHaveBeenCalledWith('/api/membership/purchase', expect.objectContaining({
        method: 'POST'
      }));
    });
  });
});
