import { describe, expect, test, vi } from 'vitest';
import { me } from '../api/auth';
import { http } from '../api/http';

describe('auth API', () => {
  test('returns the user from the nested auth response payload', async () => {
    const user = {
      id: 'user-1',
      fullName: 'Aarav Mehta',
      email: 'aarav@example.com',
      phone: null,
      role: 'CUSTOMER' as const,
      profileImageUrl: null,
      universityId: null,
      studentId: null,
      isActive: true,
      isVerified: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      lastLoginAt: null,
    };
    const request = vi.spyOn(http, 'get').mockResolvedValueOnce({ data: { data: { user } } } as never);

    await expect(me()).resolves.toEqual(user);
    expect(request).toHaveBeenCalledWith('/auth/me');
  });
});
