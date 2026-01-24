import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock the database module
const mockQuery = jest.fn();
jest.unstable_mockModule('../../db/index.js', () => ({
  query: mockQuery,
  default: { query: mockQuery }
}));

// Mock XLSX
jest.unstable_mockModule('xlsx', () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn()
  }
}));

// Import after mocking
const { getStudents, addStudent, updateStudent, deleteStudent, importStudents } = await import('../../controllers/studentController.js');
const XLSX = await import('xlsx');

describe('StudentController', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
      userId: 1,
      file: null
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

  describe('getStudents', () => {
    it('should return all students for a class', async () => {
      mockReq.params = { classId: '1' };

      const mockStudents = [
        { id: 1, name: '张三', student_no: '001', gender: '男' },
        { id: 2, name: '李四', student_no: '002', gender: '女' }
      ];

      // Check ownership
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      // Get students
      mockQuery.mockResolvedValueOnce({ rows: mockStudents });

      await getStudents(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockStudents);
    });

    it('should return 404 if class not found', async () => {
      mockReq.params = { classId: '999' };

      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getStudents(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '班级不存在' });
    });

    it('should return 500 on database error', async () => {
      mockReq.params = { classId: '1' };

      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await getStudents(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '获取学生列表失败' });
    });
  });

  describe('addStudent', () => {
    it('should add a student successfully', async () => {
      mockReq.params = { classId: '1' };
      mockReq.body = {
        name: '王五',
        student_no: '003',
        gender: '男'
      };

      const newStudent = {
        id: 3,
        class_id: 1,
        name: '王五',
        student_no: '003',
        gender: '男'
      };

      // Check ownership
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      // Insert student
      mockQuery.mockResolvedValueOnce({ rows: [newStudent] });

      await addStudent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(newStudent);
    });

    it('should return 400 if name is missing', async () => {
      mockReq.params = { classId: '1' };
      mockReq.body = { student_no: '003' };

      await addStudent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '学生姓名不能为空' });
    });

    it('should return 404 if class not found', async () => {
      mockReq.params = { classId: '999' };
      mockReq.body = { name: '王五' };

      mockQuery.mockResolvedValueOnce({ rows: [] });

      await addStudent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '班级不存在' });
    });

    it('should add student with empty student_no and gender', async () => {
      mockReq.params = { classId: '1' };
      mockReq.body = { name: '王五' };

      const newStudent = { id: 3, name: '王五', student_no: '', gender: '' };

      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      mockQuery.mockResolvedValueOnce({ rows: [newStudent] });

      await addStudent(mockReq, mockRes);

      expect(mockQuery).toHaveBeenLastCalledWith(
        expect.any(String),
        ['1', '王五', '', '']
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should return 500 on database error', async () => {
      mockReq.params = { classId: '1' };
      mockReq.body = { name: '王五' };

      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await addStudent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '添加学生失败' });
    });
  });

  describe('updateStudent', () => {
    it('should update a student successfully', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = {
        name: '张三三',
        student_no: '001',
        gender: '男'
      };

      const updatedStudent = {
        id: 1,
        name: '张三三',
        student_no: '001',
        gender: '男'
      };

      // Check ownership
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      // Update student
      mockQuery.mockResolvedValueOnce({ rows: [updatedStudent] });

      await updateStudent(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(updatedStudent);
    });

    it('should return 404 if student not found', async () => {
      mockReq.params = { id: '999' };
      mockReq.body = { name: '张三三' };

      mockQuery.mockResolvedValueOnce({ rows: [] });

      await updateStudent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '学生不存在' });
    });

    it('should return 500 on database error', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { name: '张三三' };

      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await updateStudent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '更新学生信息失败' });
    });
  });

  describe('deleteStudent', () => {
    it('should delete a student successfully', async () => {
      mockReq.params = { id: '1' };

      // Check ownership
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      // Delete
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await deleteStudent(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ message: '学生已删除' });
    });

    it('should return 404 if student not found', async () => {
      mockReq.params = { id: '999' };

      mockQuery.mockResolvedValueOnce({ rows: [] });

      await deleteStudent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '学生不存在' });
    });

    it('should return 500 on database error', async () => {
      mockReq.params = { id: '1' };

      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await deleteStudent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '删除学生失败' });
    });
  });

  describe('importStudents', () => {
    it('should return 400 if no file uploaded', async () => {
      mockReq.params = { classId: '1' };
      mockReq.file = null;

      await importStudents(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '请上传Excel文件' });
    });

    it('should return 404 if class not found', async () => {
      mockReq.params = { classId: '999' };
      mockReq.file = { buffer: Buffer.from('test') };

      mockQuery.mockResolvedValueOnce({ rows: [] });

      await importStudents(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '班级不存在' });
    });

    it('should return 400 if Excel has no data', async () => {
      mockReq.params = { classId: '1' };
      mockReq.file = { buffer: Buffer.from('test') };

      // Check ownership
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      // Mock XLSX
      XLSX.read.mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
      });
      XLSX.utils.sheet_to_json.mockReturnValue([]);

      await importStudents(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Excel文件中没有数据' });
    });

    it('should import students successfully', async () => {
      mockReq.params = { classId: '1' };
      mockReq.file = { buffer: Buffer.from('test') };

      // Check ownership
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      // Mock XLSX
      XLSX.read.mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
      });
      XLSX.utils.sheet_to_json.mockReturnValue([
        { '姓名': '张三', '学号': '001', '性别': '男' },
        { '姓名': '李四', '学号': '002', '性别': '女' }
      ]);

      // Mock student inserts
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, name: '张三' }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 2, name: '李四' }] });

      await importStudents(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: '成功导入 2 名学生'
      }));
    });

    it('should return 500 on database error', async () => {
      mockReq.params = { classId: '1' };
      mockReq.file = { buffer: Buffer.from('test') };

      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await importStudents(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '导入学生失败' });
    });
  });
});
