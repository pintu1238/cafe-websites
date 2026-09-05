import path from 'node:path';
import dotenv from 'dotenv';
import { createApp } from './app.js';
import { getEnv } from './config/env.js';
import { createPool } from './config/database.js';
import { createApiRouter } from './routes/index.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '..', '.env') });

const config = getEnv();
const pool = createPool(config);

async function start() {
  try {
    await pool.query('SELECT 1');
    const app = createApp({ config, database: pool, apiRouter: createApiRouter({ pool, config }) });
    app.listen(config.port, () => {
      console.log(`University Cafeteria API listening on port ${config.port}`);
    });
  } catch {
    console.error('University Cafeteria API could not connect to the configured database.');
    process.exitCode = 1;
  }
}

void start();
