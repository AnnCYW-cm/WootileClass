import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth.js';
import {
  getVideos,
  getVideo,
  getVideoByShareCode,
  uploadVideo,
  updateVideo,
  deleteVideo,
  publishVideo,
  unpublishVideo,
  getStorageUsage,
  updateThumbnail,
  getRelatedVideos,
  getComments,
  addComment,
  deleteComment,
  getDanmaku,
  addDanmaku
} from '../controllers/videoController.js';

const router = express.Router();

// Ensure upload directories exist
const videoDir = path.join(process.cwd(), 'public/uploads/videos');
const thumbnailDir = path.join(process.cwd(), 'public/uploads/thumbnails');

if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}
if (!fs.existsSync(thumbnailDir)) {
  fs.mkdirSync(thumbnailDir, { recursive: true });
}

// Configure multer for video uploads
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videoDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `video-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, thumbnailDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `thumb-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter for videos
const videoFilter = (req, file, cb) => {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 MP4、WebM、OGG 格式的视频'), false);
  }
};

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 JPG、PNG、GIF、WebP 格式的图片'), false);
  }
};

const uploadVideoFile = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max per file
  }
});

const uploadThumbnailFile = multer({
  storage: thumbnailStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// Public route - get video by share code
router.get('/share/:code', getVideoByShareCode);

// Protected routes
router.get('/', authMiddleware, getVideos);
router.get('/storage', authMiddleware, getStorageUsage);
router.get('/:id', authMiddleware, getVideo);
router.get('/:id/related', authMiddleware, getRelatedVideos);
router.get('/:id/comments', authMiddleware, getComments);
router.post('/:id/comments', authMiddleware, addComment);
router.delete('/comments/:commentId', authMiddleware, deleteComment);
router.get('/:id/danmaku', authMiddleware, getDanmaku);
router.post('/:id/danmaku', authMiddleware, addDanmaku);
router.post('/upload', authMiddleware, uploadVideoFile.single('video'), uploadVideo);
router.put('/:id', authMiddleware, updateVideo);
router.put('/:id/thumbnail', authMiddleware, uploadThumbnailFile.single('thumbnail'), updateThumbnail);
router.put('/:id/publish', authMiddleware, publishVideo);
router.put('/:id/unpublish', authMiddleware, unpublishVideo);
router.delete('/:id', authMiddleware, deleteVideo);

export default router;
