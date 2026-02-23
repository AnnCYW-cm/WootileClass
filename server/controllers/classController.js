import { ClassService } from '../services/ClassService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * Class Controller - HTTP request handlers
 * Business logic is delegated to ClassService
 */

export const getClasses = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const classes = await ClassService.getAll(req.userId, status);
  res.json(classes);
});

export const getClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const classData = await ClassService.getById(id, req.userId);
  res.json(classData);
});

export const createClass = asyncHandler(async (req, res) => {
  const classData = await ClassService.create(req.userId, req.body);
  res.status(201).json(classData);
});

export const updateClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const classData = await ClassService.update(id, req.userId, req.body);
  res.json(classData);
});

export const deleteClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await ClassService.delete(id, req.userId);
  res.json(result);
});

export const archiveClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const classData = await ClassService.toggleArchive(id, req.userId);
  res.json(classData);
});
