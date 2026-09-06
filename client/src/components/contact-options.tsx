import { Mail, MapPin, Phone, ArrowUpRight } from 'lucide-react';
import { contactDetails } from '../lib/contact-details';

export function ContactOptions() {
  return <div className="portal-contact-options">
    <a href={`mailto:${contactDetails.email}`}><Mail size={22} /><div><h3>Email us</h3><span>{contactDetails.email}</span><p>Accounts, feedback and general questions.</p></div><ArrowUpRight size={16} /></a>
    <a href={contactDetails.phoneHref}><Phone size={22} /><div><h3>Call UniEats</h3><span>{contactDetails.phone}</span><p>For a pickup issue, keep your order number handy.</p></div><ArrowUpRight size={16} /></a>
    <a href={contactDetails.mapsHref} target="_blank" rel="noreferrer"><MapPin size={22} /><div><h3>Our campus</h3><span>{contactDetails.campus}</span><p>{contactDetails.address}</p></div><ArrowUpRight size={16} /></a>
  </div>;
}

