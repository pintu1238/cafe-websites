import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Store, ShieldCheck } from 'lucide-react';
import { login, logout } from '../api/auth';
import { useAuth } from '../features/auth/auth-provider';
import { queryClient } from '../lib/query-client';
import { getApiError } from '../lib/errors';
import { PortalShell } from '../components/portal-shell';

export function VendorLoginPage() {
  const { user, isLoading } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget); setBusy(true); setError('');
    try {
      const account = await login({ email: String(form.get('email')).trim(), password: String(form.get('password')) });
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      if (account.role !== 'SHOPKEEPER') setError('This account does not have cafeteria access. Use your partner email or apply for a partnership.');
    } catch (err) { setError(getApiError(err)); } finally { setBusy(false); }
  };
  if (user?.role === 'SHOPKEEPER') return <Navigate to="/shopkeeper" replace />;
  return <PortalShell eyebrow="Cafeteria workspace" title="Welcome back, partner." intro="Sign in to manage incoming orders and keep campus pickups running smoothly." action={{ label: 'New here? Become a partner', to: '/partner' }}>
    <div className="portal-split"><section className="portal-vendor-benefits"><Store size={42} /><h2>Your kitchen, connected.</h2><p>Review incoming orders, update preparation status, and coordinate pickup from one workspace.</p><ul><li><ShieldCheck size={18} />Access is restricted to approved shopkeeper accounts.</li><li><ShieldCheck size={18} />Your team sees the orders assigned to your cafeteria.</li></ul><Link to="/resources">Read the partner guides →</Link></section>
      {isLoading ? <p role="status">Checking your session…</p> : user ? <section className="portal-form"><h2>You’re signed in to a different account.</h2><p>Switch to your approved partner account to access the cafeteria workspace.</p>{error && <p role="alert" className="portal-error">{error}</p>}<button className="portal-button" disabled={busy} onClick={async () => { setBusy(true); try { await logout(); await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }); } catch (err) { setError(getApiError(err)); } finally { setBusy(false); } }}>Sign out and switch account</button><Link to="/">Back to home</Link></section> : <form className="portal-form" onSubmit={submit}><p className="portal-eyebrow">Vendor login</p><h2>Open your workspace.</h2>{error && <p className="portal-error" role="alert">{error}</p>}<label>Partner email<input name="email" type="email" required autoComplete="username" placeholder="you@yourcafeteria.com" /></label><label>Password<input name="password" type="password" required autoComplete="current-password" /></label><Link to="/forgot-password">Forgot password?</Link><button className="portal-button" disabled={busy} type="submit">{busy ? 'Signing in…' : 'Sign in to workspace'}</button><p>Need access? <Link to="/partner">Submit a partner application.</Link></p></form>}
    </div>
  </PortalShell>;
}

