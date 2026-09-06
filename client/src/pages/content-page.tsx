import { ArrowRight, CheckCircle2, ClipboardList, Coffee, HeartHandshake, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useContentPage } from '../features/content/hooks';
import { ErrorState } from '../components/ui/error-state';
import { LoadingSkeleton } from '../components/ui/loading-skeleton';
import { PortalShell } from '../components/portal-shell';
import { ContactOptions } from '../components/contact-options';
import { EnquiryForm } from '../components/enquiry-form';
import { FaqExplorer } from '../components/faq-explorer';
import { ResourceCards } from './resource-article-page';

const actions: Record<string, { label: string; to: string }> = {
  about: { label: 'Discover campus cafeterias', to: '/shops' },
  'how-it-works': { label: 'Find your next meal', to: '/menu' },
  partner: { label: 'Already a partner? Sign in', to: '/vendor/login' },
  support: { label: 'Track an existing order', to: '/orders' },
  resources: { label: 'Open vendor workspace', to: '/vendor/login' },
};
export function ContentPage() {
  const params = useParams();
  const location = useLocation();
  const slug = params.slug ?? location.pathname.split('/').filter(Boolean)[0] ?? 'about';
  const page = useContentPage(slug);
  if (page.isLoading) return <div className="section-shell py-12" aria-label="Loading page"><LoadingSkeleton className="h-48" /><LoadingSkeleton className="mt-6 h-64" /></div>;
  if (page.isError || !page.data) return <div className="section-shell py-16"><ErrorState message="We could not load this page. Please try again." /><button className="button-primary mt-5" onClick={() => void page.refetch()}>Try again</button></div>;
  const data = page.data;
  const formKind = slug === 'partner' ? 'partner' : slug === 'support' ? 'support' : slug === 'contact' ? 'contact' : null;
  const icons = [Coffee, ShieldCheck, HeartHandshake, ClipboardList];
  return <PortalShell eyebrow={data.eyebrow} title={data.title} intro={data.intro} action={actions[slug]}>
    {slug === 'faqs' ? <FaqExplorer sections={data.sections} /> : slug === 'resources' ? <ResourceCards /> : <>
      {slug === 'support' && <nav className="portal-quick-links" aria-label="Support shortcuts"><Link to="/orders"><ClipboardList size={23} /><strong>Order help</strong><span>Track your pickup →</span></Link><Link to="/forgot-password"><ShieldCheck size={23} /><strong>Account access</strong><span>Reset your password →</span></Link><Link to="/faqs"><Coffee size={23} /><strong>Quick answers</strong><span>Browse the FAQs →</span></Link></nav>}
      <div className={formKind ? 'portal-split' : 'portal-story-grid'}>
        <div className={formKind ? 'portal-info-column' : 'portal-story-cards'}>{data.sections.map((section, index) => { const Icon = icons[index % icons.length]; return <section className="portal-card" key={section.heading}>{slug === 'how-it-works' ? <span className="portal-step-number">{String(index + 1).padStart(2, '0')}</span> : <Icon size={25} className="portal-card-icon" />}<h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.items && <ul>{section.items.map((item) => <li key={item}><CheckCircle2 size={16} />{item}</li>)}</ul>}</section>; })}{(slug === 'contact' || slug === 'support') && <ContactOptions />}</div>
        {formKind && <EnquiryForm key={formKind} kind={formKind} />}
      </div>
      {slug === 'how-it-works' && <aside className="portal-note"><ShieldCheck size={24} /><div><h2>One cafeteria. One clear pickup.</h2><p>Your cart contains items from one cafeteria at a time. Review the amount and pay using the method shown at checkout.</p><Link to="/faqs">Read the ordering FAQs <ArrowRight size={15} /></Link></div></aside>}
      {slug === 'about' && <div className="portal-mission"><p className="portal-eyebrow">The UniEats idea</p><h2>Less time in a queue.<br />More time for campus life.</h2><p>A connected campus food experience for students and the people who feed them.</p><Link className="portal-button secondary" to="/partner">Build with us <ArrowRight size={16} /></Link></div>}
    </>}
  </PortalShell>;
}
