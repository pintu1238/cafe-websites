import type { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/app-error.js';

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  const appError = error instanceof AppError
    ? error
    : new AppError('INTERNAL_ERROR', 'Something went wrong. Please try again.', 500);

  request.log?.error?.({
    err: error,
    requestId: request.id,
    code: appError.code,
  }, 'request failed');

  response.status(appError.statusCode).json({
    success: false,
    message: appError.message,
    code: appError.code,
    errors: appError.errors,
  });
};
