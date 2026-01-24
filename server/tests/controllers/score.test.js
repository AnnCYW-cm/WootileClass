import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock the database module
const mockQuery = jest.fn();
jest.unstable_mockModule('../../db/index.js', () => ({
  query: mockQuery,
  default: { query: mockQuery }
}));

// Import after mocking
const {
  getClassScores,
  addScore,
  batchAddScore,
  getRanking,
  getStudentHistory,
  getPresets,
  createPreset,
  deletePreset,
  resetScores
} = await import('../../controllers/scoreController.js');

describe('ScoreController', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
      userId: 1
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockQuery.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getClassScores', () => {
    it('should return students with total scores', async () => {
      mockReq.params = { classId: '1' };

      const mockScores = [
        { id: 1, name: '张三', student_no: '001', total_score: '15' },
        { id: 2, name: '李四', student_no: '002', total_score: '10' }
      ];

      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Check ownership
      mockQuery.mockResolvedValueOnce({ rows: mockScores });

      await getClassScores(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockScores);
    });

    it('should return 404 if class not found', async () => {
      mockReq.params = { classId: '999' };
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getClassScores(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '班级不存在' });
    });

    it('should return 500 on database error', async () => {
      mockReq.params = { classId: '1' };
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await getClassScores(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '获取积分列表失败' });
    });
  });

  describe('addScore', () => {
    it('should add score successfully', async () => {
      mockReq.params = { classId: '1' };
      mockReq.body = {
        student_id: 1,
        change: 5,
        reason: '回答问题正确'
      };

      const newRecord = {
        id: 1,
        class_id: 1,
        student_id: 1,
        change: 5,
        reason: '回答问题正确'
      };

      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Check ownership
      mockQuery.mockResolvedValueOnce({ rows: [newRecord] }); // Insert
      mockQuery.mockResolvedValueOnce({ rows: [{ total_score: '15' }] }); // Get total

      await addScore(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        record: newRecord,
        total_score: 15
      });
    });

    it('should return 400 if student_id is missing', async () => {
      mockReq.params = { classId: '1' };
      mockReq.body = { change: 5 };

      await addScore(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '学生ID和分值不能为空' });
    });

    it('should return 400 if change is missing', async () => {
      mockReq.params = { classId: '1' };
      mockReq.body = { student_id: 1 };

      await addScore(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '学生ID和分值不能为空' });
    });

    it('should add negative score (deduction)', async () => {
      mockReq.params = { classId: '1' };
      mockReq.body = {
        student_id: 1,
        change: -3,
        reason: '迟到'
      };

      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, change: -3 }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ total_score: '7' }] });

      await addScore(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        total_score: 7
      }));
    });

    it('should return 404 if class not found', async () => {
      mockReq.params = { classId: '999' };
      mockReq.body = { student_id: 1, change: 5 };

      mockQuery.mockResolvedValueOnce({ rows: [] });

      await addScore(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on database error', async () => {
      mockReq.params = { classId: '1' };
      mockReq.body = { student_id: 1, change: 5 };

      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await addScore(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '添加积分失败' });
    });
  });

  describe('batchAddScore', () => {
    it('should batch add scores successfully', async () => {
      mockReq.params = { classId: '1' };
      mockReq.body = {
        records: [
          { student_id: 1, change: 5 },
          { student_id: 2, change: 3 }
        ]
      };

      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Check ownership
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, student_id: 1, change: 5 }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 2, student_id: 2, change: 3 }] });

      await batchAddScore(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: '批量添加积分成功'
      }));
    });

    it('should return 400 if records is not array', async () => {
      mockReq.params = { classId: '1' };
      mockReq.body = { records: 'not an array' };

      await batchAddScore(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '请提供积分记录数组' });
    });

    it('should return 400 if records is missing', async () => {
      mockReq.params = { classId: '1' };
      mockReq.body = {};

      await batchAddScore(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if class not found', async () => {
      mockReq.params = { classId: '999' };
      mockReq.body = { records: [{ student_id: 1, change: 5 }] };

      mockQuery.mockResolvedValueOnce({ rows: [] });

      await batchAddScore(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getRanking', () => {
    it('should return ranking for all time', async () => {
      mockReq.params = { classId: '1' };
      mockReq.query = {};

      const mockRanking = [
        { id: 1, name: '张三', total_score: '20' },
        { id: 2, name: '李四', total_score: '15' }
      ];

      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      mockQuery.mockResolvedValueOnce({ rows: mockRanking });

      await getRanking(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith([
        { id: 1, name: '张三', total_score: '20', rank: 1 },
        { id: 2, name: '李四', total_score: '15', rank: 2 }
      ]);
    });

    it('should filter by day period', async () => {
      mockReq.params = { classId: '1' };
      mockReq.query = { period: 'day' };

      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getRanking(mockReq, mockRes);

      expect(mockQuery).toHaveBeenLastCalledWith(
        expect.stringContaining('CURRENT_DATE'),
        ['1']
      );
    });

    it('should filter by week period', async () => {
      mockReq.params = { classId: '1' };
      mockReq.query = { period: 'week' };

      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getRanking(mockReq, mockRes);

      expect(mockQuery).toHaveBeenLastCalledWith(
        expect.stringContaining("7 days"),
        ['1']
      );
    });

    it('should filter by month period', async () => {
      mockReq.params = { classId: '1' };
      mockReq.query = { period: 'month' };

      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getRanking(mockReq, mockRes);

      expect(mockQuery).toHaveBeenLastCalledWith(
        expect.stringContaining("30 days"),
        ['1']
      );
    });

    it('should return 404 if class not found', async () => {
      mockReq.params = { classId: '999' };
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getRanking(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getStudentHistory', () => {
    it('should return student score history', async () => {
      mockReq.params = { studentId: '1' };

      const mockHistory = [
        { id: 1, change: 5, reason: '回答正确', created_at: new Date() },
        { id: 2, change: -2, reason: '迟到', created_at: new Date() }
      ];

      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      mockQuery.mockResolvedValueOnce({ rows: mockHistory });

      await getStudentHistory(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockHistory);
    });

    it('should return 404 if student not found', async () => {
      mockReq.params = { studentId: '999' };
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getStudentHistory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '学生不存在' });
    });
  });

  describe('getPresets', () => {
    it('should return user presets', async () => {
      const mockPresets = [
        { id: 1, name: '回答正确', score: 2, icon: '✓' },
        { id: 2, name: '迟到', score: -1, icon: '⏰' }
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockPresets });

      await getPresets(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockPresets);
    });

    it('should return default presets if user has none', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getPresets(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: '回答正确', is_default: true })
        ])
      );
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await getPresets(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '获取预设失败' });
    });
  });

  describe('createPreset', () => {
    it('should create preset successfully', async () => {
      mockReq.body = {
        name: '新预设',
        score: 3,
        icon: '🎉'
      };

      const newPreset = { id: 1, name: '新预设', score: 3, icon: '🎉' };
      mockQuery.mockResolvedValueOnce({ rows: [newPreset] });

      await createPreset(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(newPreset);
    });

    it('should return 400 if name is missing', async () => {
      mockReq.body = { score: 3 };

      await createPreset(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '名称和分值不能为空' });
    });

    it('should return 400 if score is missing', async () => {
      mockReq.body = { name: '新预设' };

      await createPreset(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deletePreset', () => {
    it('should delete preset successfully', async () => {
      mockReq.params = { id: '1' };

      mockQuery.mockResolvedValueOnce({ rows: [] });

      await deletePreset(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ message: '预设已删除' });
    });

    it('should return 500 on database error', async () => {
      mockReq.params = { id: '1' };
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await deletePreset(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '删除预设失败' });
    });
  });

  describe('resetScores', () => {
    it('should reset all scores for a class', async () => {
      mockReq.params = { classId: '1' };

      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Check ownership
      mockQuery.mockResolvedValueOnce({ rows: [] }); // Delete

      await resetScores(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ message: '积分已重置' });
    });

    it('should return 404 if class not found', async () => {
      mockReq.params = { classId: '999' };
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await resetScores(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '班级不存在' });
    });

    it('should return 500 on database error', async () => {
      mockReq.params = { classId: '1' };
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await resetScores(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '重置积分失败' });
    });
  });
});
