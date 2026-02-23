/**
 * Custom error classes for standardized error handling
 */

export class AppError extends Error {
  constructor(message, statusCode, code = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = '资源') {
    super(`${resource}不存在`, 404, 'NOT_FOUND');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = '无权执行此操作') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = '未授权访问') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class BadRequestError extends AppError {
  constructor(message = '请求参数错误') {
    super(message, 400, 'BAD_REQUEST');
  }
}

export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }
}

export class ConflictError extends AppError {
  constructor(message = '资源冲突') {
    super(message, 409, 'CONFLICT');
  }
}
