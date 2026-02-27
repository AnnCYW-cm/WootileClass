import { VideoService } from '../services/VideoService.js';
import { MembershipService } from '../services/MembershipService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { getLimits, LIMIT_MESSAGES } from '../config/membershipLimits.js';
import path from 'path';
import fs from 'fs/promises';

/**
 * Video Controller - HTTP request handlers for teacher videos
 */

// Get all videos
export const getVideos = asyncHandler(async (req, res) => {
  const { grade, subject, status } = req.query;
  const videos = await VideoService.getAll(req.userId, { grade, subject, status });
  res.json(videos);
});

// Get single video
export const getVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const video = await VideoService.getById(id, req.userId);
  res.json(video);
});

// Get video by share code (public)
export const getVideoByShareCode = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const video = await VideoService.getByShareCode(code);
  res.json(video);
});

// Upload video
export const uploadVideo = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请上传视频文件' });
  }

  const { title, description, grade, subject } = req.body;

  // Check storage limits
  const membershipType = await MembershipService.getUserMembershipType(req.userId);
  const limits = getLimits(membershipType);
  const usage = await VideoService.getStorageUsage(req.userId);

  // Check video count limit
  if (limits.maxVideoCount !== -1 && usage.videoCount >= limits.maxVideoCount) {
    // Delete uploaded file
    await fs.unlink(req.file.path).catch(() => {});
    return res.status(403).json({
      error: LIMIT_MESSAGES.maxVideoCount,
      code: 'LIMIT_EXCEEDED',
      current: usage.videoCount,
      limit: limits.maxVideoCount
    });
  }

  // Check storage limit
  const newTotalSize = usage.totalSizeBytes + req.file.size;
  const storageLimitBytes = limits.maxVideoStorage * 1024 * 1024; // Convert MB to bytes
  if (limits.maxVideoStorage !== -1 && newTotalSize > storageLimitBytes) {
    // Delete uploaded file
    await fs.unlink(req.file.path).catch(() => {});
    return res.status(403).json({
      error: LIMIT_MESSAGES.maxVideoStorage,
      code: 'LIMIT_EXCEEDED',
      currentMB: usage.totalSizeMB,
      limitMB: limits.maxVideoStorage
    });
  }

  // Create video record
  const video = await VideoService.create(req.userId, {
    title: title || req.file.originalname,
    description,
    filePath: `/uploads/videos/${req.file.filename}`,
    fileSize: req.file.size,
    grade,
    subject
  });

  res.status(201).json(video);
});

// Update video
export const updateVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const video = await VideoService.update(id, req.userId, req.body);
  res.json(video);
});

// Delete video
export const deleteVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await VideoService.delete(id, req.userId);

  // Delete physical file
  if (result.filePath) {
    const fullPath = path.join(process.cwd(), 'public', result.filePath);
    await fs.unlink(fullPath).catch(() => {});
  }

  res.json({ message: result.message });
});

// Publish video
export const publishVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const video = await VideoService.publish(id, req.userId);
  res.json(video);
});

// Unpublish video
export const unpublishVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const video = await VideoService.unpublish(id, req.userId);
  res.json(video);
});

// Get storage usage
export const getStorageUsage = asyncHandler(async (req, res) => {
  const usage = await VideoService.getStorageUsage(req.userId);
  const membershipType = await MembershipService.getUserMembershipType(req.userId);
  const limits = getLimits(membershipType);

  res.json({
    ...usage,
    limits: {
      maxVideoCount: limits.maxVideoCount,
      maxVideoStorageMB: limits.maxVideoStorage,
      unlimited: limits.maxVideoStorage === -1
    }
  });
});

// Update video thumbnail
export const updateThumbnail = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: '请上传缩略图' });
  }

  const thumbnailPath = `/uploads/thumbnails/${req.file.filename}`;
  const video = await VideoService.update(id, req.userId, {
    ...req.body,
    thumbnail: thumbnailPath
  });

  res.json(video);
});

// Get related videos
export const getRelatedVideos = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const videos = await VideoService.getRelatedVideos(id);
  res.json(videos);
});

// Get video comments
export const getComments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const comments = await VideoService.getComments(id);
  res.json(comments);
});

// Add a comment
export const addComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content, parentId } = req.body;

  // Get user name
  const userResult = await import('../db/index.js').then(m =>
    m.query('SELECT name, email FROM users WHERE id = $1', [req.userId])
  );
  const userName = userResult.rows[0]?.name || userResult.rows[0]?.email || '匿名用户';

  const comment = await VideoService.addComment(id, req.userId, userName, content, parentId);
  res.status(201).json(comment);
});

// Delete a comment
export const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const result = await VideoService.deleteComment(commentId, req.userId);
  res.json(result);
});

// Get danmaku for a video
export const getDanmaku = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const danmaku = await VideoService.getDanmaku(id);
  res.json(danmaku);
});

// Add a danmaku
export const addDanmaku = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content, timeSeconds, color } = req.body;
  const danmaku = await VideoService.addDanmaku(id, req.userId, content, timeSeconds, color);
  res.status(201).json(danmaku);
});
