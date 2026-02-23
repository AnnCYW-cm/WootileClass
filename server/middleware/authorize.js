import { query } from '../db/index.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

/**
 * Authorization middleware for resource ownership checks
 * Replaces repeated permission checks across controllers
 */

/**
 * Authorize access to a class
 * Checks if the current user owns the class
 */
export const authorizeClass = async (req, res, next) => {
  try {
    const classId = req.params.classId || req.params.id || req.body.class_id;

    if (!classId) {
      return next();
    }

    const result = await query(
      'SELECT id, user_id FROM classes WHERE id = $1',
      [classId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('班级');
    }

    if (result.rows[0].user_id !== req.userId) {
      throw new ForbiddenError('无权访问此班级');
    }

    req.class = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize access to a student
 * Checks if the student belongs to a class owned by the current user
 */
export const authorizeStudent = async (req, res, next) => {
  try {
    const studentId = req.params.studentId || req.params.id;

    if (!studentId) {
      return next();
    }

    const result = await query(
      `SELECT s.id, s.class_id, c.user_id
       FROM students s
       JOIN classes c ON s.class_id = c.id
       WHERE s.id = $1`,
      [studentId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('学生');
    }

    if (result.rows[0].user_id !== req.userId) {
      throw new ForbiddenError('无权访问此学生');
    }

    req.student = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize access to an assignment
 * Checks if the assignment belongs to a class owned by the current user
 */
export const authorizeAssignment = async (req, res, next) => {
  try {
    const assignmentId = req.params.assignmentId || req.params.id;

    if (!assignmentId) {
      return next();
    }

    const result = await query(
      `SELECT a.id, a.class_id, c.user_id
       FROM assignments a
       JOIN classes c ON a.class_id = c.id
       WHERE a.id = $1`,
      [assignmentId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('作业');
    }

    if (result.rows[0].user_id !== req.userId) {
      throw new ForbiddenError('无权访问此作业');
    }

    req.assignment = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize access to an exam
 * Checks if the exam belongs to a class owned by the current user
 */
export const authorizeExam = async (req, res, next) => {
  try {
    const examId = req.params.examId || req.params.id;

    if (!examId) {
      return next();
    }

    const result = await query(
      `SELECT e.id, e.class_id, c.user_id
       FROM exams e
       JOIN classes c ON e.class_id = c.id
       WHERE e.id = $1`,
      [examId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('考试');
    }

    if (result.rows[0].user_id !== req.userId) {
      throw new ForbiddenError('无权访问此考试');
    }

    req.exam = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize access to a reward
 * Checks if the reward belongs to a class owned by the current user
 */
export const authorizeReward = async (req, res, next) => {
  try {
    const rewardId = req.params.rewardId || req.params.id;

    if (!rewardId) {
      return next();
    }

    const result = await query(
      `SELECT r.id, r.class_id, c.user_id
       FROM rewards r
       JOIN classes c ON r.class_id = c.id
       WHERE r.id = $1`,
      [rewardId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('奖励');
    }

    if (result.rows[0].user_id !== req.userId) {
      throw new ForbiddenError('无权访问此奖励');
    }

    req.reward = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
};
