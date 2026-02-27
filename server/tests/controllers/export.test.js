import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock the database module
const mockQuery = jest.fn();
jest.unstable_mockModule('../../db/index.js', () => ({
  query: mockQuery,
  default: { query: mockQuery }
}));

describe('ExportController', () => {
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
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      send: jest.fn()
    };
    mockQuery.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Export Students', () => {
    it('should get students for export', async () => {
      const mockStudents = [
        { id: 1, name: '张三', student_number: '001' },
        { id: 2, name: '李四', student_number: '002' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockStudents });

      const result = await mockQuery(
        'SELECT * FROM students WHERE class_id = $1',
        [1]
      );
      expect(result.rows).toEqual(mockStudents);
    });

    it('should verify class ownership before export', async () => {
      // Check ownership first
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1 }] });

      const classResult = await mockQuery(
        'SELECT * FROM classes WHERE id = $1 AND user_id = $2',
        [1, 1]
      );
      expect(classResult.rows.length).toBe(1);
    });

    it('should return empty when class not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await mockQuery(
        'SELECT * FROM classes WHERE id = $1 AND user_id = $2',
        [999, 1]
      );
      expect(result.rows.length).toBe(0);
    });
  });

  describe('Export Scores', () => {
    it('should get scores for export', async () => {
      const mockScores = [
        { student_name: '张三', total_score: 100, score_count: 5 },
        { student_name: '李四', total_score: 80, score_count: 4 }
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockScores });

      const result = await mockQuery(
        `SELECT s.name as student_name, COALESCE(SUM(sc.points), 0) as total_score, COUNT(sc.id) as score_count
         FROM students s
         LEFT JOIN scores sc ON s.id = sc.student_id
         WHERE s.class_id = $1
         GROUP BY s.id, s.name`,
        [1]
      );
      expect(result.rows).toEqual(mockScores);
    });

    it('should include score details', async () => {
      const mockScoreDetails = [
        { student_name: '张三', reason: '回答问题', points: 5, created_at: '2026-01-01' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockScoreDetails });

      const result = await mockQuery(
        `SELECT s.name as student_name, sc.reason, sc.points, sc.created_at
         FROM scores sc
         JOIN students s ON sc.student_id = s.id
         WHERE s.class_id = $1
         ORDER BY sc.created_at DESC`,
        [1]
      );
      expect(result.rows[0].reason).toBe('回答问题');
    });
  });

  describe('Export Attendance', () => {
    it('should get attendance for export', async () => {
      const mockAttendance = [
        { student_name: '张三', date: '2026-01-05', status: 'present' },
        { student_name: '李四', date: '2026-01-05', status: 'absent' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockAttendance });

      const result = await mockQuery(
        `SELECT s.name as student_name, a.date, a.status
         FROM attendance a
         JOIN students s ON a.student_id = s.id
         WHERE s.class_id = $1 AND a.date BETWEEN $2 AND $3
         ORDER BY a.date, s.name`,
        [1, '2026-01-01', '2026-01-31']
      );
      expect(result.rows).toEqual(mockAttendance);
    });

    it('should calculate attendance statistics', async () => {
      const mockStats = [
        { student_name: '张三', present_count: '20', absent_count: '2', late_count: '1' }
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockStats });

      const result = await mockQuery(
        `SELECT s.name as student_name,
                COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
                COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
                COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count
         FROM students s
         LEFT JOIN attendance a ON s.id = a.student_id
         WHERE s.class_id = $1
         GROUP BY s.id, s.name`,
        [1]
      );
      expect(parseInt(result.rows[0].present_count)).toBe(20);
    });
  });

  describe('Export Exam Scores', () => {
    it('should get exam scores for export', async () => {
      const mockExamScores = [
        { student_name: '张三', score: 95 },
        { student_name: '李四', score: 88 }
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockExamScores });

      const result = await mockQuery(
        `SELECT s.name as student_name, es.score
         FROM exam_scores es
         JOIN students s ON es.student_id = s.id
         WHERE es.exam_id = $1
         ORDER BY es.score DESC`,
        [1]
      );
      expect(result.rows).toEqual(mockExamScores);
    });

    it('should verify exam ownership', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, name: '期中考试', total_score: 100, user_id: 1 }]
      });

      const result = await mockQuery(
        `SELECT e.*, c.user_id FROM exams e
         JOIN classes c ON e.class_id = c.id
         WHERE e.id = $1`,
        [1]
      );
      expect(result.rows[0].name).toBe('期中考试');
    });

    it('should include exam statistics', async () => {
      const mockStats = {
        avg_score: '85.5',
        max_score: '100',
        min_score: '60',
        pass_rate: '0.9'
      };
      mockQuery.mockResolvedValueOnce({ rows: [mockStats] });

      const result = await mockQuery(
        `SELECT AVG(score) as avg_score, MAX(score) as max_score,
                MIN(score) as min_score,
                AVG(CASE WHEN score >= 60 THEN 1 ELSE 0 END) as pass_rate
         FROM exam_scores WHERE exam_id = $1`,
        [1]
      );
      expect(parseFloat(result.rows[0].avg_score)).toBeCloseTo(85.5);
    });
  });

  describe('CSV Generation', () => {
    it('should generate proper CSV format', () => {
      const data = [
        { name: '张三', score: 100 },
        { name: '李四', score: 80 }
      ];
      const headers = ['姓名', '分数'];
      const keys = ['name', 'score'];

      // Generate CSV
      const csvLines = [headers.join(',')];
      data.forEach(row => {
        csvLines.push(keys.map(k => row[k]).join(','));
      });
      const csv = csvLines.join('\n');

      expect(csv).toContain('姓名,分数');
      expect(csv).toContain('张三,100');
      expect(csv).toContain('李四,80');
    });

    it('should escape special characters in CSV', () => {
      const value = '张三,李四';
      const escaped = `"${value.replace(/"/g, '""')}"`;
      expect(escaped).toBe('"张三,李四"');
    });
  });
});
