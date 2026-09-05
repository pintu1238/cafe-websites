import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { googleAuthUrl, register as registerAccount } from '../api/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { getApiError } from '../lib/errors';
import { queryClient } from '../lib/query-client';

const schema = z.object({ fullName: z.string().min(2, 'Enter your full name.'), email: z.string().email('Enter a valid university email.'), password: z.string().min(8, 'Use at least 8 characters.'), universityId: z.string().optional(), studentId: z.string().optional() });
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const onSubmit = async (values: FormValues) => {
    setError('');
    try {
      const result = await registerAccount(values);
      if (result.verificationRequired) {
        navigate(`/verify-email?email=${encodeURIComponent(values.email.trim().toLowerCase())}`, { replace: true });
      } else {
        await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        navigate('/', { replace: true });
      }
    } catch (requestError) {
      setError(getApiError(requestError, 'We could not create your account. Please try again.'));
    }
  };

  return <div className="section-shell flex min-h-[calc(100vh-240px)] items-center justify-center py-16"><div className="w-full max-w-lg"><p className="eyebrow">Made for your day</p><h1 className="mt-3 font-display text-5xl text-espresso">Join the campus table.</h1><p className="mt-4 text-sm leading-6 text-muted">Create a customer account and keep your pickup plans in one place.</p><div className="surface mt-8 grid gap-5 p-6 sm:p-8"><a className="button-secondary" href={googleAuthUrl()}>Continue with Google</a><div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-muted"><span className="h-px flex-1 bg-espresso/10" />or<span className="h-px flex-1 bg-espresso/10" /></div><form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 sm:grid-cols-2">{error && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{error}</p>}<div className="sm:col-span-2"><Input label="Full name" autoComplete="name" placeholder="Aarav Mehta" {...register('fullName')} />{errors.fullName && <p className="mt-1 text-xs text-red-700">{errors.fullName.message}</p>}</div><div className="sm:col-span-2"><Input label="University email" type="email" autoComplete="email" placeholder="you@university.edu" {...register('email')} />{errors.email && <p className="mt-1 text-xs text-red-700">{errors.email.message}</p>}</div><div><Input label="University ID (optional)" placeholder="UNI-001" {...register('universityId')} /></div><div><Input label="Student ID (optional)" placeholder="STU-2026-001" {...register('studentId')} /></div><div className="sm:col-span-2"><Input label="Password" type="password" autoComplete="new-password" placeholder="At least 8 characters" {...register('password')} />{errors.password && <p className="mt-1 text-xs text-red-700">{errors.password.message}</p>}</div><Button className="sm:col-span-2" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating account…' : 'Create account'}</Button><p className="text-center text-sm text-muted sm:col-span-2">Already have an account? <Link to="/login" className="font-semibold text-ember">Sign in</Link></p></form></div></div></div>;
}
