import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { login } from '../api/auth';
import { GoogleAuthButton } from '../components/google-auth-button';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { getApiError, getApiErrorCode } from '../lib/errors';
import { queryClient } from '../lib/query-client';

const schema = z.object({ email: z.string().email('Enter a valid university email.'), password: z.string().min(1, 'Enter your password.') });
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(searchParams.get('error') === 'google_auth_failed' ? 'Google sign-in could not be completed. Please try again.' : '');
  const [verificationEmail, setVerificationEmail] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const onSubmit = async (values: FormValues) => {
    setError('');
    setVerificationEmail('');
    try {
      await login(values);
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? '/', { replace: true });
    } catch (requestError) {
      if (getApiErrorCode(requestError) === 'EMAIL_NOT_VERIFIED') {
        setVerificationEmail(values.email.trim().toLowerCase());
      }
      setError(getApiError(requestError, 'We could not sign you in. Please try again.'));
    }
  };

  const verifiedMessage = searchParams.get('verified') === '1';
  return <div className="section-shell flex min-h-[calc(100vh-240px)] items-center justify-center py-16"><div className="w-full max-w-md"><p className="eyebrow">Welcome back</p><h1 className="mt-3 font-display text-5xl text-espresso">Your campus table awaits.</h1><p className="mt-4 text-sm leading-6 text-muted">Sign in to order ahead, track pickup, and keep your cart in sync.</p><div className="surface mt-8 grid gap-5 p-6 sm:p-8"><GoogleAuthButton intent="signin" /><div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-muted"><span className="h-px flex-1 bg-espresso/10" />or<span className="h-px flex-1 bg-espresso/10" /></div><form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">{verifiedMessage && <p role="status" aria-live="polite" className="rounded-2xl bg-ember/10 p-3 text-sm text-espresso">Your email is verified. You can sign in now.</p>}{error && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}{verificationEmail && <Link to={`/verify-email?email=${encodeURIComponent(verificationEmail)}`} className="mt-2 block font-semibold text-ember">Resend verification</Link>}</p>}<div><Input label="University email" type="email" autoComplete="email" placeholder="you@university.edu" {...register('email')} />{errors.email && <p className="mt-1 text-xs text-red-700">{errors.email.message}</p>}</div><div><Input label="Password" type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} />{errors.password && <p className="mt-1 text-xs text-red-700">{errors.password.message}</p>}<Link className="mt-2 inline-flex text-xs font-semibold text-ember" to="/forgot-password">Forgot password?</Link></div><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign in'}</Button><p className="text-center text-sm text-muted">New to campus cafeteria? <Link to="/register" className="font-semibold text-ember">Create an account</Link></p></form></div></div></div>;
}
