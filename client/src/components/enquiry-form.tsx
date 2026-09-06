import { useRef, useState, type FormEvent } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { submitEnquiry, type EnquiryKind, type EnquiryReceipt } from '../api/enquiries';
import { getApiError } from '../lib/errors';

export function EnquiryForm({ kind }: { kind: EnquiryKind }) {
  const partner = kind === 'partner';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<EnquiryReceipt | null>(null);
  const inFlight = useRef(false);
  const attempt = useRef({ payload: '', key: '' });
  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlight.current) return;
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? '').trim();
    const payload = { kind, fullName: value('fullName'), email: value('email'), phone: value('phone'), campus: value('campus'), topic: partner ? 'Partnership' : value('topic'), orderNumber: value('orderNumber'), businessName: value('businessName'), message: value('message'), consent: data.get('consent') === 'on' };
    if (!/^[+\d\s()-]*$/.test(payload.phone)) {
      setError('Please enter a phone number using digits, spaces, +, brackets or hyphens.');
      return;
    }
    if (payload.fullName.length < 2 || payload.campus.length < 2 || payload.message.length < 20 || !payload.consent || (partner && (payload.businessName.length < 2 || payload.phone.replace(/\D/g, '').length < 7))) {
      setError('Please enter your name, campus, a message of at least 20 characters and consent. Partner applications also need a business name and phone number.');
      return;
    }
    const serialized = JSON.stringify(payload);
    if (attempt.current.payload !== serialized) attempt.current = { payload: serialized, key: crypto.randomUUID() };
    setError(''); setBusy(true); inFlight.current = true;
    try { setReceipt(await submitEnquiry({ ...payload, requestKey: attempt.current.key })); }
    catch (err) { setError(getApiError(err, 'Your request could not be saved. Your details are still here; please try again or contact us directly.')); }
    finally { inFlight.current = false; setBusy(false); }
  };
  if (receipt) return <section className="portal-form portal-success" role="status" aria-live="polite"><CheckCircle2 size={38} /><h2>{partner ? 'Application received.' : 'Your request is saved.'}</h2><p>Keep this reference when you contact our team:</p><strong className="portal-reference">{receipt.reference}</strong><p>{partner ? 'Our team will review your cafeteria details before any partner account is approved.' : 'Our team can use this reference to follow up with you at the email address you provided.'}</p><button className="portal-button secondary" onClick={() => { setReceipt(null); attempt.current = { payload: '', key: '' }; }}>Start another request</button></section>;
  return <form className="portal-form" onSubmit={onSubmit} aria-label={partner ? 'Partner application' : 'Contact request'} aria-busy={busy}>
    <div><p className="portal-eyebrow">{partner ? 'Start your partnership' : 'Tell us what you need'}</p><h2>{partner ? 'Your next chapter starts here.' : 'Let’s sort it out.'}</h2><p>All fields are required unless marked optional.</p></div>
    {error && <p className="portal-error" role="alert">{error}</p>}
    <fieldset disabled={busy} className="portal-fields">
      <label>Full name<input name="fullName" autoComplete="name" required minLength={2} maxLength={100} placeholder="Your name" /></label>
      <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" /></label>
      <label>Phone number{!partner && ' (optional)'}<input name="phone" type="tel" autoComplete="tel" required={partner} maxLength={30} placeholder="+91" /></label>
      <label>Campus<input name="campus" required minLength={2} maxLength={150} defaultValue="GNA University" /></label>
      {partner ? <label className="full">Cafeteria / business name<input name="businessName" required minLength={2} maxLength={160} autoComplete="organization" placeholder="Your cafeteria name" /></label> : <><label>What can we help with?<select name="topic" defaultValue={kind === 'support' ? 'Order help' : 'General question'}><option>General question</option><option>Order help</option><option>Account access</option><option>Feedback</option><option>Partnership</option></select></label><label>Order number (optional)<input name="orderNumber" maxLength={80} placeholder="From your order details" /></label></>}
      <label className="full">{partner ? 'Tell us about your cafeteria' : 'Message'}<textarea name="message" rows={5} required minLength={20} maxLength={4000} placeholder={partner ? 'Your location, cuisine, opening hours and how you serve students…' : 'Describe what happened and how we can help…'} /></label>
      <label className="portal-consent full"><input type="checkbox" name="consent" required /><span>I agree that UniEats may store these details and contact me about this request. Please do not include passwords or payment details.</span></label>
      <button className="portal-button full" type="submit">{busy ? 'Saving your request…' : partner ? 'Submit application' : 'Send request'}<Send size={16} /></button>
    </fieldset>
  </form>;
}
