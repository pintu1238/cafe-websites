import { createHash, randomBytes } from 'node:crypto';

export function hashEmailVerificationSecret(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function createEmailVerificationToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString('hex');
  return { rawToken, tokenHash: hashEmailVerificationSecret(rawToken) };
}
