import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { LoginPage } from '../pages/login-page';
import { RegisterPage } from '../pages/register-page';
import { ForgotPasswordPage } from '../pages/forgot-password-page';
import { ResetPasswordPage } from '../pages/reset-password-page';
import { VerifyEmailPage } from '../pages/verify-email-page';
import * as authApi from '../api/auth';

vi.mock('../api/auth', () => ({
  forgotPassword: vi.fn(),
  googleAuthUrl: vi.fn(() => 'http://localhost:4000/api/v1/auth/google'),
  login: vi.fn(),
  register: vi.fn(),
  resetPassword: vi.fn(),
  resendVerification: vi.fn(),
  verifyResetCode: vi.fn(),
}));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}

describe('authentication pages', () => {
  beforeEach(() => vi.resetAllMocks());

  test('offers Google authentication and password recovery from both auth entry points', () => {
    const { unmount } = render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /sign in with google/i })).toHaveAttribute('href', expect.stringContaining('/auth/google'));
    expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute('href', '/forgot-password');
    unmount();

    render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /sign up with google/i })).toHaveAttribute('href', expect.stringContaining('/auth/google'));
  });

  test('requests a reset and verifies the code before navigating to the reset form', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.forgotPassword).mockResolvedValue({ accepted: true });
    vi.mocked(authApi.verifyResetCode).mockResolvedValue({ resetToken: 'a'.repeat(64) });

    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);
    await user.type(screen.getByLabelText(/email/i), 'student@example.test');
    await user.click(screen.getByRole('button', { name: /send reset code/i }));
    expect(await screen.findByText(/if an account exists/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/six-digit code/i), '123456');
    await user.click(screen.getByRole('button', { name: /verify code/i }));

    expect(authApi.verifyResetCode).toHaveBeenCalledWith({ email: 'student@example.test', code: '123456' });
    expect(await screen.findByText(/open the reset form/i)).toBeInTheDocument();
  });

  test('accepts a reset-link token and submits the new password', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.resetPassword).mockResolvedValue({ reset: true });

    render(<MemoryRouter initialEntries={[`/reset-password?token=${'b'.repeat(64)}`]}><ResetPasswordPage /></MemoryRouter>);
    await user.type(screen.getByLabelText(/^new password$/i), 'NewPassword@123');
    await user.type(screen.getByLabelText(/confirm new password/i), 'NewPassword@123');
    await user.click(screen.getByRole('button', { name: /set new password/i }));

    expect(authApi.resetPassword).toHaveBeenCalledWith({ token: 'b'.repeat(64), password: 'NewPassword@123' });
  });

  test('routes a new account to email verification instructions', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.register).mockResolvedValue({ user: {} as never, verificationRequired: true });

    render(<MemoryRouter initialEntries={['/register']}><RegisterPage /><LocationProbe /></MemoryRouter>);
    await user.type(screen.getByLabelText(/full name/i), 'Aarav Mehta');
    await user.type(screen.getByLabelText(/university email/i), 'student@example.test');
    await user.type(screen.getByLabelText(/^password$/i), 'Student@12345');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByTestId('location')).toHaveTextContent('/verify-email?email=student%40example.test');
  });

  test('resends an email verification message from the verification page', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.resendVerification).mockResolvedValue({ accepted: true });

    render(<MemoryRouter initialEntries={['/verify-email?email=student%40example.test']}><VerifyEmailPage /></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: /resend verification/i }));

    expect(authApi.resendVerification).toHaveBeenCalledWith({ email: 'student@example.test' });
    expect(await screen.findByRole('status')).toHaveTextContent(/verification email is on its way/i);
  });

  test('shows verification success and resend action from login states', async () => {
    const { unmount } = render(<MemoryRouter initialEntries={['/login?verified=1']}><LoginPage /></MemoryRouter>);
    expect(screen.getByRole('status')).toHaveTextContent(/email is verified/i);
    unmount();

    const user = userEvent.setup();
    vi.mocked(authApi.login).mockRejectedValue({ isAxiosError: true, response: { data: { code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email address before signing in.' } } });
    render(<MemoryRouter initialEntries={['/login']}><LoginPage /></MemoryRouter>);
    await user.type(screen.getByLabelText(/university email/i), 'student@example.test');
    await user.type(screen.getByLabelText(/password/i), 'Student@12345');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('link', { name: /resend verification/i })).toHaveAttribute('href', '/verify-email?email=student%40example.test');
  });
});
