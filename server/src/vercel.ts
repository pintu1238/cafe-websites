import type { Pool } from 'pg';
import { createApp } from './app.js';
import { createPool } from './config/database.js';
import { getEnv, type AppConfig } from './config/env.js';
import { createApiRouter } from './routes/index.js';

export function createVercelApp(input: { config?: AppConfig; pool?: Pool } = {}) {
  const config = input.config ?? getEnv();
  const pool = input.pool ?? createPool(config);

  return createApp({
    config,
    database: pool,
    apiRouter: createApiRouter({ pool, config }),
  });
}
