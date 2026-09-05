import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { AppConfig } from '../config/env.js';
import type { Role } from '../types/domain.js';
import { AppError } from './app-error.js';

export type AuthTokenClaims = JwtPayload & {
  sub: string;
  role: Role;
};

export function signAuthToken(input: { userId: string; role: Role }, config: AppConfig): string {
  return jwt.sign({ role: input.role }, config.jwtSecret, {
    subject: input.userId,
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAuthToken(token: string, config: AppConfig): AuthTokenClaims {
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (typeof payload === 'string' || !payload.sub || !payload.role) {
      throw new Error('invalid claims');
    }
    if (!['CUSTOMER', 'SHOPKEEPER', 'SUPER_ADMIN'].includes(payload.role as Role)) {
      throw new Error('invalid role');
    }
    return payload as AuthTokenClaims;
  } catch {
    throw new AppError('UNAUTHORIZED', 'Your session is invalid or has expired.', 401);
  }
}
