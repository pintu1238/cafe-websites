import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { forgotPassword, verifyResetCode } from '../api/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { getApiError } from '../lib/errors';

const emailSchema = z.object({ email: z.string().email('Enter a valid university email.') });
const codeSchema = z.object({ code: z.string().regex(/^\d{6}$/, 'Enter the six-digit code.') });
type EmailValues = z.infer<typeof emailSchema>;
type CodeValues = z.infer<typeof codeSchema>;

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const emailForm = useForm<EmailValues>({ resolver: zodResolver(emailSchema) });
  const codeForm = useForm<CodeValues>({ resolver: zodResolver(codeSchema) });

  const onEmailSubmit = async (values: EmailValues) => {
    setError('');
    try {
      await forgotPassword(values);
      setEmail(values.email);
      setSent(true);
    } catch (requestError) {
      setError(getApiError(requestError, 'We could not send a reset code. Please try again.'));
    }
  };

  const onCodeSubmit = async (values: CodeValues) => {
    setError('');
    try {
      const result = await verifyResetCode({ email, code: values.code });
      setResetToken(result.resetToken);
    } catch (requestError) {
      setError(getApiError(requestError, 'That code is not valid. Please request a new one.'));
    }
  };

  return <div className="section-shell flex min-h-[calc(100vh-240px)] items-center justify-center py-16"><div className="w-full max-w-md"><p className="eyebrow">Account recovery</p><h1 className="mt-3 font-display text-5xl text-espresso">Reset your password.</h1><p className="mt-4 text-sm leading-6 text-muted">We will help you get back to your campus table securely.</p><div className="surface mt-8 grid gap-5 p-6 sm:p-8">{error && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{!sent ? <form className="grid gap-5" onSubmit={emailForm.handleSubmit(onEmailSubmit)}><Input label="University email" type="email" autoComplete="email" placeholder="you@university.edu" {...emailForm.register('email')} />{emailForm.formState.errors.email && <p className="-mt-3 text-xs text-red-700">{emailForm.formState.errors.email.message}</p>}<Button type="submit" disabled={emailForm.formState.isSubmitting}>{emailForm.formState.isSubmitting ? 'Sending…' : 'Send reset code'}</Button></form> : resetToken ? <div className="grid gap-4"><p className="text-sm leading-6 text-muted">Your code is verified. Continue below to choose a new password.</p><Link className="button-primary" to={`/reset-password?token=${encodeURIComponent(resetToken)}`}>Open the reset form</Link></div> : <form className="grid gap-5" onSubmit={codeForm.handleSubmit(onCodeSubmit)}><p className="text-sm leading-6 text-muted">If an account exists for <strong>{email}</strong>, a six-digit code has been sent.</p><Input label="Six-digit code" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" {...codeForm.register('code')} />{codeForm.formState.errors.code && <p className="-mt-3 text-xs text-red-700">{codeForm.formState.errors.code.message}</p>}<Button type="submit" disabled={codeForm.formState.isSubmitting}>{codeForm.formState.isSubmitting ? 'Verifying…' : 'Verify code'}</Button></form>}<p className="text-center text-sm text-muted"><Link className="font-semibold text-ember" to="/login">Back to sign in</Link></p></div></div></div>;
}
