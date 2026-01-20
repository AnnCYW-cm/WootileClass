import { Router } from 'express';
import { getClasses, getClass, createClass, updateClass, deleteClass, archiveClass } from '../controllers/classController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getClasses);
router.get('/:id', getClass);
router.post('/', createClass);
router.put('/:id', updateClass);
router.put('/:id/archive', archiveClass);
router.delete('/:id', deleteClass);

export default router;
