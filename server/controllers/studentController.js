import { StudentService } from '../services/StudentService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { BadRequestError } from '../utils/errors.js';

/**
 * Student Controller - HTTP request handlers
 * Business logic is delegated to StudentService
 */

export const getStudents = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const students = await StudentService.getByClass(classId, req.userId);
  res.json(students);
});

export const addStudent = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const student = await StudentService.create(classId, req.userId, req.body);
  res.status(201).json(student);
});

export const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const student = await StudentService.update(id, req.userId, req.body);
  res.json(student);
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await StudentService.delete(id, req.userId);
  res.json(result);
});

export const importStudents = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  if (!req.file) {
    throw new BadRequestError('请上传Excel文件');
  }

  const result = await StudentService.importFromExcel(classId, req.userId, req.file.buffer);
  res.status(201).json(result);
});
