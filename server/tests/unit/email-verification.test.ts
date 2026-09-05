import { describe, expect, test } from 'vitest';
import { createEmailVerificationToken, hashEmailVerificationSecret } from '../../src/utils/email-verification-token.js';

describe('email verification tokens', () => {
  test('generates a random raw token and a different deterministic hash', () => {
    const first = createEmailVerificationToken();
    const second = createEmailVerificationToken();

    expect(first.rawToken).toMatch(/^[a-f0-9]{64}$/);
    expect(first.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.tokenHash).not.toBe(first.rawToken);
    expect(hashEmailVerificationSecret(first.rawToken)).toBe(first.tokenHash);
    expect(second.rawToken).not.toBe(first.rawToken);
  });
});
