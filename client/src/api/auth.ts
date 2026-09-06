import { http, apiData } from './http';
import type { User } from '../types/api';

export type AuthInput = { fullName?: string; email: string; password: string; universityId?: string; studentId?: string };
function authUser(response: { data: { data: { user: User } } }) {
  return apiData<{ user: User }>(response).user;
}

export async function register(input: AuthInput) {
  return apiData<{ user: User; verificationRequired: boolean }>(await http.post('/auth/register', input));
}
export async function login(input: Pick<AuthInput, 'email' | 'password'>) { return authUser(await http.post('/auth/login', input)); }
export async function logout() { return apiData<{ loggedOut: boolean }>(await http.post('/auth/logout')); }
export async function me() {
  const data = apiData<{ user: User | null }>(await http.get('/auth/me'));
  return data.user;
}
export async function forgotPassword(input: Pick<AuthInput, 'email'>) { return apiData<{ accepted: boolean }>(await http.post('/auth/forgot-password', input)); }
export async function verifyResetCode(input: { email: string; code: string }) { return apiData<{ resetToken: string }>(await http.post('/auth/verify-reset-code', input)); }
export async function resetPassword(input: { token: string; password: string }) { return apiData<{ reset: boolean }>(await http.post('/auth/reset-password', input)); }
export async function resendVerification(input: Pick<AuthInput, 'email'>) { return apiData<{ accepted: boolean }>(await http.post('/auth/resend-verification', input)); }
export function googleAuthUrl() { return `${(http.defaults.baseURL ?? '').replace(/\/$/, '')}/auth/google`; }
