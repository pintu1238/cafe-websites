import type { Logger } from 'pino';

declare global {
  namespace Express {
    interface Request {
      id: string;
      log: Logger;
      auth?: {
        userId: string;
        role: 'CUSTOMER' | 'SHOPKEEPER' | 'SUPER_ADMIN';
      };
    }
  }
}

export {};
