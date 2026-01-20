import { Router } from 'express';
import multer from 'multer';
import { getStudents, addStudent, updateStudent, deleteStudent, importStudents } from '../controllers/studentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

// Routes with classId parameter
router.get('/class/:classId', getStudents);
router.post('/class/:classId', addStudent);
router.post('/class/:classId/import', upload.single('file'), importStudents);

// Routes for individual student
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

export default router;
