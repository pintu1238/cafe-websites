import { readFile } from 'node:fs/promises';
import path from 'node:path';

test('README documents safe setup, database, API, RBAC, tests, and product roadmap', async () => {
  const readme = await readFile(path.resolve(process.cwd(), '../README.md'), 'utf8');
  for (const phrase of [
    'DATABASE_URL',
    'JWT_SECRET',
    'database/schema.sql',
    'database/seed.sql',
    '/api/v1/auth/me',
    'Customer / Student',
    'Shopkeeper / Cafeteria partner',
    'npm test',
    'SaaS readiness view',
    'Razorpay or Stripe',
    'inventory',
    'notifications',
    'multi-campus',
  ]) {
    expect(readme).toContain(phrase);
  }
});
