import { describe, expect, test } from 'vitest';
import { createResetCode, createResetToken, hashResetSecret } from '../../src/utils/reset-token.js';

describe('reset token helpers', () => {
  test('creates a strong token and stores only its deterministic hash', () => {
    const result = createResetToken();

    expect(result.rawToken).toMatch(/^[a-f0-9]{64}$/);
    expect(result.tokenHash).toBe(hashResetSecret(result.rawToken));
    expect(result.tokenHash).not.toBe(result.rawToken);
  });

  test('creates a six-digit code and a different deterministic hash', () => {
    const result = createResetCode();

    expect(result.rawCode).toMatch(/^\d{6}$/);
    expect(result.codeHash).toBe(hashResetSecret(result.rawCode));
    expect(result.codeHash).not.toBe(result.rawCode);
  });

  test('changes the digest when the secret changes', () => {
    expect(hashResetSecret('code-a')).not.toBe(hashResetSecret('code-b'));
  });
});
