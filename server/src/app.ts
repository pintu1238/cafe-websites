import path from 'node:path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express, { type RequestHandler, type Router } from 'express';
import * as rateLimitModule from 'express-rate-limit';
import * as helmetModule from 'helmet';
import { pinoHttp } from 'pino-http';
import { defaultAppConfig, type AppConfig } from './config/env.js';
import type { Queryable } from './config/database.js';
import { AppError } from './utils/app-error.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { requestId } from './middleware/request-id.js';
import { logger } from './utils/logger.js';

const rateLimit = rateLimitModule.default as unknown as (options?: unknown) => RequestHandler;
const helmet = helmetModule.default as unknown as (options?: unknown) => RequestHandler;

export type CreateAppOptions = {
  config?: AppConfig;
  apiRouter?: Router;
  database?: Queryable;
  staticDir?: string;
};

export function createApp(options: CreateAppOptions = {}) {
  const config = options.config ?? defaultAppConfig;
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", 'data:', 'https://images.unsplash.com'],
      },
    },
  }));
  app.use(cors({
    origin: config.clientOrigin,
    credentials: true,
  }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(requestId);
  app.use(pinoHttp({ logger }));

  app.use('/api/v1/auth', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many authentication attempts. Please try again later.',
      code: 'RATE_LIMITED',
      errors: [],
    },
  }));

  app.get('/api/v1/health', async (_request, response) => {
    if (options.database) {
      try {
        await options.database.query('SELECT 1');
      } catch {
        throw new AppError('DATABASE_UNAVAILABLE', 'Database is unavailable.', 503);
      }
      response.json({ success: true, data: { status: 'ok', database: 'connected' } });
      return;
    }
    response.json({ success: true, data: { status: 'ok' } });
  });

  app.use('/api/v1/auth/forgot-password', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many password reset requests. Please try again later.',
      code: 'RATE_LIMITED',
      errors: [],
    },
  }));

  if (options.apiRouter) {
    app.use('/api/v1', options.apiRouter);
  }

  if (options.staticDir) {
    app.use(express.static(options.staticDir));
    app.use((request, response, next) => {
      if (request.path.startsWith('/api/v1')) {
        next();
        return;
      }

      response.sendFile(path.join(options.staticDir!, 'index.html'), (error) => {
        if (error) {
          next(error);
        }
      });
    });
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
