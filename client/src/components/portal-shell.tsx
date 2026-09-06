import { useEffect, type ReactNode } from 'react';
import { ArrowRight, ChevronRight, Leaf } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/portal.css';

type Props = { eyebrow: string; title: string; intro: string; children: ReactNode; action?: { label: string; to: string }; breadcrumb?: string };
export function PortalShell({ eyebrow, title, intro, children, action, breadcrumb }: Props) {
  const { pathname, hash } = useLocation();
  useEffect(() => { document.title = `${eyebrow} | UniEats`; }, [eyebrow]);
  useEffect(() => { if (!hash && window.scrollY > 0) window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }, [pathname, hash]);
  return <div className="portal section-shell">
    <nav className="portal-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><ChevronRight size={14} /><span aria-current="page">{breadcrumb ?? eyebrow}</span></nav>
    <header className="portal-hero"><div><p className="portal-eyebrow"><Leaf size={15} />{eyebrow}</p><h1>{title}</h1><p className="portal-lead">{intro}</p>{action && <Link className="portal-button" to={action.to}>{action.label}<ArrowRight size={17} /></Link>}</div><div className="portal-hero-mark" aria-hidden="true"><Leaf size={64} /><span>GOOD FOOD.<br />BETTER CAMPUS DAYS.</span></div></header>
    {children}
    <aside className="portal-bottom-cta"><div><p className="portal-eyebrow">Made for your campus</p><h2>A little help. A better day.</h2><p>Find an answer, discover your next meal, or talk to our team.</p></div><div className="portal-actions"><Link className="portal-button" to="/menu">Explore the menu <ArrowRight size={17} /></Link><Link className="portal-button secondary" to="/support">Get support</Link></div></aside>
  </div>;
}
