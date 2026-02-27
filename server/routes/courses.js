import { Router } from 'express';
import {
  getCourses,
  getCourse,
  getCourseByShareCode,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  unpublishCourse,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
  getComments,
  createComment,
  deleteComment
} from '../controllers/courseController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Public route - access course by share code
router.get('/share/:code', getCourseByShareCode);

// Protected routes
router.use(authMiddleware);

// Course CRUD
router.get('/', getCourses);
router.get('/:id', getCourse);
router.post('/', createCourse);
router.put('/:id', updateCourse);
router.delete('/:id', deleteCourse);

// Course publishing
router.put('/:id/publish', publishCourse);
router.put('/:id/unpublish', unpublishCourse);

// Section management
router.post('/:courseId/sections', createSection);
router.put('/:courseId/sections/:id', updateSection);
router.delete('/:courseId/sections/:id', deleteSection);
router.put('/:courseId/sections/reorder', reorderSections);

// Comment management
router.get('/:courseId/comments', getComments);
router.post('/:courseId/comments', createComment);
router.delete('/:courseId/comments/:id', deleteComment);

export default router;
