import { readFile } from 'node:fs/promises';
import path from 'node:path';

test('README documents safe setup, database, API, RBAC, tests, and deferred modules', async () => {
  const readme = await readFile(path.resolve(process.cwd(), '../README.md'), 'utf8');
  for (const phrase of [
    'DATABASE_URL',
    'JWT_SECRET',
    'database/migrations/001_initial_schema.sql',
    'database/seed.sql',
    '/api/v1/auth/me',
    'CUSTOMER',
    'SHOPKEEPER',
    'npm test',
    'Online payments',
    'Promotions',
    'Inventory',
    'Reviews',
    'Favorites',
    'Notifications',
    'Admin modules',
    'Realtime',
  ]) {
    expect(readme).toContain(phrase);
  }
});
