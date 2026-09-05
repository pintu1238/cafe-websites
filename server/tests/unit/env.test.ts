import { describe, expect, test } from 'vitest';
import { getEnv } from '../../src/config/env.js';

describe('environment configuration', () => {
  test('defaults the email verification TTL to thirty minutes', () => {
    const config = getEnv({
      DATABASE_URL: 'postgresql://localhost/cafeteria',
      JWT_SECRET: 'test-only-secret-that-is-long-enough-123456',
    });

    expect(config.emailVerificationTtlMinutes).toBe(30);
  });
});
