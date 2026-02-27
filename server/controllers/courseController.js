import { CourseService } from '../services/CourseService.js';
import { MembershipService } from '../services/MembershipService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * Course Controller - HTTP request handlers
 */

export const getCourses = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const courses = await CourseService.getAll(req.userId, status);

  // 获取用户会员信息，标记哪些课程可以播放
  const userLimits = await MembershipService.getUserLimits(req.userId);
  const maxCourses = userLimits.limits.maxCourses;

  // 按创建时间倒序排序，最新的 N 个课程可以播放
  const sortedCourses = [...courses].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const accessibleIds = maxCourses === -1
    ? courses.map(c => c.id)
    : sortedCourses.slice(0, maxCourses).map(c => c.id);

  const coursesWithAccess = courses.map(course => ({
    ...course,
    canPlay: accessibleIds.includes(course.id),
    isPremiumOnly: !accessibleIds.includes(course.id)
  }));

  res.json(coursesWithAccess);
});

export const getCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 检查课程播放权限
  const accessCheck = await MembershipService.checkCoursePlayAccess(req.userId, id);
  if (!accessCheck.allowed) {
    return res.status(403).json({
      error: accessCheck.message,
      code: 'COURSE_ACCESS_DENIED',
      limit: accessCheck.limit
    });
  }

  const course = await CourseService.getById(id, req.userId);
  res.json(course);
});

export const getCourseByShareCode = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const course = await CourseService.getByShareCode(code);
  res.json(course);
});

export const createCourse = asyncHandler(async (req, res) => {
  // 检查课程数量限制
  const limitCheck = await MembershipService.checkCourseLimit(req.userId);
  if (!limitCheck.allowed) {
    return res.status(403).json({
      error: limitCheck.message,
      code: 'LIMIT_EXCEEDED',
      current: limitCheck.current,
      limit: limitCheck.limit
    });
  }

  const course = await CourseService.create(req.userId, req.body);
  res.status(201).json(course);
});

export const updateCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const course = await CourseService.update(id, req.userId, req.body);
  res.json(course);
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await CourseService.delete(id, req.userId);
  res.json(result);
});

export const publishCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const course = await CourseService.publish(id, req.userId);
  res.json(course);
});

export const unpublishCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const course = await CourseService.unpublish(id, req.userId);
  res.json(course);
});

// Section handlers
export const createSection = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const section = await CourseService.createSection(courseId, req.userId, req.body);
  res.status(201).json(section);
});

export const updateSection = asyncHandler(async (req, res) => {
  const { courseId, id } = req.params;
  const section = await CourseService.updateSection(courseId, id, req.userId, req.body);
  res.json(section);
});

export const deleteSection = asyncHandler(async (req, res) => {
  const { courseId, id } = req.params;
  const result = await CourseService.deleteSection(courseId, id, req.userId);
  res.json(result);
});

export const reorderSections = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { sectionIds } = req.body;
  const result = await CourseService.reorderSections(courseId, req.userId, sectionIds);
  res.json(result);
});

// Comment handlers
export const getComments = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const comments = await CourseService.getComments(courseId);
  res.json(comments);
});

export const createComment = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { content, parentId } = req.body;
  const comment = await CourseService.createComment(courseId, req.userId, content, parentId);
  res.status(201).json(comment);
});

export const deleteComment = asyncHandler(async (req, res) => {
  const { courseId, id } = req.params;
  const result = await CourseService.deleteComment(id, req.userId);
  res.json(result);
});
