import type { RequestHandler } from 'express';
import type { Role } from '../types/domain.js';

export function requireRole(...allowedRoles: Role[]): RequestHandler {
  return (request, response, next) => {
    if (!request.auth) {
      response.status(401).json({
        success: false,
        message: 'Please sign in to continue.',
        code: 'UNAUTHORIZED',
        errors: [],
      });
      return;
    }

    if (!allowedRoles.includes(request.auth.role)) {
      response.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
        code: 'FORBIDDEN',
        errors: [],
      });
      return;
    }

    next();
  };
}
