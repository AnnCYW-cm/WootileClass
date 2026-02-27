import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  createAnimation,
  getAnimation,
  updateAnimation,
  deleteAnimation,
  reorderAnimations,
  getBuiltinAnimations,
  getBuiltinCategories,
  getBuiltinAnimation,
  seedBuiltinAnimations
} from '../controllers/animationController.js';
import { authMiddleware } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Configure multer for animation file uploads
const uploadsDir = path.join(__dirname, '../uploads/animations');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.json', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 JSON (Lottie) 和 GIF 格式'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Built-in animations (public)
router.get('/builtin', getBuiltinAnimations);
router.get('/builtin/categories', getBuiltinCategories);
router.get('/builtin/:id', getBuiltinAnimation);

// Seed built-in animations (temporarily public for development)
router.post('/builtin/seed', seedBuiltinAnimations);

// Protected routes
router.use(authMiddleware);

// File upload endpoint
router.post('/upload', upload.single('animation'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请上传文件' });
  }

  res.json({
    url: `/uploads/animations/${req.file.filename}`,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size
  });
});

// Animation CRUD
router.post('/', createAnimation);
router.get('/:id', getAnimation);
router.put('/:id', updateAnimation);
router.delete('/:id', deleteAnimation);

// Reorder animations in a section
router.put('/section/:sectionId/reorder', reorderAnimations);

export default router;
