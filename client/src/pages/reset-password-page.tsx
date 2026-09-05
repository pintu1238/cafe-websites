import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { resetPassword } from '../api/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { getApiError } from '../lib/errors';

const schema = z.object({ password: z.string().min(8, 'Use at least 8 characters.'), confirmPassword: z.string() }).refine((values) => values.password === values.confirmPassword, { message: 'Passwords must match.', path: ['confirmPassword'] });
type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const onSubmit = async (values: FormValues) => {
    setError('');
    try {
      await resetPassword({ token, password: values.password });
      setComplete(true);
    } catch (requestError) {
      setError(getApiError(requestError, 'We could not reset your password. Please request a new code.'));
    }
  };

  return <div className="section-shell flex min-h-[calc(100vh-240px)] items-center justify-center py-16"><div className="w-full max-w-md"><p className="eyebrow">New password</p><h1 className="mt-3 font-display text-5xl text-espresso">Make it memorable.</h1><p className="mt-4 text-sm leading-6 text-muted">Choose a strong password for your UniEats account.</p><div className="surface mt-8 grid gap-5 p-6 sm:p-8">{error && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{complete ? <div className="grid gap-4"><p className="text-sm leading-6 text-muted">Your password has been updated successfully.</p><Link className="button-primary" to="/login">Continue to sign in</Link></div> : !token ? <p className="text-sm leading-6 text-muted">This reset link is missing or expired. <Link className="font-semibold text-ember" to="/forgot-password">Request a new one</Link>.</p> : <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}><div><Input label="New password" type="password" autoComplete="new-password" placeholder="At least 8 characters" {...register('password')} />{errors.password && <p className="mt-1 text-xs text-red-700">{errors.password.message}</p>}</div><div><Input label="Confirm new password" type="password" autoComplete="new-password" placeholder="Repeat your new password" {...register('confirmPassword')} />{errors.confirmPassword && <p className="mt-1 text-xs text-red-700">{errors.confirmPassword.message}</p>}</div><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Set new password'}</Button></form>}</div></div></div>;
}
