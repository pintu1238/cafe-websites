import type { RequestHandler } from 'express';
import { z, type ZodTypeAny } from 'zod';
import { AppError } from '../utils/app-error.js';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodTypeAny, target: ValidationTarget = 'body'): RequestHandler {
  return (request, _response, next) => {
    const result = schema.safeParse(request[target]);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || target,
        message: issue.message,
      }));
      next(new AppError('VALIDATION_ERROR', 'Please check the highlighted fields.', 422, errors));
      return;
    }
    if (target === 'body') {
      request.body = result.data;
    } else {
      Object.assign(request[target], result.data);
    }
    next();
  };
}

export { z };
