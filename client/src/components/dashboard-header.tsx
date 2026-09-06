import { MapPin, Menu, Search, ShoppingCart, UserRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandMark } from './brand-mark';
import { ProfileAvatar } from './profile-avatar';
import type { User } from '../types/api';

type DashboardHeaderProps = { user: User | null; cartCount: number; onMenuToggle: () => void };

export function DashboardHeader({ user, cartCount, onMenuToggle }: DashboardHeaderProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const firstName = user?.fullName?.split(' ')[0] ?? 'Vicky';
  const submitSearch = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); navigate(query.trim() ? `/shops?search=${encodeURIComponent(query.trim())}` : '/shops'); };
  return <header className="dashboard-header">
    <Link className="dashboard-mobile-brand" to="/" aria-label="UniEats home"><BrandMark compact /></Link><button className="dashboard-menu-button" type="button" onClick={onMenuToggle} aria-label="Open navigation"><Menu size={20} /></button>
    <form className="dashboard-search" onSubmit={submitSearch}><Search size={17} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for food, cafeterias, or cuisines..." aria-label="Search for food, cafeterias, or cuisines" /><button type="submit" aria-label="Search"><Search size={16} /></button></form>
    <div className="dashboard-header-actions"><div className="dashboard-campus" aria-label="Current campus"><MapPin size={19} /><span><strong>Your Campus</strong><small>Main Campus</small></span><span className="dashboard-chevron">⌄</span></div><Link className="dashboard-cart" to={user ? '/cart' : '/login'} aria-label="Cart"><ShoppingCart size={21} />{cartCount > 0 && <span>{cartCount}</span>}</Link><Link className="dashboard-profile" to={user ? '/notifications' : '/login'} aria-label="Open profile"><ProfileAvatar className="dashboard-avatar" imageUrl={user?.profileImageUrl} fallback={<UserRound size={17} />} /><span><strong>Hi, {firstName}</strong><small>Student</small></span></Link></div>
  </header>;
}
