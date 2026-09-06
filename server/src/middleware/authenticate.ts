import type { RequestHandler } from 'express';
import type { AppConfig } from '../config/env.js';
import type { UserRepository } from '../types/domain.js';
import { AppError } from '../utils/app-error.js';
import { verifyAuthToken } from '../utils/jwt.js';

export const AUTH_COOKIE = 'cafeteria_token';

export function authenticate(users: UserRepository, config: AppConfig): RequestHandler {
  return async (request, _response, next) => {
    try {
      const token = request.cookies?.[AUTH_COOKIE];
      if (!token) {
        throw new AppError('UNAUTHORIZED', 'Please sign in to continue.', 401);
      }
      const claims = verifyAuthToken(token, config);
      const user = await users.findById(claims.sub);
      if (!user || !user.isActive) {
        throw new AppError('UNAUTHORIZED', 'Please sign in to continue.', 401);
      }
      request.auth = { userId: user.id, role: user.role };
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function optionalAuthenticate(users: UserRepository, config: AppConfig): RequestHandler {
  return async (request, _response, next) => {
    try {
      const token = request.cookies?.[AUTH_COOKIE];
      if (token) {
        const claims = verifyAuthToken(token, config);
        const user = await users.findById(claims.sub);
        if (user?.isActive) request.auth = { userId: user.id, role: user.role };
      }
    } catch (error) {
      if (!(error instanceof AppError) || error.code !== 'UNAUTHORIZED') throw error;
      // An expired or invalid session is treated as anonymous for /auth/me.
    }
    next();
  };
}
