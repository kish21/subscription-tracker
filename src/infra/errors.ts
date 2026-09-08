export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = 'INTERNAL_ERROR',
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace?.(this, this.constructor)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: Record<string, unknown>) {
    super(message, 404, 'NOT_FOUND', details)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', details?: Record<string, unknown>) {
    super(message, 401, 'UNAUTHORIZED', details)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden', details?: Record<string, unknown>) {
    super(message, 403, 'FORBIDDEN', details)
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid request payload', details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', details)
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 500, 'CONFIGURATION_ERROR', details)
  }
}
