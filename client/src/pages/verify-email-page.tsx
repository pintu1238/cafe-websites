import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resendVerification } from '../api/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { getApiError } from '../lib/errors';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true);
    try {
      await resendVerification({ email: email.trim().toLowerCase() });
      setMessage('Your verification email is on its way.');
    } catch (requestError) {
      setError(getApiError(requestError, 'We could not resend the verification email. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return <div className="section-shell flex min-h-[calc(100vh-240px)] items-center justify-center py-16"><div className="w-full max-w-md"><p className="eyebrow">One last step</p><h1 className="mt-3 font-display text-5xl text-espresso">Check your inbox.</h1><p className="mt-4 text-sm leading-6 text-muted">Open the verification link we sent to finish creating your cafeteria account.</p><form onSubmit={handleSubmit} className="surface mt-8 grid gap-5 p-6 sm:p-8">{message && <p role="status" aria-live="polite" className="rounded-2xl bg-ember/10 p-3 text-sm text-espresso">{message}</p>}{error && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<Input label="University email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /><Button type="submit" disabled={isSubmitting || !email.trim()}>{isSubmitting ? 'Sending…' : 'Resend verification'}</Button><p className="text-center text-sm text-muted"><Link to="/login" className="font-semibold text-ember">Back to sign in</Link></p></form></div></div>;
}
