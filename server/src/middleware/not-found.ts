import type { RequestHandler } from 'express';
import { AppError } from '../utils/app-error.js';

export const notFound: RequestHandler = (_request, _response, next) => {
  next(new AppError('NOT_FOUND', 'The requested resource was not found.', 404));
};
