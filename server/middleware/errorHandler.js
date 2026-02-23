import { AppError } from '../utils/errors.js';

/**
 * Global error handler middleware
 * Handles all errors thrown in the application
 */
export const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  if (process.env.NODE_ENV !== 'test') {
    console.error('Error:', {
      message: err.message,
      code: err.code,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  // Handle operational errors (expected errors)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(err.field && { field: err.field })
    });
  }

  // Handle PostgreSQL errors
  if (err.code === '23505') {
    return res.status(409).json({
      error: '数据已存在',
      code: 'DUPLICATE_ENTRY'
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      error: '关联数据不存在',
      code: 'FOREIGN_KEY_VIOLATION'
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: '令牌无效',
      code: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: '令牌已过期',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Handle unknown errors
  return res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
    code: 'INTERNAL_ERROR'
  });
};
