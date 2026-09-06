import { Linkedin, Mail, MapPin, Phone, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandMark } from './brand-mark';
import { contactDetails } from '../lib/contact-details';
import '../styles/portal.css';

export const footerGroups = [
  { title: 'Quick Links', links: [['Home', '/'], ['Menu', '/menu'], ['Cafeterias', '/shops'], ['About', '/about'], ['Contact', '/contact']] },
  { title: 'For Students', links: [['How It Works', '/how-it-works'], ['FAQs', '/faqs'], ['Offers', '/offers'], ['Support', '/support']] },
  { title: 'For Cafeteria Partners', links: [['Partner With Us', '/partner'], ['Vendor Login', '/vendor/login'], ['Resources', '/resources']] },
] as const;

export function Footer() {
  return <footer id="footer" className="site-footer"><div className="section-shell footer-grid">
    <div><Link to="/" aria-label="UniEats home"><BrandMark compact /></Link><p className="mt-5 max-w-xs text-sm leading-6 text-muted">A student-first cafeteria platform. Fresh meals, happy minds, brighter tomorrows.</p><div className="social-links"><a href="https://x.com/PintuKu10887227" aria-label="X" target="_blank" rel="noreferrer"><Twitter size={17} /></a><a href="https://www.linkedin.com/in/pintu-gupta-834254251/" aria-label="LinkedIn" target="_blank" rel="noreferrer"><Linkedin size={17} /></a></div></div>
    {footerGroups.map((group) => <nav key={group.title} aria-label={group.title}><p className="footer-title">{group.title}</p><div className="footer-links">{group.links.map(([label, to]) => <Link key={to} to={to}>{label}</Link>)}</div></nav>)}
    <div><p className="footer-title">Contact Us</p><address className="footer-contact"><a href={`mailto:${contactDetails.email}`}><Mail size={16} aria-hidden="true" /><span>{contactDetails.email}</span></a><a className="footer-phone" href={contactDetails.phoneHref}><Phone size={16} aria-hidden="true" /><span>{contactDetails.phone}</span></a><a href={contactDetails.mapsHref} target="_blank" rel="noreferrer"><MapPin size={16} aria-hidden="true" /><span>GNA UNIVERSITY,<br />{contactDetails.address}</span></a></address></div>
  </div><div className="section-shell footer-bottom"><span>© {new Date().getFullYear()} UniEats. All rights reserved.</span><span>Made with <span className="text-ember">♥</span> for students</span></div></footer>;
}
