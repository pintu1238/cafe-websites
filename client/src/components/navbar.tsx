import { Bell, Search, ShoppingBag, UserRound } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BrandMark } from './brand-mark';
import { useAuth } from '../features/auth/auth-provider';
import { useCart } from '../features/cart/hooks';
import { cn } from '../lib/utils';

const navClass = ({ isActive }: { isActive: boolean }) => cn('text-sm font-semibold transition hover:text-basil', isActive ? 'text-basil' : 'text-espresso/70');

export function Navbar() {
  const { user } = useAuth();
  const cart = useCart(Boolean(user));
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const count = cart.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const destination = user?.role === 'SHOPKEEPER' ? '/shopkeeper' : '/orders';
  const firstName = typeof user?.fullName === 'string' && user.fullName.trim() ? user.fullName.trim().split(/\s+/)[0] : 'Account';
  const submitSearch = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); navigate(query.trim() ? `/shops?search=${encodeURIComponent(query.trim())}` : '/shops'); };
  return <header className="sticky top-0 z-30 border-b border-espresso/10 bg-white/95 backdrop-blur-xl"><div className="section-shell flex min-h-[76px] items-center justify-between gap-4"><Link to="/" aria-label="UniEats home"><BrandMark /></Link><nav className="site-primary-nav hidden items-center gap-7 lg:flex" aria-label="Primary navigation"><NavLink className={navClass} to="/">Home</NavLink><NavLink className={navClass} to="/shops">Menu</NavLink><NavLink className={navClass} to="/shops">Cafeterias</NavLink><a className="text-sm font-semibold text-espresso/70 transition hover:text-basil" href="/#how-it-works">About</a><a className="text-sm font-semibold text-espresso/70 transition hover:text-basil" href="/#contact">Contact</a></nav><form className="header-search header-search-desktop" onSubmit={submitSearch}><Search size={16} className="text-muted" /><input aria-label="Search for food or outlets" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for food, outlets..." /><button type="submit" aria-label="Search"><Search size={15} /></button></form><div className="flex items-center gap-1.5 sm:gap-2"><Link className="relative rounded-full p-2.5 text-espresso transition hover:bg-oat" to={user ? '/cart' : '/login'} aria-label="Cart"><ShoppingBag size={19} />{count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1 text-[10px] font-bold text-white">{count}</span>}</Link><Link className="hidden rounded-full p-2.5 text-espresso transition hover:bg-oat sm:block" to={user ? '/notifications' : '/login'} aria-label="Notifications"><Bell size={18} /></Link>{user ? <Link className="flex items-center gap-2 rounded-full bg-espresso px-3.5 py-2.5 text-sm font-bold text-white shadow-card" to={destination}><UserRound size={16} /><span className="hidden lg:inline">{firstName}</span></Link> : <Link className="button-primary px-4 py-2.5" to="/login">Sign In</Link>}</div></div><div className="section-shell header-search-mobile-wrap pb-3"><form className="header-search header-search-mobile" onSubmit={submitSearch}><Search size={16} className="text-muted" /><input aria-label="Mobile search for food or outlets" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for food, outlets..." /><button type="submit" aria-label="Search"><Search size={15} /></button></form></div></header>;
}
