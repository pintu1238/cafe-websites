import { createHash, randomBytes, randomInt } from 'node:crypto';

export function hashResetSecret(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function createResetToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString('hex');
  return { rawToken, tokenHash: hashResetSecret(rawToken) };
}

export function createResetCode(): { rawCode: string; codeHash: string } {
  const rawCode = randomInt(100000, 1000000).toString();
  return { rawCode, codeHash: hashResetSecret(rawCode) };
}
